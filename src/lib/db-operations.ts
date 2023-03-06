import { Db } from 'mongodb';
import { IPaginationOptions } from '../interfaces/pagination-options.interface';

/**
 * Obtener el ID que vamos a utilizar en el nuevo usuario
 *
 * @return  {entero}  Regresa el siguiente elemento a registrar
 *
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param Como queremos ordenarlo { <propiedad>: -1 }
 */
export const asignDocumentId = async (
  database: Db,
  collection: string,
  sort: object = { registerDate: -1 }
) => {
  const lastElement = await database
    .collection(collection)
    .find()
    .limit(1)
    .sort(sort)
    .toArray();

  if (lastElement.length === 0) {
    return '1';
  }
  return String(+lastElement[0].id + 1);
};

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param filter Filtro para la búsqueda de la colección
 * @returns Objeto de la colección encontrado
 */
export const findOneElement = async (
  database: Db,
  collection: string,
  filter: object
) => {
  return await database
    .collection(collection)
    .findOne(filter);
};

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param filter Filtro para la búsqueda de la colección
 * @param paginationOptions Opciones de la paginación
 * @param sort Como queremos ordenarlo { <propiedad>: -1 }
 * @returns Lista de Objetos de la colección encontrados
 */
export const findElements = async (
  database: Db,
  collection: string,
  filter: object = {},
  paginationOptions: IPaginationOptions = {
    page: 1,
    pages: 1,
    itemsPage: -1,
    skip: 0,
    total: -1
  },
  sort: object = { id: 1 }
) => {
  if (paginationOptions.total === -1) {
    return await database
      .collection(collection)
      .find(filter).toArray();
  }
  if (collection === 'view_shop_products' || collection === 'view_budgets_products') {
    return await database
      .collection(collection)
      .find(filter)
      .limit(paginationOptions.itemsPage)
      .skip(paginationOptions.skip)
      .sort(sort)
      .toArray();
  } else {
    return await database
      .collection(collection)
      .find(filter)
      .limit(paginationOptions.itemsPage)
      .skip(paginationOptions.skip)
      .sort(sort)
      .collation({ locale: 'en_US', numericOrdering: true })
      .toArray();
  }
};



export const findAllElements = async (
  database: Db,
  collection: string,
  filter: object = {},
  sort: object = { id: 1 }
) => {
  return await database
    .collection(collection)
    .find(filter).toArray();
};

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param document Datos que se van a agregar
 * @returns Objeto de la colección agregado
 */
export const insertOneElement = async (
  database: Db,
  collection: string,
  document: object
) => {
  return await database
    .collection(collection)
    .insertOne(document);
};

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param filter Filtro para la búsqueda de la colección
 * @param updateObject Objeto que se va a actualizar
 * @returns Objeto de la colección actualizado
 */
export const updateOneElement = async (
  database: Db,
  collection: string,
  filter: object,
  updateObject: object
) => {
  return await database.collection(collection).updateOne(
    filter,
    { $set: updateObject }
  );
};

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param filter Filtro para la búsqueda de la colección
 * @returns Objeto de la colección eliminado
 */
export const deleteOneElement = async (
  database: Db,
  collection: string,
  filter: object = {}
) => {
  return await database.collection(collection).deleteOne(filter);
};


/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param filter Filtro para la búsqueda de la colección
 * @returns Objeto de la colección eliminados
 */
 export const deleteManyElements = async (
  database: Db,
  collection: string,
  filter: object = {}
) => {
  return await database.collection(collection).deleteMany(filter);
};

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param documents Datos en forma de lista que se van a agregar
 * @returns Lista de objetos agregados
 */
export const insertManyElements = async (
  database: Db,
  collection: string,
  documents: Array<object>
) => {
  return await database
    .collection(collection)
    .insertMany(documents);
};

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @param filter Filtro para la búsqueda de la colección
 * @returns Cantidad de elementos encontrados
 */
export const countElements = async (
  database: Db,
  collection: string,
  filter: object = {}
) => {
  return await database.collection(collection).countDocuments(filter);
};

export const randomItems = async (
  database: Db,
  collection: string,
  filter: object = {},
  items: number = 10
): Promise<Array<object>> => {
  return new Promise(async (resolve) => {
    const pipeline = [
      { $match: filter },
      { $sample: { size: items } }
    ];
    resolve(await database.collection(collection).aggregate(
      pipeline
    ).toArray());
  });
};

// Gestion del stock de productos
export const manageStockUpdate = async (
  database: Db,
  collection: string,
  filter: object,
  updateObject: object
) => {
  return await database.collection(collection).updateOne(
    filter,
    { $inc: updateObject }
  );
};
