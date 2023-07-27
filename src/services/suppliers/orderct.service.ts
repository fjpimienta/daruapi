import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../../config/constants';
import { IContextData } from '../../interfaces/context-data.interface';
import { IVariables } from '../../interfaces/variable.interface';
import { findAllElements, findElements, findOneElement } from '../../lib/db-operations';
import { asignDocumentId } from '../../lib/db-operations';
import ResolversOperationsService from './../resolvers-operaciones.service';
import { pagination } from '../../lib/pagination';

class OrdersCtService extends ResolversOperationsService {
  collection = COLLECTIONS.ORDERS_CT;
  catalogName = 'Ordenes CT';

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
      filter = { active: { $ne: false }, 'user.email': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'user.email': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'user.email': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      ordersCt: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      orderCt: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message
    };
  }

  // Anadir Item
  async insert() {
    const orderCt = this.getVariables().orderCt;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(orderCt?.idPedido)) {
      return {
        status: false,
        message: `La Orden CT no se ha especificado correctamente`,
        orderCt: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(orderCt?.idPedido)) {
      return {
        status: false,
        message: `La Orden CT ya existe en la base de datos, intenta con otra nombre`,
        orderCt: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const orderCtObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      idPedido: orderCt?.idPedido,
      almacen: orderCt?.almacen,
      tipoPago: orderCt?.tipoPago,
      guiaConnect: orderCt?.guiaConnect,
      envio: orderCt?.envio,
      producto: orderCt?.producto,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, orderCtObject, 'orden ct');
    return {
      status: result.status,
      message: result.message,
      orderCt: result.item
    };

  }

  // Comprobar que no esta en blanco ni es indefinido
  private checkData(value: number | undefined) {
    return (value === 0 || value === undefined) ? false : true;
  }

  // Verificar existencia en Base de Datos
  private async checkInDatabase(value: number | undefined) {
    return await findOneElement(this.getDB(), this.collection, {
      idPedido: value
    });
  }
}

export default OrdersCtService;