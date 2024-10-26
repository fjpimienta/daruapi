import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class DictionarysService extends ResolversOperationsService {
  collection = COLLECTIONS.DICTIONARY;
  catalogName = 'Diccionario de Datos';
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
      filter = { active: { $ne: false }, 'headerName': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'headerName': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'headerName': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const sort = { headerName: 1, orderAttribute: 1 };
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter, sort);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      dictionarys: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      dictionary: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      dictionaryId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const dictionary = this.getVariables().dictionary;
    console.log('dictionary: ', dictionary);
    if (!this.checkData(dictionary?.headerName || '')) {
      return {
        status: false,
        message: `El Grupo del atributo no se ha especificado correctamente`,
        dictionary: null
      };
    }
    if (!this.checkData(dictionary?.attributeName || '')) {
      return {
        status: false,
        message: `El atributo no se ha especificado correctamente`,
        dictionary: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabaseWithDependency(dictionary?.headerName || '', dictionary?.attributeName || '')) {
      return {
        status: false,
        message: `El Dato del Diccionario ya existe en la base de datos, intenta con otra diccionario`,
        dictionary: null
      };
    }

    const dictionaryObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      orderHeader: dictionary?.orderHeader,
      headerName: dictionary?.headerName,
      headerDisplay: dictionary?.headerDisplay,
      orderAttribute: dictionary?.orderAttribute,
      attributeName: dictionary?.attributeName,
      attributeDisplay: dictionary?.attributeDisplay,
      active: true,
      registerDate: new Date()
    };
    console.log('dictionaryObject: ', dictionaryObject);

    const result = await this.add(this.collection, dictionaryObject, 'diccionario');
    console.log('result: ', result);
    return {
      status: result.status,
      message: result.message,
      dictionary: result.item
    };

  }

  // Modificar Item
  async modify() {
    const dictionary = this.getVariables().dictionary;
    // Comprobar que la diccionario no sea nula.
    if (dictionary === null) {
      return {
        status: false,
        mesage: 'Dato de Diccionario no definido, verificar datos.',
        dictionary: null
      };
    }
    if (!this.checkData(dictionary?.headerName || '')) {
      return {
        status: false,
        message: `El Grupo del atributo no se ha especificado correctamente`,
        dictionary: null
      };
    }
    if (!this.checkData(dictionary?.attributeName || '')) {
      return {
        status: false,
        message: `El atributo no se ha especificado correctamente`,
        dictionary: null
      };
    }
    const objectUpdate = {
      attributeName: dictionary?.attributeName,
      attributeDisplay: dictionary?.attributeDisplay,
      headerName: dictionary?.headerName,
      headerDisplay: dictionary?.headerDisplay
    };
    // Conocer el id de la diccionario
    const filter = { id: dictionary?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'dictionarys');
    return {
      status: result.status,
      message: result.message,
      dictionary: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID de la Dato de Diccionario no se ha especificado correctamente.`,
        dictionary: null
      };
    }
    const result = await this.del(this.collection, { id }, 'diccionario');
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
        message: `El ID de la Dato de Diccionario no se ha especificado correctamente.`,
        dictionary: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'diccionario');
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
      attributeName: value
    });
  }

  // Verificar existencia en Base de Datos
  private async checkInDatabaseWithDependency(value1: string, value2: string) {
    console.log('value1: ', value1);
    console.log('value2: ', value2);
    return await findOneElement(this.getDB(), this.collection, {
      headerName: value1,
      attributeName: value2
    });
  }
}

export default DictionarysService;