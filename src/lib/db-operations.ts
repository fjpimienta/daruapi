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

export const asignDocumentIdInt = async (
  database: Db,
  collection: string
) => {
  const lastElement = await database
    .collection(collection)
    .aggregate([{
      $addFields: {
        idAsInt: { $toInt: "$id" } // Convierte el campo id a entero
      }
    }, {
      $sort: { idAsInt: -1 } // Ordena por el campo idAsInt de mayor a menor
    }, {
      $limit: 1 // Limita el resultado a 1 documento
    }])
    .toArray();
  if (lastElement.length === 0) {
    return '1';
  }
  return String(lastElement[0].idAsInt + 1);
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
  sort: object = {}
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

export const findElementsProducts = async (
  database: Db,
  collection: string,
  aggregate: Array<object> = [],  // Mantener el tipo 'Array<object>'
  options: object = {} // Añadir un parámetro para las opciones de agregación
): Promise<Array<object>> => {
  return new Promise(async (resolve) => {
    const pipeline = [
      ...aggregate,
    ];
    resolve(await database.collection(collection).aggregate(pipeline, options).toArray());
  });
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

export const countElementsProducts = async (
  database: Db,
  collection: string,
  filter: object = { active: { $ne: false } },
): Promise<number> => {
  const aggregate = [
    {
      $match: {
        price: { $gt: 0 },
        pictures: {
          $exists: true,
          $not: {
            $size: 0
          }
        }, ...filter
      }
    },
    { $sort: { partnumber: 1, sale_price: 1 }, },
    {
      $group: {
        _id: '$partnumber',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' }, },
  ];
  return new Promise(async (resolve) => {
    const pipeline = [
      ...aggregate,
      { $count: "count" }
    ];
    const result = await database.collection(collection).aggregate(pipeline).toArray();
    if (result.length > 0 && result[0].count) {
      resolve(result[0].count);
    } else {
      resolve(0); // Si no se encontraron resultados, devolver 0
    }
  });
};

export const randomItems = async (
  database: Db,
  collection: string,
  filter: object = {},
  items: number = 10
): Promise<Array<object>> => {
  const aggregate = [
    {
      $match: {
        price: { $gt: 0 },
        pictures: {
          $exists: true,
          $not: {
            $size: 0
          }
        }, ...filter
      }
    },
    { $sort: { partnumber: 1, sale_price: 1 }, },
    {
      $group: {
        _id: '$partnumber',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' }, },
  ];
  return new Promise(async (resolve) => {
    const pipeline = [
      ...aggregate,
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

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @returns Lista de Objetos de la colección encontrados
 */
export const findElementsBrandsGroup = async (
  database: Db,
  collection: string,
): Promise<Array<object>> => {
  const aggregate = [
    {
      $match: {
        price: { $gt: 0 },
        pictures: {
          $exists: true,
          $not: {
            $size: 0
          }
        }
      }
    },
    { $sort: { partnumber: 1, sale_price: 1 }, },
    {
      $group: {
        _id: '$partnumber',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' }, },
  ];
  return new Promise(async (resolve) => {
    const pipeline = [
      ...aggregate,
      { $group: { _id: '$brands', total: { $sum: 1 } } }
    ];
    resolve(await database.collection(collection).aggregate(
      pipeline
    ).toArray());
  });
};

/**
 * @param database Base de datos con la que estamos trabajando
 * @param collection Coleccion deonde queremos buscar el ultimo elemento
 * @returns Lista de Objetos de la colección encontrados
 */
export const findElementsCategorysGroup = async (
  database: Db,
  collection: string,
): Promise<Array<object>> => {
  const aggregate = [
    {
      $match: {
        price: { $gt: 0 },
        pictures: {
          $exists: true,
          $not: {
            $size: 0
          }
        }
      }
    },
    { $sort: { partnumber: 1, sale_price: 1 }, },
    {
      $group: {
        _id: '$partnumber',
        doc: { $first: '$$ROOT' },
      },
    },
    { $replaceRoot: { newRoot: '$doc' }, },
  ];
  return new Promise(async (resolve) => {
    const pipeline = [
      ...aggregate,
      { $group: { _id: '$category', total: { $sum: 1 } } }
    ];
    resolve(await database.collection(collection).aggregate(
      pipeline
    ).toArray());
  });
};

export const findSubcategoryProduct = async (
  database: Db,
  collection: string,
  subCategorySlug: string
): Promise<object | null> => {
  return new Promise(async (resolve) => {
    const pipeline = [
      { $unwind: '$subCategorys' },
      { $unwind: '$subCategorys.supplier' },
      { $unwind: '$subCategorys.supplier.subCategorys' },
      {
        $match: {
          'subCategorys.supplier.subCategorys.slug': subCategorySlug
        }
      },
      {
        $lookup: {
          from: 'categorys',
          localField: 'slug',
          foreignField: 'slug',
          as: 'categoria'
        }
      }, {
        $project: {
          _id: 0,
          categoria: {
            $arrayElemAt: ['$categoria', 0] // Utiliza $arrayElemAt para obtener el primer valor
          },
          subCategoria: {
            slug: '$subCategorys.slug',
            description: '$subCategorys.description'
          }
        }
      },
      {
        $project: {
          'categoria._id': 0, // Omitir el _id de la categoría
        },
      },
    ];
    const result = await database.collection(collection).aggregate(pipeline).toArray();
    if (result.length > 0) {
      resolve(result[0]);
    } else {
      const categorySubCategory = { categoria: { slug: '', description: '' }, subCategoria: { slug: '', description: '' } };
      resolve(categorySubCategory);
    }
  });
};
