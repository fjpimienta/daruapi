import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { IWarehouse } from '../interfaces/warehouses.interface';
import { asignDocumentId, findElements, findOneElement } from '../lib/db-operations';
import { pagination } from '../lib/pagination';
import ResolversOperationsService from './resolvers-operaciones.service';

class WarehousesService extends ResolversOperationsService {
  collection = COLLECTIONS.WAREHOUSES;
  collectionSupplier = COLLECTIONS.SUPPLIERS;
  catalogName = 'Almacenes';
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
      filter = { active: { $ne: false }, 'sucursal': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'sucursal': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'sucursal': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      warehouses: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      warehouse: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      warehouseId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const warehouse = this.getVariables().warehouse;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(warehouse?.name || '')) {
      return {
        status: false,
        message: `El almacen no se ha especificado correctamente`,
        warehouse: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(warehouse?.name || '')) {
      return {
        status: false,
        message: `El Almacen ya existe en la base de datos, intenta con otro almacen`,
        warehouse: null
      };
    }

    const warehouseObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      cp: warehouse?.cp,
      name: warehouse?.name,
      estado: warehouse?.estado,
      latitud: warehouse?.latitud,
      longitud: warehouse?.longitud,
      suppliersProd: warehouse?.suppliersProd,
      products: warehouse?.products,
      productShipments: warehouse?.productShipments,
      shipments: warehouse?.shipments,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, warehouseObject, 'almace');
    return {
      status: result.status,
      message: result.message,
      warehouse: result.item
    };

  }

  // Añadir una lista
  async insertMany() {
    const warehouses = this.getVariables().warehouses;
    const supplier = this.getVariables().supplier;
    let warehousesDB: IWarehouse[];
    let warehousesAdd: IWarehouse[] = [];
    let warehousesCancel: IWarehouse[] = [];
    let warehousesUpdate: IWarehouse[] = [];

    if (warehouses?.length === 0) {
      return {
        status: false,
        message: 'No existen elementos para integrar',
        warehouses: null
      };
    }

    // Recuperar el siguiente id
    const id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
    let i = parseInt(id);
    let j = 1;

    // Recuperar todos los datos registrados
    const paginationData = await pagination(this.getDB(), this.collection, 1, -1, {});
    warehousesDB = await findElements(this.getDB(), this.collection, {}, paginationData);

    // Iniciar el proceso de buscar elementos de los registros guardados.
    // const supplierCat = {
    //   idProveedor: supplier?.id,
    //   name: supplier?.name,
    //   slug: supplier?.slug
    // };
    // let suppliersCat = [supplierCat];

    // Registra todos los datos en el proveedor correspondiente
    if (supplier) {
      const itemSupplier = await findOneElement(this.getDB(), this.collectionSupplier, { id: supplier?.id });
      if (itemSupplier) {
        const filter = { id: supplier?.id };
        const objectUpdate = {
          catalogs: [{
            name: this.collection,
            catalog: warehouses
          }],
        };
        await this.update(this.collectionSupplier, filter, objectUpdate, 'proveedores');
      }
    }

    // Registra cada almacen
    warehouses?.forEach(warehouse => {
      const item = warehousesDB.find(item => item.name === warehouse.name);
      if (item === undefined) {                       // Elemento que no existe se agrega
        warehouse.id = i.toString();
        warehouse.cp = warehouse?.cp;
        warehouse.name = warehouse?.name;
        warehouse.estado = warehouse?.estado;
        warehouse.latitud = warehouse?.latitud;
        warehouse.longitud = warehouse?.longitud;
        warehouse.suppliersProd = warehouse?.suppliersProd;
        warehouse.products = warehouse?.products;
        warehouse.productShipments = warehouse?.productShipments;
        warehouse.shipments = warehouse?.shipments;
        i += 1;
        warehousesAdd?.push(warehouse);
      } else {                                        // Elementos que ya exsiten, se agrega en otra data.
        const filter = { id: warehouse?.id };             // Conocer el id del almacen
        // // Localizar el supplier
        // if (item.suppliersProd) {                      // Si existen guardados suppliers a ese elemento.
        //   let existeSupplicerCat = false;
        //   if (item.suppliersProd.length > 0) {         // Si existen mas de un suppliers en ese elemento.
        //     item.suppliersCat.forEach(supplierCat => {  // Buscar el supplier para actualizar.
        //       if (supplierCat.idProveedor === warehouse.suppliersCat[0].idProveedor) {
        //         supplierCat = warehouse.suppliersCat[0];
        //         existeSupplicerCat = true;
        //       }
        //     });
        //   }
        //   if (!existeSupplicerCat && warehouse.suppliersCat[0].idProveedor !== '') {
        //     item.suppliersCat.push(warehouse.suppliersCat[0]);
        //   }
        // } else {
        //   item.suppliersCat = warehouse.suppliersCat;
        // }
        // item.suppliersCat = [];

        // Ejecutar actualización
        this.update(this.collection, filter, item, 'almacenes');
        warehousesUpdate?.push(item);


        // warehouse.id = j.toString();
        // warehouse.slug = slugify(warehouse?.almacen || '', { lower: true });
        // warehouse.active = false;
        // j += 1;
        // warehousesCancel?.push(warehouse);
      }
    });
    if (warehousesAdd.length > 0) {
      const result = await this.addList(this.collection, warehousesAdd || [], 'warehouses');
      return {
        status: result.status,
        message: result.message,
        warehouses: warehousesAdd
      };
    }
    if (warehousesUpdate.length > 0) {
      return {
        status: true,
        message: 'Se actualizo correctamente el catalogo.',
        warehouses: warehousesUpdate
      };
    }
    return {
      status: false,
      message: 'No se agregó ningún elemento. Ya existen',
      warehouses: warehousesCancel
    };
  }

  // Modificar Item
  async modify() {
    const warehouse = this.getVariables().warehouse;
    // Comprobar que el almacen no sea nulo.
    if (warehouse === null) {
      return {
        status: false,
        mesage: 'Almacen no definido, verificar datos.',
        warehouse: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(warehouse?.name || '')) {
      return {
        status: false,
        message: `El Almacen no se ha especificado correctamente`,
        warehouse: null
      };
    }
    const objectUpdate = {
      name: warehouse?.name,
    };
    // Conocer el id del almacen
    const filter = { id: warehouse?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'almacenes');
    return {
      status: result.status,
      message: result.message,
      warehouse: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Almacen no se ha especificado correctamente.`,
        warehouse: null
      };
    }
    const result = await this.del(this.collection, { id }, 'almacen');
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
        message: `El ID del Almacen no se ha especificado correctamente.`,
        warehouse: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'almacen');
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
      almacen: value
    });
  }

}

export default WarehousesService;