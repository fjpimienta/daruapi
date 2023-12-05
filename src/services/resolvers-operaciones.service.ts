import { Db } from 'mongodb';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { pagination, paginationProducts } from '../lib/pagination';
import {
  deleteOneElement, findElements, findOneElement, insertOneElement,
  updateOneElement, asignDocumentId, insertManyElements, deleteManyElements, findElementsProducts
} from '../lib/db-operations';
import { IApisupplier } from '../interfaces/suppliers/supplier.interface';
import slugify from 'slugify';

class ResolversOperationsService {
  private root: object;
  private variables: IVariables;
  private context: IContextData;
  constructor(root: object, variables: IVariables, context: IContextData) {
    this.root = root;
    this.variables = variables;
    this.context = context;
  }

  // Variables
  protected getContext(): IContextData {
    return this.context;
  }

  protected getDB(): Db {
    return this.context.db!;
  }
  protected getVariables(): IVariables {
    return this.variables;
  }

  // Listar informacion
  protected async list(
    collection: string,
    listElement: string,
    page: number = 1,
    itemsPage: number = 10,
    filter: object = { active: { $ne: false } },
    sort: object = {}
  ) {
    try {
      sort = { ...sort, ...{ id: 1 } };
      const paginationData = await pagination(this.getDB(), collection, page, itemsPage, filter);
      return {
        info: {
          page: paginationData.page,
          pages: paginationData.pages,
          itemsPage: paginationData.itemsPage,
          total: paginationData.total
        },
        status: true,
        message: `Lista de ${listElement} cargada correctamente`,
        items: findElements(this.getDB(), collection, filter, paginationData, sort)
      };
    } catch (error) {
      return {
        info: null,
        status: false,
        message: `Lista de ${listElement} no cargada correctamente: ${error}`,
        items: []
      };
    }
  }

  protected async listAll(
    collection: string,
    listElement: string,
    page: number = 1,
    itemsPage: number = -1,
    filter: object = {},
    sort: object = {}
  ) {
    try {
      sort = { ...sort, ...{ id: 1 } };
      const paginationData = await pagination(this.getDB(), collection, page, itemsPage, filter);
      paginationData.total = -1;
      return {
        info: {
          page: paginationData.page,
          pages: paginationData.pages,
          itemsPage: paginationData.itemsPage,
          total: paginationData.total
        },
        status: true,
        message: `Lista de ${listElement} cargada correctamente`,
        items: findElements(this.getDB(), collection, filter, paginationData, sort)
      };
    } catch (error) {
      return {
        info: null,
        status: false,
        message: `Lista de ${listElement} no cargada correctamente: ${error}`,
        items: []
      };
    }
  }

  // Listar informacion de Productos
  protected async listProducts(
    collection: string,
    listElement: string,
    page: number = 1,
    itemsPage: number = 10,
    filter: object = { active: { $ne: false } },
  ) {
    try {
      const paginationData = await paginationProducts(this.getDB(), collection, page, itemsPage, filter);
      // Agregamos la etapa de agregación para encontrar el registro con el menor "sale_price" por "partnumber"
      const aggregate = [
        { $match: filter, },
        { $sort: { partnumber: 1, price: 1 }, },
        {
          $group: {
            _id: '$partnumber',
            doc: { $first: '$$ROOT' },
          },
        },
        { $replaceRoot: { newRoot: '$doc' }, },
        { $skip: (paginationData.page - 1) * paginationData.itemsPage },
        { $limit: paginationData.itemsPage },
      ];
      return {
        info: {
          page: paginationData.page,
          pages: paginationData.pages,
          itemsPage: paginationData.itemsPage,
          total: paginationData.total,
        },
        status: true,
        message: `Lista de ${listElement} cargada correctamente`,
        items: findElementsProducts(this.getDB(), collection, aggregate),
      };
    } catch (error) {
      return {
        info: null,
        status: false,
        message: `Lista de ${listElement} no cargada correctamente: ${error}`,
        items: [],
      };
    }
  }

  // Obtener detalles del item
  protected async get(collection: string) {
    const collectionLabel = collection.toLowerCase();
    try {
      return await findOneElement(this.getDB(), collection, { id: this.variables.id }).then(result => {
        if (result) {
          return {
            status: true,
            message: `${collectionLabel} ha sido cargada correctamente con su detalle`,
            item: result
          };
        }
        return {
          status: false,
          message: `${collectionLabel} no ha obtenido detalles por que no existe`,
          item: null
        };
      });
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al querer cargar los detalles de ${collectionLabel}`,
        item: null
      };
    }
  }

  // Obtener detalles del item
  protected async getByField(collection: string, filter: object = {}) {
    const { c_pais, vendorPartNumber, upc, brandIcecat, productIcecat, imSKU, partNumber } = this.variables;
    let collectionLabel = '';
    if (c_pais) {
      filter = { c_pais: c_pais };
    }
    if (productIcecat && brandIcecat) {
      const brand = brandIcecat.toLowerCase();
      filter = { "Prod_id": productIcecat, "Supplier": new RegExp(brand, "i") };
      collectionLabel = `El Producto ${productIcecat}`;
    }
    if (vendorPartNumber) {
      filter = { "vendorPartNumber": { $regex: new RegExp(vendorPartNumber + '\\s*$') } };
      collectionLabel = `El Producto ${vendorPartNumber}`;
    } else if (upc) {
      const cleanedUpc = upc.replace(/^0+/, '');
      filter = { "UPC Code": cleanedUpc };
      collectionLabel = `El Producto ${cleanedUpc}`;
    } else if (imSKU) {
      filter = { "imSKU": { $regex: new RegExp(imSKU + '\\s*$') } };
      collectionLabel = `El Producto ${imSKU}`;
    } else if (partNumber) {
      filter = { "partnumber": partNumber};
      collectionLabel = `El Producto ${partNumber}`;
    }
    try {
      return await findOneElement(this.getDB(), collection, filter).then(result => {
        if (result) {
          return {
            status: true,
            message: `${collectionLabel} ha sido cargada correctamente con su detalle`,
            item: result
          };
        }
        return {
          status: false,
          message: `${collectionLabel} no ha obtenido detalles por que no existe`,
          item: null
        };
      });
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al querer cargar los detalles de ${collectionLabel}`,
        item: null
      };
    }
  }

  // Obtener detalles del item
  protected async getByName(collection: string) {
    const collectionLabel = collection.toLowerCase();
    const name = slugify(this.getVariables().name || '', { lower: true });
    try {
      return await findOneElement(this.getDB(), collection,
        { 'slug': name }
      )
        .then(result => {
          if (result) {
            return {
              status: true,
              message: `${collectionLabel} ha sido cargada correctamente con su detalle`,
              item: result
            };
          }
          return {
            status: false,
            message: `${collectionLabel} no ha obtenido detalles por que no existe`,
            item: null
          };
        });
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al querer cargar los detalles de ${collectionLabel}`,
        item: null
      };
    }
  }

  // Obtener detalles del item
  protected async getByDelivery(collection: string) {
    const collectionLabel = collection.toLowerCase();
    const deliveryId = this.getVariables().deliveryId;
    try {
      return await findOneElement(this.getDB(), collection, { deliveryId }).then(result => {
        if (result) {
          return {
            status: true,
            message: `${collectionLabel} ha sido cargada correctamente con su detalle`,
            item: result
          };
        }
        return {
          status: false,
          message: `${collectionLabel} no ha obtenido detalles por que no existe`,
          item: null
        };
      });
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al querer cargar los detalles de ${collectionLabel}`,
        item: null
      };
    }
  }

  // Obtener detalles del item
  protected async getByFilters(collection: string) {
    const collectionLabel = collection.toLowerCase();
    const name = this.getVariables().name;
    const typeApi = this.getVariables().typeApi;
    const nameApi = this.getVariables().nameApi;
    try {
      return await findOneElement(this.getDB(), collection,
        { 'slug': name, 'apis.type': typeApi, 'apis.name': nameApi }
      )
        .then(result => {
          if (result) {
            for (let i = 0; i < result.apis.length; i++) {
              if (result.apis[i].type === typeApi && result.apis[i].name === nameApi) {
                return {
                  status: true,
                  message: `${collectionLabel} ha sido cargada correctamente con su detalle`,
                  item: result.apis[i]
                };
              }
            }
          }
          return {
            status: false,
            message: `${collectionLabel} no ha obtenido detalles por que no existe`,
            item: null
          };
        });
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al querer cargar los detalles de ${collectionLabel}`,
        item: null
      };
    }
  }

  // Siguiente elemento
  protected async nextId(collection: string) {
    const collectionLabel = collection.toLowerCase();
    try {
      return await asignDocumentId(this.getDB(), collection, { registerDate: -1, id: -1 }).then(result => {
        if (result) {
          return {
            status: true,
            message: `${collectionLabel} ha generado el siguiente elemento`,
            catId: result
          };
        }
        return {
          status: false,
          message: `${collectionLabel} no ha obtenido el siguiente elemento`,
          catId: null
        };
      });
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al querer recuperar el siguiente elemento de ${collectionLabel}`,
        catId: null
      };
    }
  }
  // Anadir Item
  protected async add(collection: string, document: object, item: string) {
    try {
      return await insertOneElement(this.getDB(), collection, document).then(
        res => {
          if (res.result.ok === 1) {
            return {
              status: true,
              message: `Se ha agregado correctamente el ${item}.`,
              item: document
            };
          }
          return {
            status: false,
            message: `No se ha insertado el ${item}. Intentalo de nuevo.`,
            item: null
          };
        });
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al insertar el ${item}. Intentalo de nuevo.`,
        item: null
      };
    }
  }

  // Añadir una lista
  protected async addList(collection: string, documents: Array<object>, item: string) {
    try {
      return await insertManyElements(this.getDB(), collection, documents).then(
        res => {
          if (res.result.ok === 1) {
            return {
              status: true,
              message: `Se ha agregado correctamente la lista de ${item}.`,
              items: documents
            };
          }
          return {
            status: false,
            message: `No se ha insertado la lista de ${item}. Intentalo de nuevo.`,
            items: []
          };
        });
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al insertar la lista ${collection}. Intentalo de nuevo.`,
        items: null
      };
    }
  }

  // Modificar Item
  protected async update(collection: string, filter: object, objectUpdate: object, item: string) {
    try {
      return await updateOneElement(
        this.getDB(),
        collection,
        filter,
        objectUpdate
      ).then(
        res => {
          if (res.result.nModified === 1 && res.result.ok) {
            return {
              status: true,
              message: `El registro de ${item} actualizado correctamente.`,
              item: Object.assign({}, filter, objectUpdate)
            };
          }
          return {
            status: false,
            message: `El registro de ${item} no se ha actualizado. Comprueba que estas filtrando correctamente. O simplemente no hay nada que actualizar`,
            item: null
          };
        }
      );
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al modificar el ${item}. Intentalo de nuevo.`,
        item: null
      };
    }
  }

  // Eliminar item
  protected async del(collection: string, filter: object, item: string) {
    try {
      return await deleteOneElement(
        this.getDB(),
        collection,
        filter
      ).then(
        res => {
          if (res.deletedCount === 1) {
            return {
              status: true,
              message: `Elemento del ${item} eliminado correctamente.`
            };
          }
          return {
            status: false,
            message: `Elemento del ${item} no se ha borrado correctamente. Comprueba el filtro.`
          };
        }
      );
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al eliminar el ${item}. Intenta de nuevo por favor.`
      };
    }
  }

  // Eliminar item
  protected async delList(collection: string, filter: object, item: string) {
    try {
      return await deleteManyElements(
        this.getDB(),
        collection,
        filter
      ).then(
        res => {
          if (res.deletedCount === 1) {
            return {
              status: true,
              message: `Elementos de ${item} eliminados correctamente.`
            };
          }
          return {
            status: false,
            message: `Elementos de ${item} no se ha borrado correctamente. Comprueba el filtro.`
          };
        }
      );
    } catch (error) {
      return {
        status: false,
        message: `Error inesperado al eliminar los elementos ${item}. Intenta de nuevo por favor.`
      };
    }
  }
}

export default ResolversOperationsService;