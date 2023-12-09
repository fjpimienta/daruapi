import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { asignDocumentId, findOneElement } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class WelcomesService extends ResolversOperationsService {
  collection = COLLECTIONS.WELCOMES;
  catalogName = 'welcomes';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

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
      filter = { active: { $ne: false }, 'email': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'email': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'email': regExp };
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
      welcomes: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      welcome: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      welcomeId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const welcome = this.getVariables().welcome;
    // Comprobar que es un valor mayor que cero, ni es indefinido
    if (!this.checkData(welcome?.email || '')) {
      return {
        status: false,
        message: `El correo no se ha especificado correctamente`,
        welcome: null
      };
    }

    // Comprobar que no existe el ID
    if (await this.checkIdDatabase(welcome?.id || '')) {
      return {
        status: false,
        message: `El id ya existe en la base de datos`,
        welcome: null
      };
    }

    // Comprobar que no existe el correo
    if (await this.checkEmailDatabase(welcome?.email || '')) {
      return {
        status: false,
        message: `El correo ya existe en la base de datos, intenta con otro correo`,
        welcome: null
      };
    }

    // Comprobar que no existe el nombre
    if (await this.checkNameDatabase(welcome?.name || '')) {
      return {
        status: false,
        message: `El nombre ya existe en la base de datos, intenta con otro nombre`,
        welcome: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const welcomeObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      email: welcome?.email,
      name: welcome?.name,
      cupon: welcome?.cupon,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, welcomeObject, 'welcome');
    return {
      status: result.status,
      message: result.message,
      welcome: result.item
    };

  }

  // Modificar Item
  async modify() {
    const welcome = this.getVariables().welcome;
    console.log('welcome: ', welcome);
    // Comprobar que la welcome no sea nula.
    if (welcome === null) {
      return {
        status: false,
        mesage: 'Configuracion no definida, verificar datos.',
        welcome: null
      };
    }
    // Comprobar que es un valor mayor que cero
    if (!this.checkData(welcome?.email || '')) {
      return {
        status: false,
        message: `Los datos del correo no se han especificado correctamente`,
        welcome: null
      };
    }
    const objectUpdate = {
      email: welcome?.email,
      name: welcome?.name,
      cupon: welcome?.cupon
    };
    // Conocer el id de la welcome
    const filter = { id: welcome?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'welcome');
    return {
      status: result.status,
      message: result.message,
      welcome: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del email no se ha especificado correctamente.`,
        welcome: null
      };
    }
    const result = await this.del(this.collection, { id }, 'welcome');
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
        message: `El ID de la Configuracion no se ha especificado correctamente.`,
        welcome: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'welcome');
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
  private async checkIdDatabase(value: string) {
    return await findOneElement(this.getDB(), this.collection, {
      id: value
    });
  }

  // Verificar existencia en Base de Datos
  private async checkEmailDatabase(value: string) {
    return await findOneElement(this.getDB(), this.collection, {
      email: value
    });
  }

  // Verificar existencia en Base de Datos
  private async checkNameDatabase(value: string) {
    return await findOneElement(this.getDB(), this.collection, {
      name: value
    });
  }
}

export default WelcomesService;