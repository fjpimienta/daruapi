import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../../config/constants';
import { IContextData } from '../../interfaces/context-data.interface';
import { IVariables } from '../../interfaces/variable.interface';
import { findAllElements, findElements, findOneElement } from '../../lib/db-operations';
import { asignDocumentId } from '../../lib/db-operations';
import ResolversOperationsService from '../resolvers-operaciones.service';
import { pagination } from '../../lib/pagination';

class OrdersCvaService extends ResolversOperationsService {
  collection = COLLECTIONS.ORDERS_CVA;
  catalogName = 'Ordenes CVA';

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
      ordersCva: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      orderCva: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      orderCvaId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const orderCva = this.getVariables().orderCva;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(orderCva?.NumOC)) {
      return {
        status: false,
        message: `La Orden CT no se ha especificado correctamente`,
        orderCva: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(orderCva?.NumOC)) {
      return {
        status: false,
        message: `La Orden CT ya existe en la base de datos, intenta con otra nombre`,
        orderCva: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const orderCvaObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      NumOC: orderCva?.NumOC,
      Paqueteria: orderCva?.Paqueteria,
      CodigoSucursal: orderCva?.CodigoSucursal,
      PedidoBO: orderCva?.PedidoBO,
      Observaciones: orderCva?.Observaciones,
      productos: orderCva?.productos,
      TipoFlete: orderCva?.TipoFlete,
      Calle: orderCva?.Calle,
      Numero: orderCva?.Numero,
      NumeroInt: orderCva?.NumeroInt,
      Colonia: orderCva?.Colonia,
      Estado: orderCva?.Estado,
      Ciudad: orderCva?.Ciudad,
      Atencion: orderCva?.Atencion,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, orderCvaObject, 'orden ct');
    return {
      status: result.status,
      message: result.message,
      orderCva: result.item
    };

  }

  // Comprobar que no esta en blanco ni es indefinido
  private checkData(value: string | undefined) {
    return (value === '' || value === undefined) ? false : true;
  }

  // Verificar existencia en Base de Datos
  private async checkInDatabase(value: string | undefined) {
    return await findOneElement(this.getDB(), this.collection, {
      NumOC: value
    });
  }
}

export default OrdersCvaService;