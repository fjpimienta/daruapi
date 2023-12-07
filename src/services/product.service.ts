import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { findAllElements, findOneElement, findSubcategoryProduct } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';
import { pagination } from '../lib/pagination';
import { IPicture, IProduct } from '../interfaces/product.interface';
import ExternalIcecatsService from './externalIcecat.service';
import ExternalIngramService from './externalIngram.service';

class ProductsService extends ResolversOperationsService {
  collection = COLLECTIONS.PRODUCTS;
  collectionCat = COLLECTIONS.CATEGORYS;
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
    const subCategories = variables.subCategories;
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
          { 'name': regExp },
          { 'sku': regExp },
          { 'partnumber': regExp }
        ]
      };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = {
          $or: [
            { 'name': regExp },
            { 'sku': regExp },
            { 'partnumber': regExp }
          ]
        };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = {
          active: { $eq: false },
          $or: [
            { 'name': regExp },
            { 'sku': regExp },
            { 'partnumber': regExp }
          ]
        };
      }
    }
    if (offer) {
      filter = { ...filter, ...{ featured: { $eq: offer } } };
    }
    if (brands) {
      filter = { ...filter, ...{ 'brands.slug': { $in: brands } } };
    }
    if (categories) {
      filter = { ...filter, ...{ 'category.slug': { $in: categories } } };
    }
    if (subCategories) {
      filter = { ...filter, ...{ 'subCategory.slug': { $in: subCategories } } };
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.listProducts(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      products: result.items
    };
  }

  // Obtener detalles del item
  async details(variables: IVariables, context: IContextData) {
    const result = await this.get(this.collection);
    const product = result.item;
    if (!product) {
      return {
        status: false,
        message: `El Producto no existe en la base de datos.`,
        product: null
      };
    }
    const variableLocal = {
      brandIcecat: product.brands[0].slug,
      productIcecat: product.partnumber
    }
    const icecatExt = await new ExternalIcecatsService({}, variableLocal, context).getIcecatProductLocal();

    if (icecatExt.status) {
      if (icecatExt.icecatProductLocal) {
        const generalInfo: any = {};
        generalInfo.IcecatId = 0;
        generalInfo.Title = icecatExt.icecatProductLocal.ShortSummaryDescription;
        const titleInfo = {
          GeneratedIntTitle: icecatExt.icecatProductLocal.ShortSummaryDescription,
          GeneratedLocalTitle: {
            Value: icecatExt.icecatProductLocal.LongSummaryDescription,
            Language: 'ES'
          },
          BrandLocalTitle: {
            Value: '',
            Language: 'ES'
          }
        };
        generalInfo.TitleInfo = titleInfo;
        generalInfo.Brand = icecatExt.icecatProductLocal.Supplier;
        generalInfo.BrandLogo = `/assets/brands/${icecatExt.icecatProductLocal.Supplier}`;
        generalInfo.brandPartCode = icecatExt.icecatProductLocal.Prod_id;
        const gtin: string[] = [];
        if (icecatExt.icecatProductLocal.Requested_GTIN && icecatExt.icecatProductLocal.Requested_GTIN.includes('|')) {
          gtin.push(...icecatExt.icecatProductLocal.Requested_GTIN.split('|'));
        } else {
          gtin.push(icecatExt.icecatProductLocal.Requested_GTIN);
        }
        generalInfo.GTIN = gtin;
        const category = {
          CategoryID: slugify(icecatExt.icecatProductLocal.Category || '', { lower: true }),
          Name: {
            Value: icecatExt.icecatProductLocal.Category,
            Language: 'ES'
          }
        };
        generalInfo.Category = category;
        const summaryDescription = {
          ShortSummaryDescription: icecatExt.icecatProductLocal.ShortSummaryDescription,
          LongSummaryDescription: icecatExt.icecatProductLocal.LongSummaryDescription
        }
        generalInfo.SummaryDescription = summaryDescription;
        const generatedBulletP: string[] = [];

        if (icecatExt.icecatProductLocal.technicalSpecifications) {
          for (const spec of icecatExt.icecatProductLocal.technicalSpecifications) {
            const headerName = spec.headerName;
            const attributeName = spec.attributeName;
            const attributeValue = spec.attributeValue;
            const bulletPoint = `${attributeName}: ${attributeValue}`;
            generatedBulletP.push(bulletPoint);
          }
        }
        const generatedBulletPoints = {
          Language: 'ES',
          Values: generatedBulletP
        }
        generalInfo.GeneratedBulletPoints = generatedBulletPoints;
        product.generalInfo = generalInfo;
        console.log('icecatExt.icecatProductLocal.ProductGallery: ', icecatExt.icecatProductLocal.ProductGallery);

        if (icecatExt.icecatProductLocal.ProductGallery && icecatExt.icecatProductLocal.ProductGallery.includes('|')) {
          product.pictures = [];
          product.sm_pictures = [];
          const imagenes: string[] = icecatExt.icecatProductLocal.ProductGallery.split('|');
          console.log('imagenes: ', imagenes);
          for (const pictureI of imagenes) {
            if (pictureI !== '') {
              const pict: IPicture = {
                width: '500',
                height: '500',
                url: pictureI
              };
              product.pictures.push(pict);
              const pict_sm: IPicture = {
                width: '300',
                height: '300',
                url: pictureI
              };
              product.sm_pictures.push(pict_sm);
            }
          }
        }
      }
      console.log('product: ', product);
    } else {
      const icecat = await new ExternalIcecatsService({}, variableLocal, context).getICecatProductInt(variableLocal);
      // console.log('details.icecat: ', icecat);
      if (icecat.status) {
        if (icecat.icecatProduct.GeneralInfo && icecat.icecatProduct.GeneralInfo.IcecatId !== '') {
          product.generalInfo = icecat.icecatProduct.GeneralInfo;
        }
        if (icecat.icecatProduct.Gallery.length > 0) {
          product.pictures = [];
          product.sm_pictures = [];
          for (const pictureI of icecat.icecatProduct.Gallery) {
            if (pictureI.Pic500x500 !== '') {
              const pict: IPicture = {
                width: pictureI.Pic500x500Width,
                height: pictureI.Pic500x500Height,
                url: pictureI.Pic500x500
              };
              product.pictures.push(pict);
              const pict_sm: IPicture = {
                width: pictureI.LowWidth,
                height: pictureI.LowHeight,
                url: pictureI.LowPic
              };
              product.sm_pictures.push(pict_sm);
            }
          }
        }
      } else {
        const variableI = {
          vendorPartNumber: product.partnumber,
          upc: product.upc
        }
        const ingram = await new ExternalIngramService({}, variableI, context).getIngramProduct({});
        if (ingram.ingramProduct) {
          const generalInfo: any = {};
          generalInfo.IcecatId = 0;
          generalInfo.Title = ingram.ingramProduct.description;
          const titleInfo = {
            GeneratedIntTitle: ingram.ingramProduct.description,
            GeneratedLocalTitle: {
              Value: ingram.ingramProduct.productDetailDescription,
              Language: 'ES'
            },
            BrandLocalTitle: {
              Value: '',
              Language: 'ES'
            }
          };
          generalInfo.TitleInfo = titleInfo;
          generalInfo.Brand = ingram.ingramProduct.brand ? ingram.ingramProduct.vendorName.toUpperCase() : '';
          generalInfo.BrandLogo = `/assets/brands/${ingram.ingramProduct.vendorName}`;
          generalInfo.brandPartCode = ingram.ingramProduct.vendorPartNumber;
          const gtin: string[] = [];
          gtin.push(ingram.ingramProduct.upc);
          generalInfo.GTIN = gtin;
          const category = {
            CategoryID: product.subCategory[0].slug,
            Name: {
              Value: product.subCategory[0].name,
              Language: 'ES'
            }
          };
          generalInfo.Category = category;
          const summaryDescription = {
            ShortSummaryDescription: ingram.ingramProduct.description,
            LongSummaryDescription: ingram.ingramProduct.productDetailDescription
          }
          generalInfo.SummaryDescription = summaryDescription;
          const generatedBulletP: string[] = [];

          if (ingram.ingramProduct.technicalSpecifications) {
            for (const spec of ingram.ingramProduct.technicalSpecifications) {
              const headerName = spec.headerName;
              const attributeName = spec.attributeName;
              const attributeValue = spec.attributeValue;
              const bulletPoint = `${attributeName}: ${attributeValue}`;
              generatedBulletP.push(bulletPoint);
            }
          }
          const generatedBulletPoints = {
            Language: 'ES',
            Values: generatedBulletP
          }
          generalInfo.GeneratedBulletPoints = generatedBulletPoints;
          product.generalInfo = generalInfo;
        } else {
          const generalInfo: any = {};
          generalInfo.IcecatId = 0;
          generalInfo.Title = product.name;
          const titleInfo = {
            GeneratedIntTitle: product.name,
            GeneratedLocalTitle: {
              Value: product.short_desc,
              Language: 'ES'
            },
            BrandLocalTitle: {
              Value: '',
              Language: 'ES'
            }
          };
          generalInfo.TitleInfo = titleInfo;
          generalInfo.Brand = product.brand ? product.brand.toUpperCase() : '';
          generalInfo.BrandLogo = `/assets/brands/${product.brand}`;
          generalInfo.brandPartCode = product.partnumber;
          const gtin: string[] = [];
          gtin.push(product.upc);
          generalInfo.GTIN = gtin;
          const category = { CategoryID: product.subCategory[0].slug, Name: { Value: product.subCategory[0].name, Language: 'ES' } };
          generalInfo.Category = category;
          const summaryDescription = {
            ShortSummaryDescription: product.name,
            LongSummaryDescription: product.short_desc
          }
          generalInfo.SummaryDescription = summaryDescription;
          const generatedBulletP: string[] = [];
          if (product.category[0].name) generatedBulletP.push('Categoria: ' + product.category[0].name);
          if (product.model) generatedBulletP.push('Modelo: ' + product.model);
          if (product.sustituto) generatedBulletP.push('Sustituo: ' + product.sustituto);
          if (product.upc) generatedBulletP.push('Codigo Universal: ' + product.upc);
          const generatedBulletPoints = {
            Language: 'ES',
            Values: generatedBulletP
          }
          generalInfo.GeneratedBulletPoints = generatedBulletPoints;

          product.generalInfo = generalInfo;
        }
      }
    }
    // console.log('product: ', product);
    return {
      status: result.status,
      message: result.message,
      product: product
    };
  }

  async getProductField() {
    try {
      const result = await this.getByField(this.collection);
      return {
        status: result.status,
        message: result.message,
        productField: result.item
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        productField: null,
      };
    }
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
      exchangeRate: product?.exchangeRate,
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
      subCategory: product?.subCategory,
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
      especificaciones: product?.especificaciones,
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
  async insertMany(context: IContextData) {
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
    if (!products) {
      return {
        status: false,
        message: 'No existen elementos para integrar',
        products: null
      };
    }
    for (const product of products) {
      product.id = i.toString();
      if (product.price === null) {
        product.price = 0;
        product.sale_price = 0;
      }
      const resultCat: any = await findSubcategoryProduct(
        this.getDB(),
        this.collectionCat,
        product.subCategory[0].slug
      );
      if (resultCat.categoria && resultCat.categoria.slug) {
        product.category[0].slug = resultCat.categoria.slug;
        product.category[0].name = resultCat.categoria.description;
      }
      if (resultCat.subCategoria && resultCat.subCategoria.slug) {
        product.subCategory[0].slug = resultCat.subCategoria.slug;
        product.subCategory[0].name = resultCat.subCategoria.description;
      }
      product.slug = slugify(product?.name || '', { lower: true });
      product.active = true;
      i += 1;
      product.registerDate = new Date().toISOString();
      productsAdd.push(product);
      // Recuperar imagenes de icecat todos los proveedores
      const variableLocal = {
        brandIcecat: product.brands[0].slug,
        productIcecat: product.partnumber
      }
      // Busca las imagenes en Icecat Local
      const icecatExt = await new ExternalIcecatsService({}, variableLocal, context).getIcecatProductLocal();
      if (icecatExt.status) {
        if (icecatExt.icecatProductLocal) {
          if (icecatExt.icecatProductLocal.LowPic !== '') {
            product.pictures = [];
            product.sm_pictures = [];
            const imagenes: string[] = icecatExt.icecatProductLocal.ProductGallery.split('|');
            console.log('imagenes: ', imagenes);
            for (const pictureI of imagenes) {
              if (pictureI !== '') {
                const pict: IPicture = {
                  width: '500',
                  height: '500',
                  url: pictureI
                };
                product.pictures.push(pict);
                const pict_sm: IPicture = {
                  width: '300',
                  height: '300',
                  url: pictureI
                };
                product.sm_pictures.push(pict_sm);
              }
            }
          }
        }
      } else {                  // Si no hay imagenes en icecat local buscan en los otros proveedores las imagenes.
        const variableLoc = {
          partNumber: product.partnumber
        }
        const productLocal = await new ProductsService({}, variableLoc, context).getProductField();
        if (productLocal.productField.pictures && productLocal.productField.pictures.length > 0) {
          product.pictures = [];
          product.sm_pictures = [];
          for (const pictureI of productLocal.productField.pictures) {
            if (pictureI !== '') {
              const pict: IPicture = {
                width: '500',
                height: '500',
                url: pictureI
              };
              product.pictures.push(pict);
              const pict_sm: IPicture = {
                width: '300',
                height: '300',
                url: pictureI
              };
              product.sm_pictures.push(pict_sm);
            }
          }
        }
      }
    }
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
      exchangeRate: product?.exchangeRate,
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
      subCategory: product?.subCategory,
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