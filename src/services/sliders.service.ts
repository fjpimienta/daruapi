import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class SlidersService extends ResolversOperationsService {
  collection = COLLECTIONS.SLIDERS;
  catalogName = 'Sliders';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion
  async items(variables: IVariables) {
    const active = variables.active;
    const filterName = variables.filterName;
    const type = variables.type;
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
    if (type) {
      filter = { ...filter, ...{ type: { $eq: type } } };
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const sort = { order: 1 };
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter, sort);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      sliders: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      sliders: result.item
    };
  }

  // Anadir Item
  async insert() {
    const sliders = this.getVariables().sliders;
    // Comprobar que es un valor mayor que cero, ni es indefinido
    if (!this.checkData(sliders?.type || '')) {
      return {
        status: false,
        message: `Los sliders no se han especificado correctamente`,
        sliders: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const slidersObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      type: sliders?.type,
      title1: sliders?.title1,
      title2: sliders?.title2,
      subtitle: sliders?.subtitle,
      url: sliders?.url,
      urlTitle: sliders?.urlTitle,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, slidersObject, 'sliders');
    return {
      status: result.status,
      message: result.message,
      sliders: result.item
    };

  }

  // Modificar Item
  async modify() {
    const sliders = this.getVariables().sliders;
    // Comprobar que la sliders no sea nula.
    if (sliders === null) {
      return {
        status: false,
        mesage: 'Sliders no definidos, verificar datos.',
        sliders: null
      };
    }
    // Comprobar que es un valor mayor que cero
    if (!this.checkData(sliders?.type || '')) {
      return {
        status: false,
        message: `Los Sliders no se han especificado correctamente`,
        sliders: null
      };
    }
    const objectUpdate = {
      type: sliders?.type,
      imageUrl: sliders?.imageUrl,
      title1: sliders?.title1,
      title2: sliders?.title2,
      subtitle: sliders?.subtitle,
      url: sliders?.url,
      urlTitle: sliders?.urlTitle
    };
    // Conocer el id de la sliders
    const filter = { id: sliders?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'sliders');
    return {
      status: result.status,
      message: result.message,
      sliders: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El tipo de Sliders no se ha especificado correctamente.`,
        sliders: null
      };
    }
    const result = await this.del(this.collection, { id }, 'sliders');
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
        message: `El ID de la Sliders no se ha especificado correctamente.`,
        sliders: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'sliders');
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

export default SlidersService;