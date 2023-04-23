import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { ICatalog } from '../interfaces/catalog.interface';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findElements, findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import { pagination } from '../lib/pagination';
import ResolversOperationsService from './resolvers-operaciones.service';

class CategoriesService extends ResolversOperationsService {
  collection = COLLECTIONS.CATEGORIES;
  collectionSupplier = COLLECTIONS.SUPPLIERS;
  catalogName = 'Categorias';
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
      filter = { active: { $ne: false }, 'description': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'description': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'description': regExp };
      }
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      categories: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      categorie: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      categorieId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const categorie = this.getVariables().categorie;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(categorie?.description || '')) {
      return {
        status: false,
        message: `La Categoria no se ha especificado correctamente`,
        categorie: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(categorie?.description || '')) {
      return {
        status: false,
        message: `La Categoria ya existe en la base de datos, intenta con otro categoria`,
        categorie: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    // // Se agrega temporalmente el provedor principal (La empresa actual)
    // const supplierCat = {
    //   id: '1',
    //   name: 'DARU',
    //   slug: 'daru'
    // };
    // let suppliersCat = [supplierCat];
    const categorieObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      description: categorie?.description,
      slug: slugify(categorie?.description || '', { lower: true }),
      order: categorie?.order,
      active: true,
      registerDate: new Date().toISOString()//,
      // suppliersCat
    };
    const result = await this.add(this.collection, categorieObject, 'categoria');
    return {
      status: result.status,
      message: result.message,
      categorie: result.item
    };

  }

  // Añadir una lista
  async insertMany() {
    const categories = this.getVariables().categories;
    const supplier = this.getVariables().supplier;
    let categoriesDB: ICatalog[];
    let categoriesAdd: ICatalog[] = [];
    let categoriesCancel: ICatalog[] = [];
    let categoriesUpdate: ICatalog[] = [];

    if (categories?.length === 0) {
      return {
        status: false,
        message: 'No existen elementos para integrar',
        categories: null
      };
    }

    // Recuperar e siguiente id
    const id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
    let i = parseInt(id);
    let j = 1;

    // Recuperar todos los datos registrados
    const paginationData = await pagination(this.getDB(), this.collection, 1, -1, {});
    categoriesDB = await findElements(this.getDB(), this.collection, {}, paginationData);

    // Iniciar el proceso de buscar elementos de los registros guardados.
    // const supplierCat = {
    //   id: supplier?.id,
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
            catalog: categories
          }],
        };
        await this.update(this.collectionSupplier, filter, objectUpdate, 'proveedores');
      }
    }

    // Registra cada categoria
    categories?.forEach(categorie => {
      const item = categoriesDB.find(item => item.description === categorie.description);
      if (item === undefined) {                       // Elemento que no existe se agrega
        // Elemento que no existe se agrega
        categorie.id = i.toString();
        categorie.slug = slugify(categorie?.description || '', { lower: true });
        categorie.order = categorie?.order,
        categorie.active = true;
        i += 1;
        categoriesAdd?.push(categorie);
      } else {                                        // Elementos que ya exsiten, se agrega en otra data.
        const filter = { id: categorie?.id };         // Conocer el id de la marca
        // Localizar el supplier
        if (item.suppliersCat) {                      // Si existen guardados suppliers a ese elemento.
          let existeSupplicerCat = false;
          if (item.suppliersCat.length > 0) {         // Si existen mas de un suppliers en ese elemento.
            item.suppliersCat.forEach(supplierCat => {  // Buscar el supplier para actualizar.
              if (supplierCat.idProveedor === categorie.suppliersCat[0].idProveedor) {
                supplierCat = categorie.suppliersCat[0];
                existeSupplicerCat = true;
              }
            });
          }
          if (!existeSupplicerCat && categorie.suppliersCat[0].idProveedor !== '') {
            item.suppliersCat.push(categorie.suppliersCat[0]);
          }
        } else {
          item.suppliersCat = categorie.suppliersCat;
        }
        // item.suppliersCat = [];

        // Ejecutar actualización
        this.update(this.collection, filter, item, 'categorias');
        categoriesUpdate?.push(item);


        // brand.id = j.toString();
        // brand.slug = slugify(brand?.description || '', { lower: true });
        // brand.active = false;
        // j += 1;
        // brandsCancel?.push(brand);
      }
    });
    if (categoriesAdd.length > 0) {
      const result = await this.addList(this.collection, categoriesAdd || [], 'categories');
      return {
        status: result.status,
        message: result.message,
        categories: categoriesAdd
      };
    }
    if (categoriesAdd.length > 0) {
      return {
        status: true,
        message: 'Se actualizo correctamente el catalogo.',
        brands: categoriesAdd
      };
    }
    return {
      status: false,
      message: 'No se agregó ningún elemento. Ya existen',
      categories: categoriesCancel
    };
  }

  // Modificar Item
  async modify() {
    const categorie = this.getVariables().categorie;
    // Comprobar que la marca no sea nula.
    if (categorie === null) {
      return {
        status: false,
        mesage: 'Marca no definida, verificar datos.',
        categorie: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(categorie?.description || '')) {
      return {
        status: false,
        message: `La Categoria no se ha especificado correctamente`,
        categorie: null
      };
    }
    const objectUpdate = {
      description: categorie?.description,
      slug: slugify(categorie?.description || '', { lower: true }),
      order: categorie?.order
    };
    // Conocer el id de la categoria
    const filter = { id: categorie?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'categorias');
    return {
      status: result.status,
      message: result.message,
      categorie: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID de la Categoria no se ha especificado correctamente.`,
        categorie: null
      };
    }
    const result = await this.del(this.collection, { id }, 'categoria');
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
        message: `El ID de la Categoria no se ha especificado correctamente.`,
        categorie: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'categoria');
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
      description: value
    });
  }
}

export default CategoriesService;