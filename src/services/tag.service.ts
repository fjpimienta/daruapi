import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class TagsService extends ResolversOperationsService {
  collection = COLLECTIONS.TAGS;
  catalogName = 'Tags';
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
      tags: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      tag: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      tagId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const tag = this.getVariables().tag;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(tag?.description || '')) {
      return {
        status: false,
        message: `La Etiqueta no se ha especificado correctamente`,
        tag: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(tag?.description || '')) {
      return {
        status: false,
        message: `La Etiqueta ya existe en la base de datos, intenta con otra etiqueta`,
        tag: null
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
    const tagObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      description: tag?.description,
      slug: slugify(tag?.description || '', { lower: true }),
      order: tag?.order,
      active: true,
      registerDate: new Date().toISOString()//,
      // suppliersCat
    };
    const result = await this.add(this.collection, tagObject, 'etiqueta');
    return {
      status: result.status,
      message: result.message,
      tag: result.item
    };

  }

  // Modificar Item
  async modify() {
    const tag = this.getVariables().tag;
    // Comprobar que la etiqueta no sea nula.
    if (tag === null) {
      return {
        status: false,
        mesage: 'Etiqueta no definida, verificar datos.',
        tag: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(tag?.description || '')) {
      return {
        status: false,
        message: `La Etiqueta no se ha especificado correctamente`,
        tag: null
      };
    }
    const objectUpdate = {
      description: tag?.description,
      slug: slugify(tag?.description || '', { lower: true }),
      order: tag?.order
    };
    // Conocer el id de la marcar
    const filter = { id: tag?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'etiquetas');
    return {
      status: result.status,
      message: result.message,
      tag: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID de la Etiqueta no se ha especificado correctamente.`,
        tag: null
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
        tag: null
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
      description: value
    });
  }
}

export default TagsService;