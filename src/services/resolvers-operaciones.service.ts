import { Db } from 'mongodb';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { pagination } from '../lib/pagination';
import {
  deleteOneElement, findElements, findOneElement, insertOneElement,
  updateOneElement, asignDocumentId, insertManyElements, deleteManyElements
} from '../lib/db-operations';

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
    filter: object = { active: { $ne: false } }
  ) {
    try {
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
        items: findElements(this.getDB(), collection, filter, paginationData)
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
  protected async getByField(collection: string) {
    const c_pais = this.getVariables().c_pais;
    const collectionLabel = collection.toLowerCase();
    try {
      return await findOneElement(this.getDB(), collection, { c_pais }).then(result => {
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

  // Siguiente elemento
  protected async nextId(collection: string) {
    const collectionLabel = collection.toLowerCase();
    try {
      return await asignDocumentId(this.getDB(), collection, { registerDate: -1 }).then(result => {
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