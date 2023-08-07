import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class ModelsService extends ResolversOperationsService {
  collection = COLLECTIONS.MODELS;
  catalogName = 'Modelos';
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
      models: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      model: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      modelId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const model = this.getVariables().model;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(model?.description || '')) {
      return {
        status: false,
        message: `El Modelo no se ha especificado correctamente`,
        model: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(model?.description || '')) {
      return {
        status: false,
        message: `El Modelo ya existe en la base de datos, intenta con otro modelo`,
        model: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    // // Se agrega temporalmente el provedor principal (La empresa actual)
    // const supplierCat = {
    //   id: '1',
    //   name: 'DARU',
    //   slug: 'daru'
    // };
    // let suppliersCat = [supplierCat];
    const modelObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      description: model?.description,
      slug: slugify(model?.description || '', { lower: true }),
      order: model?.order,
      active: true,
      registerDate: new Date()//,
      // suppliersCat
    };
    const result = await this.add(this.collection, modelObject, 'modelo');
    return {
      status: result.status,
      message: result.message,
      model: result.item
    };

  }

  // Modificar Item
  async modify() {
    const model = this.getVariables().model;
    // Comprobar que el modelo no sea nulo.
    if (model === null) {
      return {
        status: false,
        mesage: 'Marca no definida, verificar datos.',
        model: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(model?.description || '')) {
      return {
        status: false,
        message: `El Modelo no se ha especificado correctamente`,
        model: null
      };
    }
    const objectUpdate = {
      description: model?.description,
      slug: slugify(model?.description || '', { lower: true }),
      order: model?.order
    };
    // Conocer el id de la marca
    const filter = { id: model?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'modelos');
    return {
      status: result.status,
      message: result.message,
      model: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Modelo no se ha especificado correctamente.`,
        model: null
      };
    }
    const result = await this.del(this.collection, { id }, 'modelo');
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
        message: `El ID del Modelo no se ha especificado correctamente.`,
        model: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'modelo');
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

export default ModelsService;