import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';
import apiProveedoresLists from '../data/apis.json';

class ApiproveedoresService extends ResolversOperationsService {
  collection = COLLECTIONS.APIPROVEEDORES;
  catalogName = 'Apiproveedores';
  listaApiproveedores = apiProveedoresLists.apiprovedores;

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
      filter = { active: { $ne: false }, 'name': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'name': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'name': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = {
      info: {
        page: 1,
        skip: 1,
        total: this.listaApiproveedores.length,
        itemsPage: 1,
        pages: 10
      },
      status: true,
      message: 'Lista de apis de proveedores',
      apiproveedores: this.listaApiproveedores
    };
    return await result;
  }

  // Obtener detalles del item
  async details(variables: IVariables) {
    const filterName = variables;
    const apiproveedor = this.findApiproveedor(variables);
    if (apiproveedor) {
      return {
        status: true,
        message: 'Api de Proveedor encontrada',
        apiproveedor: apiproveedor
      };
    }
    return {
      status: false,
      message: 'No se encontró la Api del Proveedor. Verificar'
    };

    // const result = await this.get(this.collection);
    // return {
    //   status: result.status,
    //   message: result.message,
    //   apiproveedor: result.item
    // };
  }

  findApiproveedor(variables: IVariables) {
    return this.listaApiproveedores.find(item => item.slug === variables.slug);
  }


  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      apiproveedorId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const apiproveedor = this.getVariables().apiproveedor;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(apiproveedor?.name || '')) {
      return {
        status: false,
        message: `La Etiqueta no se ha especificado correctamente`,
        apiproveedor: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(apiproveedor?.name || '')) {
      return {
        status: false,
        message: `La Etiqueta ya existe en la base de datos, intenta con otra etiqueta`,
        apiproveedor: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const apiproveedorObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      name: apiproveedor?.name,
      slug: slugify(apiproveedor?.name || '', { lower: true }),
      active: true,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, apiproveedorObject, 'etiqueta');
    return {
      status: result.status,
      message: result.message,
      apiproveedor: result.item
    };

  }

  // Modificar Item
  async modify() {
    const apiproveedor = this.getVariables().apiproveedor;
    // Comprobar que la etiqueta no sea nula.
    if (apiproveedor === null) {
      return {
        status: false,
        mesage: 'Etiqueta no definida, verificar datos.',
        apiproveedor: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(apiproveedor?.name || '')) {
      return {
        status: false,
        message: `La Etiqueta no se ha especificado correctamente`,
        apiproveedor: null
      };
    }
    const objectUpdate = {
      name: apiproveedor?.name,
      slug: slugify(apiproveedor?.name || '', { lower: true })
    };
    // Conocer el id de la marcar
    const filter = { id: apiproveedor?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'etiquetas');
    return {
      status: result.status,
      message: result.message,
      apiproveedor: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID de la Etiqueta no se ha especificado correctamente.`,
        apiproveedor: null
      };
    }
    const result = await this.del(this.collection, { id }, 'etiqueta');
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
        message: `El ID de la Etiqueta no se ha especificado correctamente.`,
        apiproveedor: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'etiqueta');
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

export default ApiproveedoresService;
