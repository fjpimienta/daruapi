import { Db } from 'mongodb';
import { countElements, countElementsProducts } from './db-operations';

export async function pagination(
  db: Db,
  collection: string,
  page: number = 1,
  itemsPage: number = 20,
  filter: object = {}
) {
  // Comprobar el numero de items por pagina
  if (itemsPage < 1 || itemsPage > 20) {
    if (itemsPage === -1) {
      itemsPage = 1000;                 // Ofertas
    } else if (itemsPage === 48) {        // Ofertas
      itemsPage = 48;
    } else {
      itemsPage = 20;
    }
  }
  if (page < 1) {
    page = 1;
  }
  const total = await countElements(db, collection, filter);
  const pages = Math.ceil(total / itemsPage);
  return {
    page,
    skip: (page - 1) * itemsPage,
    itemsPage,
    total,
    pages
  };
}

export async function paginationProducts(
  db: Db,
  collection: string,
  page: number = 1,
  itemsPage: number = 48,
  filter: object = { active: { $ne: false } },
) {
  // Comprobar el numero de items por pagina
  if (itemsPage < 1) {
    itemsPage = 1000; // Establecer en 1000 para valores menores que 1
  } else if (itemsPage > 48) {
    itemsPage = 48; // Establecer en 48 para valores mayores que 48
  }
  if (page < 1) {
    page = 1;
  }
  const total = await countElementsProducts(db, collection, filter);
  const pages = Math.ceil(total / itemsPage);

  return {
    page,
    skip: (page - 1) * itemsPage,
    itemsPage,
    total,
    pages
  };
}