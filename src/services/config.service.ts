import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class ConfigsService extends ResolversOperationsService {
  collection = COLLECTIONS.CONFIG;
  catalogName = 'Config';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      config: result.item
    };
  }

  // Anadir Item
  async insert() {
    const config = this.getVariables().config;
    // Comprobar que es un valor mayor que cero, ni es indefinido
    if (!this.checkNumber(config?.exchange_rate || 0)) {
      return {
        status: false,
        message: `La Configuracion no se ha especificado correctamente`,
        config: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const configObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      message: config?.message,
      exchange_rate: config?.exchange_rate,
      offer: config?.offer,
      minimum_offer: config?.minimum_offer,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, configObject, 'config');
    return {
      status: result.status,
      message: result.message,
      config: result.item
    };

  }

  // Modificar Item
  async modify() {
    const config = this.getVariables().config;
    // Comprobar que la config no sea nula.
    if (config === null) {
      return {
        status: false,
        mesage: 'Configuracion no definida, verificar datos.',
        config: null
      };
    }
    // Comprobar que es un valor mayor que cero
    if (!this.checkNumber(config?.exchange_rate || 0)) {
      return {
        status: false,
        message: `La Configuracion no se ha especificado correctamente`,
        config: null
      };
    }
    const objectUpdate = {
      message: config?.message,
      exchange_rate: config?.exchange_rate,
      minimum_offer: config?.minimum_offer,
      offer: config?.offer
    };
    // Conocer el id de la config
    const filter = { id: config?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'config');
    return {
      status: result.status,
      message: result.message,
      config: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID de la Configuracion no se ha especificado correctamente.`,
        config: null
      };
    }
    const result = await this.del(this.collection, { id }, 'config');
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
        config: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'config');
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

  // Comprobar que es un valor mayor que cero
  private checkNumber(value: number) {
    return (value === 0 || value === undefined) ? false : true;
  }

}

export default ConfigsService;