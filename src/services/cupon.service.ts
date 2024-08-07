import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { ICatalog } from '../interfaces/catalog.interface';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findElements, findOneElement } from '../lib/db-operations';
import { pagination } from '../lib/pagination';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class CuponsService extends ResolversOperationsService {
  collection = COLLECTIONS.CUPONS;
  catalogName = 'Cupones';
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
      filter = { active: { $ne: false }, 'description': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'description': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'description': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const sort = { order: 1 };
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter, sort);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      cupons: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const cupon = this.getVariables().cupon;
    if (cupon) {
      const result = await this.getByField(this.collection);
      return {
        status: result.status,
        message: result.message,
        cupon: result.item
      };
    }
    return await {
      status: false,
      message: 'Lo sentimos, por el momento no contamos con ningún cupón de descuento.',
      supplierName: null
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      cuponId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const cupon = this.getVariables().cupon;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(cupon?.description || '')) {
      return {
        status: false,
        message: `Lo sentimos, el cupón que estás utilizando no es correcto.`,
        cupon: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(cupon?.description || '')) {
      return {
        status: false,
        message: `Lo sentimos, el cupón que estás utilizando ya existe en nuestra base de datos, por favor intenta con otro.`,
        cupon: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const cuponObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      cupon: cupon?.cupon,
      description: cupon?.description,
      typeDiscount: cupon?.typeDiscount,
      amountDiscount: cupon?.amountDiscount,
      minimumPurchase: cupon?.minimumPurchase,
      active: true,
      registerDate: new Date()//,
    };
    const result = await this.add(this.collection, cuponObject, 'cupon');
    return {
      status: result.status,
      message: result.message,
      cupon: result.item
    };

  }

  // Modificar Item
  async modify() {
    const cupon = this.getVariables().cupon;
    // Comprobar que el cupon no sea nula.
    if (cupon === null) {
      return {
        status: false,
        mesage: 'Cupon no definido, verificar datos.',
        cupon: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(cupon?.cupon || '')) {
      return {
        status: false,
        message: `Lo sentimos, el cupón que estás utilizando no es correcto.`,
        cupon: null
      };
    }
    const objectUpdate = {
      cupon: cupon?.cupon,
      description: cupon?.description,
      typeDiscount: cupon?.typeDiscount,
      amountDiscount: cupon?.amountDiscount,
      minimumPurchase: cupon?.minimumPurchase,
      active: cupon?.active
    };
    // Conocer el id del cupon
    const filter = { id: cupon?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'cupones');
    return {
      status: result.status,
      message: result.message,
      cupon: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `Lo sentimos, el cupón que estás utilizando no es correcto.`,
        cupon: null
      };
    }
    const result = await this.del(this.collection, { id }, 'cupon');
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
        message: `Lo sentimos, el cupón que estás utilizando no es correcto.`,
        cupon: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'cupon');
    if (!result.status) {
      return {
        status: result.status,
        message: result.message
      };
    }
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
      description: value
    });
  }
}

export default CuponsService;