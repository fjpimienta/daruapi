import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findAllElements, findElements, findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';
import { pagination } from '../lib/pagination';
import { IProduct } from '../interfaces/product.interface';

class ProductsService extends ResolversOperationsService {
  collection = COLLECTIONS.PRODUCTS;
  catalogName = 'Productos';

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion
  async items(variables: IVariables) {
    const active = variables.active;
    const filterName = variables.filterName;
    const offer = variables.offer;
    const brands = variables.brands;
    const categories = variables.categories;
    let filter: object;
    const regExp = new RegExp('.*' + filterName + '.*', 'i');
    if (filterName === '' || filterName === undefined) {
      filter = { active: { $ne: false } };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = {};
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false } };
      }
    } else {
      filter = {
        active: { $ne: false }, $or: [
          { 'slug': regExp },
          { 'brand': regExp },
          { 'partnumber': regExp },
          { 'category.name': regExp }
        ]
      };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = {
          $or: [
            { 'slug': regExp },
            { 'brand': regExp },
            { 'partnumber': regExp },
            { 'category.name': regExp }
          ]
        };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = {
          active: { $eq: false },
          $or: [
            { 'slug': regExp },
            { 'brand': regExp },
            { 'partnumber': regExp },
            { 'category.name': regExp }
          ]
        };
      }
    }
    if (offer) {
      filter = { ...filter, ...{ 'promociones.disponible_en_promocion': { $gt: 10 } } };
    }
    if (brands) {
      filter = { ...filter, ...{ 'brands.slug': { $in: brands } } };
    }
    if (categories) {
      filter = { ...filter, ...{ 'category.slug': { $in: categories } } };
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      products: result.items
    };
  }

  // Obtener detalles del item
  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      product: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      productId: result.catId
    };
  }

  // Anadir Item
  async insert() {
    const product = this.getVariables().product;
    // Comprobar que no esta en blanco ni es indefinido
    if (!this.checkData(product?.name || '')) {
      return {
        status: false,
        message: `El Producto no se ha especificado correctamente`,
        product: null
      };
    }

    // Comprobar que no existe
    if (await this.checkInDatabase(product?.name || '')) {
      return {
        status: false,
        message: `El Producto ya existe en la base de datos, intenta con otra nombre`,
        product: null
      };
    }

    // Si valida las opciones anteriores, venir aqui y crear el documento
    const productObject = {
      id: await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 }),
      name: product?.name,
      slug: slugify(product?.name || '', { lower: true }),
      short_desc: product?.short_desc,
      price: product?.price,
      sale_price: product?.sale_price,
      review: product?.review,
      ratings: product?.ratings,
      until: product?.until,
      stock: product?.stock,
      top: product?.top,
      featured: product?.featured,
      new: product?.new,
      author: product?.author,
      sold: product?.sold,
      partnumber: product?.partnumber,
      sku: product?.sku,
      upc: product?.upc,
      category: product?.category,
      brand: product?.brand,
      brands: product?.brands,
      model: product?.model,
      peso: product?.peso,
      pictures: product?.pictures,
      sm_pictures: product?.sm_pictures,
      variants: product?.variants,
      active: true,
      unidadDeMedida: product?.unidadDeMedida,
      suppliersProd: product?.suppliersProd,
      descuentos: product?.descuentos,
      promociones: product?.promociones,
      registerDate: new Date().toISOString()
    };
    const result = await this.add(this.collection, productObject, 'producto');
    return {
      status: result.status,
      message: result.message,
      product: result.item
    };

  }

  // Añadir una lista
  async insertMany() {
    const products = this.getVariables().products;
    let productsAdd: IProduct[] = [];
    if (products?.length === 0) {                                   // Verificar que envien productos.
      return {
        status: false,
        message: 'No existen elementos para integrar',
        products: null
      };
    }
    const id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
    let i = parseInt(id);
    // Eliminar los productos del proveedor.

    const idProveedor = products![0].suppliersProd.idProveedor;

    if (idProveedor !== '') {
      let filter: object = { 'suppliersProd.idProveedor': idProveedor };
      const result = await this.delList(this.collection, filter, 'producto');
    }
    // Complementa los datos del producto.
    products?.forEach(product => {
      product.id = i.toString();
      if (product.price === null) {
        product.price = 0;
        product.sale_price = 0;
      }
      product.slug = slugify(product?.name || '', { lower: true });
      product.active = true;
      i += 1;
      product.registerDate = new Date().toISOString();
      productsAdd?.push(product);
    });
    // Guardar los elementos nuevos
    if (productsAdd.length > 0) {
      const result = await this.addList(this.collection, productsAdd || [], 'products');
      return {
        status: result.status,
        message: result.message,
        products: []
      };
    }
  }

  // Añadir una lista
  async insertManyBack() {
    const products = this.getVariables().products;
    let productsDB: IProduct[];
    let productsAdd: IProduct[] = [];
    let productsUpdate: IProduct[] = [];

    if (products?.length === 0) {
      return {
        status: false,
        message: 'No existen elementos para integrar',
        products: null
      };
    }
    const id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
    let i = parseInt(id);
    let j = 1;

    // Recuperar todos los datos registrados
    const paginationData = await pagination(this.getDB(), this.collection, 1, -1, {});
    productsDB = await findAllElements(this.getDB(), this.collection, {});
    // Iniciar el proceso de buscar elementos de los registros guardados.
    products?.forEach(product => {
      const item = productsDB.find(item => item.partnumber === product.partnumber);
      if (item === undefined) {
        // Elemento que no existe se agrega
        product.id = i.toString();
        if (product.price === null) {
          product.price = 0;
          product.sale_price = 0;
        }
        product.slug = slugify(product?.name || '', { lower: true }),
          product.active = true;
        i += 1;
        productsAdd?.push(product);
      } else {
        // Elementos que ya exsiten, se agrega en otra data.
        product.id = j.toString();
        if (product.price === null) {
          product.price = 0;
          product.sale_price = 0;
        }
        product.slug = slugify(product?.name || '', { lower: true }),
          product.active = false;
        j += 1;
        productsUpdate?.push(product);
      }
    });
    if (productsAdd.length > 0) {                       // Guardar los elementos nuevos
      const result = await this.addList(this.collection, productsAdd || [], 'products');
      if (productsUpdate.length > 0) {                   // Actualizar los elementos que ya existan
        productsUpdate.forEach(prodUpdate => {
          if (prodUpdate.price === null) {
            prodUpdate.price = 0;
          }
          this.update(this.collection, { id }, prodUpdate, 'producto');
        });
      }
      return {
        status: result.status,
        message: result.message,
        products: productsDB
      };
    }
    if (productsUpdate.length > 0) {                     // Actualizar los elementos que ya existan
      productsUpdate.forEach(prodUpdate => {
        this.update(this.collection, { id }, prodUpdate, 'producto');
      });
    }
    return {
      status: true,
      message: 'Se actualizaron los productos.',
      products: productsUpdate
    };
  }

  // Modificar Item
  async modify() {
    const product = this.getVariables().product;
    // Comprobar que el producto no sea nulo.
    if (product === null) {
      return {
        status: false,
        mesage: 'Producto no definido, verificar datos.',
        product: null
      };
    }
    // Comprobar que no existe
    if (!this.checkData(product?.name || '')) {
      return {
        status: false,
        message: `El Producto no se ha especificado correctamente`,
        product: null
      };
    }
    const objectUpdate = {
      name: product?.name,
      slug: slugify(product?.name || '', { lower: true }),
      short_desc: product?.short_desc,
      price: product?.price,
      sale_price: product?.sale_price,
      review: product?.review,
      ratings: product?.ratings,
      until: product?.until,
      stock: product?.stock,
      top: product?.top,
      featured: product?.featured,
      new: product?.new,
      author: product?.author,
      sold: product?.sold,
      partnumber: product?.partnumber,
      sku: product?.sku,
      upc: product?.upc,
      category: product?.category,
      brand: product?.brand,
      brands: product?.brands,
      model: product?.model,
      peso: product?.peso,
      pictures: product?.pictures,
      sm_pictures: product?.sm_pictures,
      variants: product?.variants,
      updaterDate: new Date().toISOString()
    };
    // Conocer el id de la marcar
    const filter = { id: product?.id };
    // Ejecutar actualización
    const result = await this.update(this.collection, filter, objectUpdate, 'productos');
    return {
      status: result.status,
      message: result.message,
      product: result.item
    };
  }

  // Eliminar item
  async deleteList(filterName: string) {
    let filter: object = {};
    if (!this.checkData(String(filterName) || '')) {
      return {
        status: false,
        message: `El proveedor no se ha especificado correctamente.`,
        product: null
      };
    }
    filter = { 'suppliersProd.idProveedor': filterName };
    const result = await this.delList(this.collection, filter, 'producto');
    return {
      status: result.status,
      message: result.message
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: `El ID del Producto no se ha especificado correctamente.`,
        product: null
      };
    }
    const result = await this.del(this.collection, { id }, 'producto');
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
        message: `El ID del Producto no se ha especificado correctamente.`,
        product: null
      };
    }
    let update = { active: unblock };
    const result = await this.update(this.collection, { id }, update, 'producto');
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
      name: value
    });
  }
}

export default ProductsService;