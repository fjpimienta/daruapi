import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { ICatalog } from '../interfaces/catalog.interface';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findElements, findOneElement } from '../lib/db-operations';
import { pagination } from '../lib/pagination';
import { asignDocumentId } from './../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';

class BrandsService extends ResolversOperationsService {
  collection = COLLECTIONS.BRANDS;
  collectionSupplier = COLLECTIONS.SUPPLIERS;
  catalogName = 'Marcas';
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
    const sort = { order: 1 };
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter, sort);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      brands: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      brand: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      brandId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const brand = this.getVariables().brand;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(brand?.description || '')) {
      return {
        status: false,
        message: `La Marca no se ha especificado correctamente`,
        brand: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(brand?.description || '')) {
      return {
        status: false,
        message: `La Marca ya existe en la base de datos, intenta con otra marca`,
        brand: null
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
    const brandObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      description: brand?.description,
      slug: slugify(brand?.description || '', { lower: true }),
      order: brand?.order,
      active: true,
      registerDate: new Date().toISOString()//,
      // suppliersCat
    };
    const result = await this.add(this.collection, brandObject, 'marca');
    return {
      status: result.status,
      message: result.message,
      brand: result.item
    };

  }

  // Añadir una lista
  async insertMany() {
    const brands = this.getVariables().brands;
    const supplier = this.getVariables().supplier;
    let brandsDB: ICatalog[];
    let brandsAdd: ICatalog[] = [];
    let brandsCancel: ICatalog[] = [];
    let brandsUpdate: ICatalog[] = [];

    if (brands?.length === 0) {
      return {
        status: false,
        message: 'No existen elementos para integrar',
        brands: null
      };
    }

    // Recuperar el siguiente id
    const id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
    let i = parseInt(id);
    let j = 1;

    // Recuperar todos los datos registrados
    const paginationData = await pagination(this.getDB(), this.collection, 1, -1, {});
    brandsDB = await findElements(this.getDB(), this.collection, {}, paginationData);

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
            catalog: brands
          }],
        };
        await this.update(this.collectionSupplier, filter, objectUpdate, 'proveedores');
      }
    }

    // Registra cada marca
    brands?.forEach(brand => {
      const item = brandsDB.find(item => item.description === brand.description);
      if (item === undefined) {                       // Elemento que no existe se agrega
        brand.id = i.toString();
        brand.slug = slugify(brand?.description || '', { lower: true });
        brand.active = true;
        i += 1;
        brandsAdd?.push(brand);
      } else {                                        // Elementos que ya exsiten, se agrega en otra data.
        const filter = { id: brand?.id };             // Conocer el id de la marca
        // Localizar el supplier
        if (item.suppliersCat) {                      // Si existen guardados suppliers a ese elemento.
          let existeSupplicerCat = false;
          if (item.suppliersCat.length > 0) {         // Si existen mas de un suppliers en ese elemento.
            item.suppliersCat.forEach(supplierCat => {  // Buscar el supplier para actualizar.
              if (supplierCat.idProveedor === brand.suppliersCat[0].idProveedor) {
                supplierCat = brand.suppliersCat[0];
                existeSupplicerCat = true;
              }
            });
          }
          if (!existeSupplicerCat && brand.suppliersCat[0].idProveedor !== '') {
            item.suppliersCat.push(brand.suppliersCat[0]);
          }
        } else {
          item.suppliersCat = brand.suppliersCat;
        }
        // item.suppliersCat = [];

        // Ejecutar actualización
        this.update(this.collection, filter, item, 'marcas');
        brandsUpdate?.push(item);


        // brand.id = j.toString();
        // brand.slug = slugify(brand?.description || '', { lower: true });
        // brand.active = false;
        // j += 1;
        // brandsCancel?.push(brand);
      }
    });
    if (brandsAdd.length > 0) {
      const result = await this.addList(this.collection, brandsAdd || [], 'brands');
      return {
        status: result.status,
        message: result.message,
        brands: brandsAdd
      };
    }
    if (brandsUpdate.length > 0) {
      return {
        status: true,
        message: 'Se actualizo correctamente el catalogo.',
        brands: brandsUpdate
      };
    }
    return {
      status: false,
      message: 'No se agregó ningún elemento. Ya existen',
      brands: brandsCancel
    };
  }

  // Modificar Item
  async modify() {
    const brand = this.getVariables().brand;
    // Comprobar que la marca no sea nula.
    if (brand === null) {
      return {
        status: false,
        mesage: 'Marca no definida, verificar datos.',
        brand: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(brand?.description || '')) {
      return {
        status: false,
        message: `La Marca no se ha especificado correctamente`,
        brand: null
      };
    }
    const objectUpdate = {
      description: brand?.description,
      slug: slugify(brand?.description || '', { lower: true }),
      order: brand?.order
    };
    // Conocer el id de la marca
    const filter = { id: brand?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'marcas');
    return {
      status: result.status,
      message: result.message,
      brand: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID de la Marca no se ha especificado correctamente.`,
        brand: null
      };
    }
    const result = await this.del(this.collection, { id }, 'marca');
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
        message: `El ID de la Marca no se ha especificado correctamente.`,
        brand: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'marca');
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

export default BrandsService;