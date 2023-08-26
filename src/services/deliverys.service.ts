import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { IDelivery } from '../interfaces/delivery.interface';
import { asignDocumentId, findElements, findOneElement } from '../lib/db-operations';
import { pagination } from '../lib/pagination';
import ResolversOperationsService from './resolvers-operaciones.service';

class DeliverysService extends ResolversOperationsService {
  collection = COLLECTIONS.DELIVERYS;
  catalogName = 'Deliverys';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion
  async items(variables: IVariables) {
    const active = variables.active;
    const filterName = variables.filterName;
    let filter: object;
    const regExp = new RegExp('.*' + filterName + '.*', 'i');
    if (filterName === '' || filterName === undefined) {
      filter = { active: { $ne: false } };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = {};
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false } };
      }
    } else {
      filter = { active: { $ne: false }, 'sucursal': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'sucursal': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'sucursal': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      deliverys: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      delivery: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      deliveryId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const delivery = this.getVariables().delivery;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(delivery?.deliveryId || '')) {
      return {
        status: false,
        message: `El Delivery no se ha especificado correctamente`,
        delivery: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(delivery?.deliveryId || '')) {
      return {
        status: false,
        message: `El Delivery ya existe en la base de datos, intenta con otro almacen`,
        delivery: null
      };
    }

    const deliveryObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      deliveryId: delivery?.deliveryId,
      user: delivery?.user,
      warehouses: delivery?.warehouses,
      ordersCt: delivery?.ordersCt,
      ordersCva: delivery?.ordersCva,
      orderCtResponse: delivery?.orderCtResponse,
      orderCtConfirmResponse: delivery?.orderCtConfirmResponse,
      orderCvaResponse: delivery?.orderCvaResponse,
      statusError: delivery?.statusError,
      messageError: delivery?.messageError,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, deliveryObject, 'delivery');
    return {
      status: result.status,
      message: result.message,
      delivery: result.item
    };

  }

  // Modificar Item
  async modify() {
    const delivery = this.getVariables().delivery;
    // Comprobar que el almacen no sea nulo.
    if (delivery === null) {
      return {
        status: false,
        mesage: 'Delivery no definido, verificar datos.',
        delivery: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(delivery?.deliveryId || '')) {
      return {
        status: false,
        message: `El Delivery no se ha especificado correctamente`,
        delivery: null
      };
    }
    const objectUpdate = {
      deliveryId: delivery?.deliveryId,
      user: delivery?.user,
      warehouses: delivery?.warehouses,
      ordersCt: delivery?.ordersCt,
      ordersCva: delivery?.ordersCva,
      orderCtResponse: delivery?.orderCtResponse,
      orderCtConfirmResponse: delivery?.orderCtConfirmResponse,
      orderCvaResponse: delivery?.orderCvaResponse,
      statusError: delivery?.statusError,
      messageError: delivery?.messageError,
    };
    // Conocer el id del almacen
    const filter = { id: delivery?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'almacenes');
    return {
      status: result.status,
      message: result.message,
      delivery: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Delivery no se ha especificado correctamente.`,
        delivery: null
      };
    }
    const result = await this.del(this.collection, { id }, 'almacen');
    return {
      status: result.status,
      message: result.message
    };
  }

  // Bloquear item
  async unblock(unblock: boolean, admin: boolean) {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Delivery no se ha especificado correctamente.`,
        delivery: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'almacen');
    const action = (unblock) ? 'Activado' : 'Desactivado';
    return {
      status: result.status,
      message: (result.message) ? `${action} correctamente` : `No se ha ${action.toLowerCase()} comprobarlo por favor`
    };
  }

  // Comprobar que no esta en blanco ni es indefinido
  private checkData(value: string) {
    return (value === '' || value === undefined) ? false : true;
  }

  // Verificar existencia en Base de Datos
  private async checkInDatabase(value: string) {
    return await findOneElement(this.getDB(), this.collection, {
      almacen: value
    });
  }

}

export default DeliverysService;