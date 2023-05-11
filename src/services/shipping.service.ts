import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class ShippingsService extends ResolversOperationsService {
  collection = COLLECTIONS.SHIPPINGS;
  catalogName = 'Paqueterias';
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
      filter = { active: { $ne: false }, 'description': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'description': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'description': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      shippings: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      shipping: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      shippingId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const shipping = this.getVariables().shipping;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(shipping?.description || '')) {
      return {
        status: false,
        message: `La Paqueteria no se ha especificado correctamente`,
        shipping: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(shipping?.description || '')) {
      return {
        status: false,
        message: `La Paqueteria ya existe en la base de datos, intenta con otro proveedor`,
        shipping: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const shippingObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      name: shipping?.name,
      slug: slugify(shipping?.name || '', { lower: true }),
      description: shipping?.description,
      large_description: shipping?.large_description,
      addres: shipping?.addres,
      contact: shipping?.contact,
      phone: shipping?.phone,
      web: shipping?.web,
      url_base_api: shipping?.url_base_api,
      url_base_api_order: shipping?.url_base_api_order,
      url_base_api_shipments: shipping?.url_base_api_shipments,
      token: shipping?.token,
      apis: shipping?.apis,
      active: true,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, shippingObject, 'proveedor');
    return {
      status: result.status,
      message: result.message,
      shipping: result.item
    };

  }

  // Modificar Item
  async modify() {
    const shipping = this.getVariables().shipping;
    // Comprobar que la marca no sea nula.
    if (shipping === null) {
      return {
        status: false,
        mesage: 'Marca no definida, verificar datos.',
        shipping: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(shipping?.description || '')) {
      return {
        status: false,
        message: `La Paqueteria no se ha especificado correctamente`,
        shipping: null
      };
    }
    const objectUpdate = {
      name: shipping?.name,
      slug: slugify(shipping?.name || '', { lower: true }),
      description: shipping?.description,
      large_description: shipping?.large_description,
      addres: shipping?.addres,
      contact: shipping?.contact,
      phone: shipping?.phone,
      web: shipping?.web,
      url_base_api: shipping?.url_base_api,
      token: shipping?.token,
      apis: shipping?.apis,
    };
    // Conocer el id del proveedor
    const filter = { id: shipping?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'proveedors');
    return {
      status: result.status,
      message: result.message,
      shipping: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Proveedor no se ha especificado correctamente.`,
        shipping: null
      };
    }
    const result = await this.del(this.collection, { id }, 'proveedor');
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
        message: `El ID del Proveedor no se ha especificado correctamente.`,
        shipping: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'proveedor');
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

export default ShippingsService;