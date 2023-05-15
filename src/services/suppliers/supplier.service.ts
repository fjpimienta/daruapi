import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../../config/constants';
import { IContextData } from '../../interfaces/context-data.interface';
import { IApisupplier } from '../../interfaces/suppliers/supplier.interface';
import { IVariables } from '../../interfaces/variable.interface';
import { findOneElement } from '../../lib/db-operations';
import { asignDocumentId } from '../../lib/db-operations';
import ResolversOperationsService from '../resolvers-operaciones.service';

class SuppliersService extends ResolversOperationsService {
  collection = COLLECTIONS.SUPPLIERS;
  catalogName = 'Proveedores';
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
      suppliers: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      supplier: result.item
    };
  }

  // Obtener la API filtrada por supplier, tipo y nombre.
  async api() {
    const name = this.getVariables().name;
    if (name) {
      const result = await this.getByFilters(this.collection);
      return await {
        status: result.status,
        message: result.message,
        apiSupplier: result.item
      };
    } else {
      const result = await this.get(this.collection);
      return {
        status: result.status,
        message: result.message,
        apiSupplier: result.item
      };
    }
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      supplierId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const supplier = this.getVariables().supplier;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(supplier?.description || '')) {
      return {
        status: false,
        message: `El Proveedor no se ha especificado correctamente`,
        supplier: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(supplier?.description || '')) {
      return {
        status: false,
        message: `El Proveedor ya existe en la base de datos, intenta con otro proveedor`,
        supplier: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const supplierObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      name: supplier?.name,
      slug: slugify(supplier?.name || '', { lower: true }),
      description: supplier?.description,
      large_description: supplier?.large_description,
      addres: supplier?.addres,
      contact: supplier?.contact,
      phone: supplier?.phone,
      web: supplier?.web,
      url_base_api: supplier?.url_base_api,
      url_base_api_order: supplier?.url_base_api_order,
      url_base_api_shipments: supplier?.url_base_api_shipments,
      token: supplier?.token,
      apis: supplier?.apis,
      active: true,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, supplierObject, 'proveedor');
    return {
      status: result.status,
      message: result.message,
      supplier: result.item
    };

  }

  // Modificar Item
  async modify() {
    const supplier = this.getVariables().supplier;
    // Comprobar que la marca no sea nula.
    if (supplier === null) {
      return {
        status: false,
        mesage: 'Marca no definida, verificar datos.',
        supplier: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(supplier?.description || '')) {
      return {
        status: false,
        message: `El Proveedor no se ha especificado correctamente`,
        supplier: null
      };
    }
    const objectUpdate = {
      name: supplier?.name,
      slug: slugify(supplier?.name || '', { lower: true }),
      description: supplier?.description,
      large_description: supplier?.large_description,
      addres: supplier?.addres,
      contact: supplier?.contact,
      phone: supplier?.phone,
      web: supplier?.web,
      url_base_api: supplier?.url_base_api,
      url_base_api_order: supplier?.url_base_api_order,
      url_base_api_shipments: supplier?.url_base_api_shipments,
      token: supplier?.token,
      apis: supplier?.apis,
    };
    // Conocer el id del proveedor
    const filter = { id: supplier?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'proveedors');
    return {
      status: result.status,
      message: result.message,
      supplier: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Proveedor no se ha especificado correctamente.`,
        supplier: null
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
        supplier: null
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

export default SuppliersService;