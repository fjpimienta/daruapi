import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findAllElements, findElements, findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';
import { pagination } from '../lib/pagination';

class OrdersService extends ResolversOperationsService {
  collection = COLLECTIONS.ORDERS;
  catalogName = 'Ordenes';

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion
  async items(variables: IVariables) {
    const active = variables.active;
    const filterName = variables.filterName;
    let filter: object;
    const regExp = new RegExp('.*' + filterName + '.*');
    if (filterName === '' || filterName === undefined) {
      filter = { active: { $ne: false } };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = {};
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false } };
      }
    } else {
      filter = { active: { $ne: false }, 'user.email': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'user.email': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'user.email': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      orders: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      order: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      orderId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const order = this.getVariables().order;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(order?.name || '')) {
      return {
        status: false,
        message: `La Orden no se ha especificado correctamente`,
        order: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(order?.name || '')) {
      return {
        status: false,
        message: `La Orden ya existe en la base de datos, intenta con otra nombre`,
        order: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const orderObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      name: order?.name,
      user: order?.user,
      charge: order?.charge,
      cartitems: order?.cartitems,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, orderObject, 'orden');
    return {
      status: result.status,
      message: result.message,
      order: result.item
    };

  }


  // Modificar Item
  async modify() {
    const order = this.getVariables().order;
    // Comprobar que el orden no sea nulo.
    if (order === null) {
      return {
        status: false,
        mesage: 'Orden no definida, verificar datos.',
        order: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(order?.name || '')) {
      return {
        status: false,
        message: `La Orden no se ha especificado correctamente`,
        order: null
      };
    }
    const objectUpdate = {
      name: order?.name,
            
    };
    // Conocer el id de la marcar
    const filter = { id: order?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'ordenes');
    return {
      status: result.status,
      message: result.message,
      order: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID de la Orden no se ha especificado correctamente.`,
        order: null
      };
    }
    const result = await this.del(this.collection, { id }, 'orden');
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
        message: `El ID de la Orden no se ha especificado correctamente.`,
        order: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'orden');
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
      name: value
    });
  }
}

export default OrdersService;