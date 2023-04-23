import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class SubcategoriesService extends ResolversOperationsService {
  collection = COLLECTIONS.SUBCATEGORIES;
  catalogName = 'Subcategorias';
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
      subcategories: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      subcategorie: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      subcategorieId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const subcategorie = this.getVariables().subcategorie;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(subcategorie?.description || '')) {
      return {
        status: false,
        message: `La Subcategoria no se ha especificado correctamente`,
        subcategorie: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(subcategorie?.description || '')) {
      return {
        status: false,
        message: `La Subcategoria ya existe en la base de datos, intenta con otro subcategoria`,
        subcategorie: null
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
    const categorieObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      description: subcategorie?.description,
      slug: slugify(subcategorie?.description || '', { lower: true }),
      order: subcategorie?.order,
      active: true,
      registerDate: new Date().toISOString()//,
      // suppliersCat
    };
    const result = await this.add(this.collection, categorieObject, 'subcategoria');
    return {
      status: result.status,
      message: result.message,
      subcategorie: result.item
    };

  }

  // Modificar Item
  async modify() {
    const id = this.getVariables().id;
    const subcategorie = this.getVariables().subcategorie;
    // Comprobar que la subcategoria no sea nula.
    if (subcategorie === null) {
      return {
        status: false,
        mesage: 'Marca no definida, verificar datos.',
        subcategorie: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(subcategorie?.description || '')) {
      return {
        status: false,
        message: `La Subcategoria no se ha especificado correctamente`,
        subcategorie: null
      };
    }
    const objectUpdate = {
      description: subcategorie?.description,
      slug: slugify(subcategorie?.description || '', { lower: true }),
      order: subcategorie?.order
    };
    // Conocer el id de la marca
    const filter = { id: subcategorie?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'subcategorias');
    return {
      status: result.status,
      message: result.message,
      subcategorie: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID de la Subcategoria no se ha especificado correctamente.`,
        subcategorie: null
      };
    }
    const result = await this.del(this.collection, { id }, 'subcategoria');
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
        message: `El ID de la Subcategoria no se ha especificado correctamente.`,
        subcategorie: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'subcategoria');
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

export default SubcategoriesService;