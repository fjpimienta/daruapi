import { PubSub } from 'apollo-server-express';
import { ACTIVE_VALUES_FILTER, COLLECTIONS, SUBSCRIPTIONS_EVENT } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IStock } from '../interfaces/stock.interface';
import { asignDocumentId, findOneElement, manageStockUpdate, randomItems } from './../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class ShopProductsService extends ResolversOperationsService {
  collection = COLLECTIONS.SHOP_PRODUCTS;
  collectionv = COLLECTIONS.VIEW_SHOP_PRODUCTS;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion de vista
  async itemsView(active: string = ACTIVE_VALUES_FILTER.ACTIVE, filterBranch: string = '', filterName: string = '') {
    let filter: object;
    const regExp = new RegExp('.*' + filterName + '.*');
    if (filterBranch === '' || filterBranch === undefined) {
      if (filterName === '' || filterName === undefined) {
        filter = { active: { $ne: false } };
        if (active === ACTIVE_VALUES_FILTER.ALL) {
          filter = {};
        } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
          filter = { active: { $eq: false } };
        }
      } else {
        filter = { active: { $ne: false }, 'products.name': regExp };
        if (active === ACTIVE_VALUES_FILTER.ALL) {
          filter = { 'products.name': regExp };
        } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
          filter = { active: { $eq: false }, 'products.name': regExp };
        }
      }
    } else {
      if (filterName === '' || filterName === undefined) {
        filter = { active: { $ne: false }, 'branch_office_id': filterBranch };
        if (active === ACTIVE_VALUES_FILTER.ALL) {
          filter = { 'branch_office_id': filterBranch };
        } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
          filter = { active: { $eq: false }, 'branch_office_id': filterBranch };
        }
      } else {
        filter = { active: { $ne: false }, 'products.name': regExp, 'branch_office_id': filterBranch };
        if (active === ACTIVE_VALUES_FILTER.ALL) {
          filter = { 'products.name': regExp, 'branch_office_id': filterBranch };
        } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
          filter = { active: { $eq: false }, 'products.name': regExp, 'branch_office_id': filterBranch };
        }
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collectionv, 'Productos de la Tienda', page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: 'La informacion que hemos pedido se ha cargado correctamente',
      shopProducts: result.items
    };
  }

  // Listar informacion
  async items(active: string = ACTIVE_VALUES_FILTER.ACTIVE,
    branchOffice: Array<string> = ['-1'], random: boolean = false,
    otherFilters: object = {}, filterProduct: object = {}) {
    let filter: object = { active: { $ne: false } };
    if (active === ACTIVE_VALUES_FILTER.ALL) {
      filter = {};
    } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
      filter = { active: { $eq: false } };
    }
    if (branchOffice[0] !== '-1' && branchOffice !== undefined) {
      filter = { ...filter, ...{ branch_office_id: { $in: branchOffice } } };
    }
    // if (otherFilters !== {} && otherFilters !== undefined) {
    //    filter = { ...filter, ...otherFilters };
    // }
    // if (filterProduct !== {} || filterProduct !== undefined) {
    //    filter = { ...filter, ...filterProduct };
    // }

    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    if (!random) {
      const result = await this.list(
        this.collectionv,
        'Productos de la Tienda',
        page,
        itemsPage,
        filter
      );
      return {
        info: result.info,
        status: result.status,
        message: result.message,
        shopProducts: result.items
      };
    }
    const result: Array<object> = await randomItems(
      this.getDB(),
      this.collectionv,
      filter,
      itemsPage
    );
    if (result.length === 0 || result.length !== itemsPage) {
      return {
        info: { page: 1, pages: 1, itemsPage, total: 0 },
        status: false,
        message: 'La informacion que hemos pedido no se ha obtenido tal y como se esperaba',
        shopProducts: []
      };
    }
    return {
      info: { page: 1, pages: 1, itemsPage, total: itemsPage },
      status: true,
      message: 'La informacion que hemos pedido se ha cargado correctamente',
      shopProducts: result
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      shopProduct: result.item
    };
  }

  // Actualizar
  async updateStock(updateList: Array<IStock>, pubsub: PubSub) {
    try {
      updateList.map(async (item: IStock) => {
        const itemDetails = await findOneElement(
          this.getDB(),
          COLLECTIONS.SHOP_PRODUCTS,
          { id: item.id }
        );
        if (item.increment < 0 && ((item.increment + itemDetails.stock) < 0)) {
          item.increment = -itemDetails.stock;
        }
        await manageStockUpdate(
          this.getDB(),
          COLLECTIONS.SHOP_PRODUCTS,
          { id: item.id },
          { stock: item.increment }
        );
        itemDetails.stock += item.increment;
        pubsub.publish(SUBSCRIPTIONS_EVENT.UPDATE_STOCK_PRODUCT,
          { selectProductStockUpdate: itemDetails });  // itemDetails
      });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  //#region "CRUD de Shop Product"
  // Anadir Item
  async insert() {
    const shopProduct = this.getVariables().shopProduct;
    // Comprobar que no esta en blanco ni es indefinido
    if (shopProduct === null) {
      return {
        status: false,
        message: `El producto no se ha especificado correctamente`,
        shopProduct: null
      };
    }

    // Comprobar que no existe
    const userCheck = await findOneElement(this.getDB(), this.collection, { product_id: shopProduct?.product_id });
    if (userCheck !== null) {
      return {
        status: false,
        message: `El producto ya existe en la sucursal, intenta con otro producto o en otra sucursal`,
        product: null
      };
    }

    // Comprobar el ultimo usuario registrado para asignar ID
    shopProduct!.id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
    // Asignar la fecha en formato ISO en la propiedad registerDate
    shopProduct!.registerDate = new Date().toISOString();

    shopProduct!.active = true;

    const result = await this.add(this.collection, shopProduct || {}, 'shopProduct');
    return {
      status: result.status,
      message: result.message,
      shopProduct: result.item
    };
  }

  // Modificar un producto
  async modify() {
    const shopProduct = this.getVariables().shopProduct;
    // Comprobar que el producto no es nulo
    if (shopProduct === null) {
      return {
        status: false,
        message: `El Id del producto no se ha especificado correctamente`,
        shopProduct: null
      };
    }
    const filter = { id: shopProduct?.id };

    const result = await this.update(this.collection, filter, shopProduct || {}, 'shopProduct');

    return {
      status: result.status,
      message: result.message,
      shopProduct: result.item
    };
  }

  // Eliminar un producto
  async delete() {
    const id = this.getVariables().id;
    if (id === null || id === '' || id === undefined) {
      return {
        status: false,
        message: `El ID del producto no se ha especificado correctamente.`,
        shopProduct: null
      };
    }
    const result = await this.del(this.collection, { id }, 'shopProduct');
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
        message: `El ID del Producto de la Sucursal no se ha especificado correctamente.`,
        product: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'shopProduct');
    const action = (unblock) ? 'Desbloqueado' : 'Bloqueado';
    return {
      status: result.status,
      message: (result.message) ? `${action} correctamente` : `No se ha ${action.toLowerCase()} comprobarlo por favor`
    };
  }

  private checkData(value: string) {
    return (value === '' || value === undefined) ? false : true;
  }

  //#region

}

export default ShopProductsService;