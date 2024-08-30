import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { asignDocumentIdInt, findOneElement, findSubcategoryProduct } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';
import { IPicture, IProduct } from '../interfaces/product.interface';
import ExternalIcecatsService from './externalIcecat.service';
import ExternalIngramService from './externalIngram.service';
import { Categorys, Especificacion, Picture } from '../models/product.models';
import ExternalBDIService from './externalBDI.service';
import path from 'path';
import logger from '../utils/logger';
import { MAX_CONCURRENT_DOWNLOADS, checkImageExists, downloadImage, downloadQueue, imageCache } from './download.service';
import { checkFileExistsJson, downloadJson } from './downloadJson.service';
import { Attribute, IProductBDI } from '../models/productBDI.models';
import fetch from 'node-fetch';
import TraslateService from './traducciones.services';

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
    const supplierId = variables.supplierId;
    const withImages = variables.withImages;
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
    if (supplierId) {
      filter = { ...filter, ...{ 'suppliersProd.idProveedor': supplierId } };
    }
    // Filtrar solo productos que tengan imagenes.
    if (withImages) {
      filter = {
        ...filter, ...{
          pictures: {
            $exists: true,
            $not: {
              $size: 0
            }
          },
        }
      }
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


  // // Función para obtener el JSON desde una URL y procesarlo
  // async fetchAndProcessJson(url: string): Promise<any> {
  //   try {
  //     const response = await fetch(url);
  //     if (!response.ok) {
  //       throw new Error(`Error al obtener el JSON: ${response.statusText}`);
  //     }
  //     const data: Attribute[] = await response.json();
  //     return await this.generateOutput(data);
  //   } catch (error) {
  //     console.error('Error al procesar el JSON:', error);
  //   }
  // }

  // // Función para generar la salida con los datos obtenidos
  // async generateOutput(data: Attribute[]): Promise<Especificacion[]> {
  //   const especificaciones: Especificacion[] = [];
  //   data.forEach(item => {
  //     especificaciones.push({ tipo: item.attributeName, valor: item.attributeValue });
  //   });
  //   return await especificaciones;
  // }

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
    if (product.sheetJson) {
      const urlImage = `${process.env.API_URL}${product.sheetJson}`;
      console.log('urlImage: ', urlImage);
      // Crear una instancia de TraslateService
      // const translateService = new TraslateService(this.root, this.variables, this.context);
      const translateService = new TraslateService(this.getRoot(), this.getVariables(), this.getContext());
      console.log('translateService: ', translateService);


      // Usar la instancia para llamar a fetchAndProcessJson
      const jsonProduct = await translateService.fetchAndProcessJson(urlImage);

      // const jsonProduct = await TraslateService.fetchAndProcessJson(urlImage);
      console.log('jsonProduct: ', jsonProduct);
    } else {
      const variableLocal = {
        brandIcecat: product.brands[0].slug,
        productIcecat: product.partnumber
      }

      const icecatExt = await new ExternalIcecatsService({}, variableLocal, context).getIcecatProductLocal();

      if (icecatExt.status && product.suppliersProd.idProveedor !== 'syscom') {
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
          // if (icecatExt.icecatProductLocal.Requested_GTIN_EAN_UPC && icecatExt.icecatProductLocal.Requested_GTIN_EAN_UPC.includes('|')) {
          //   gtin.push(...icecatExt.icecatProductLocal.Requested_GTIN_EAN_UPC.split('|'));
          // } else {
          //   gtin.push(icecatExt.icecatProductLocal.Requested_GTIN_EAN_UPC);
          // }
          // Temporal
          gtin.push(icecatExt.icecatProductLocal.Requested_GTIN_EAN_UPC);
          // Fin temporal
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

          if (icecatExt.icecatProductLocal.ProductGallery && icecatExt.icecatProductLocal.ProductGallery.includes('|')) {
            const imagenes: string[] = icecatExt.icecatProductLocal.ProductGallery.split('|');
            if (imagenes.length > 0) {
              product.pictures = [];
              product.sm_pictures = [];
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
        }
      } else {
        const icecat = await new ExternalIcecatsService({}, variableLocal, context).getICecatProductInt(variableLocal);
        if (icecat.status && product.suppliersProd.idProveedor !== 'syscom') {
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
              } else {
                if (pictureI.Pic !== '') {
                  const pict: IPicture = {
                    width: pictureI.PicWidth,
                    height: pictureI.PicHeight,
                    url: pictureI.Pic
                  };
                  product.pictures.push(pict);
                  const pict_sm: IPicture = {
                    width: pictureI.LowWidth,
                    height: pictureI.LowHeight,
                    url: pictureI.ThumbPic
                  };
                  product.sm_pictures.push(pict_sm);
                }
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

    }
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
      registerDate: new Date().toISOString(),
      sheetJson: product?.sheetJson
    };
    const result = await this.add(this.collection, productObject, 'producto');
    return {
      status: result.status,
      message: result.message,
      product: result.item
    };

  }

  async insertMany(context: IContextData) {
    try {
      let firstsProducts: boolean = true;
      const products = this.getVariables().products;
      let productsAdd: IProduct[] = [];
      // Validar que existan productos para integrar.
      if (!products || products.length === 0) {
        logger.error(`insertMany->No existen elementos para integrar`);
        return {
          status: false,
          message: 'No existen elementos para integrar',
          products: null
        };
      }
      // Recupera el siguiente elemento de la tabla.
      let id = parseInt(await asignDocumentIdInt(this.getDB(), this.collection));
      id = id ? id : 1;

      if (isNaN(id)) {
        throw new Error('ID is not a number');
      }
      if (id > 1) {
        firstsProducts = false;
      }
      const idProveedor = products[0].suppliersProd.idProveedor;
      let existingProductsMap = new Map();
      let allExistingProducts = [];
      if (idProveedor !== 'ingram') {
        const responseBDI = await new ExternalBDIService({}, {}, context).getProductsBDI();
        if (!responseBDI || !responseBDI.productsBDI || responseBDI.productsBDI.length === 0) {
          const filter = { 'suppliersProd.idProveedor': idProveedor };
          const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
          if (result && result.items && result.items.length > 0) {
            allExistingProducts = result.items;
            existingProductsMap = new Map(result.items.map(item => [item.partnumber, item]));
          } else {
            let j = id;
            for (const product of products) {
              const productC = await this.categorizarProductos(product, j, firstsProducts);
              productsAdd.push(productC);
              j += 1;
            }
          }
        } else {
          const productsBDI = responseBDI.productsBDI;
          allExistingProducts = productsBDI.map((productBDI: IProductBDI) => productBDI.products);
          existingProductsMap = new Map(productsBDI.map((productBDI: IProductBDI) => [productBDI.products.vendornumber, productBDI]));
        }
      }
      let bulkOperations = [];
      let nextId = id; // Inicializamos nextId con el id recuperado
      const newProductPartNumbers = new Set(products.map(product => product.partnumber));
      // Inactivar productos existentes que no están en la nueva lista de productos
      const productsToInactivate = allExistingProducts.filter((existingProduct: any) => !newProductPartNumbers.has(existingProduct.partnumber));
      for (const productToInactivate of productsToInactivate) {
        bulkOperations.push({
          updateOne: {
            filter: { partnumber: productToInactivate.partnumber, 'suppliersProd.idProveedor': idProveedor },
            update: { $set: { active: false } }
          }
        });
      }
      for (const product of products) {
        const productBDI = existingProductsMap.get(product.partnumber);
        if (productBDI) {
          if (!product.category || (product.category.length > 0 && product.category[0].name === '')) {
            if (productBDI.products && productBDI.products.categoriesIdIngram) {
              const partes = productBDI.products.categoriesIdIngram.split("->");
              product.category = partes.length > 0 ? [{ name: partes[0], slug: slugify(partes[0], { lower: true }), pivot: { product_id: '', product_category_id: '' } }] : [];
              product.subCategory = partes.length > 1 ? [{ name: partes[1], slug: slugify(partes[1], { lower: true }), pivot: { product_id: '', product_category_id: '' } }] : [];
            }
          }

          if (!product.pictures || (product.pictures.length > 0 && product.pictures[0].url === '')) {
            if (productBDI.products.images) {
              const urlsDeImagenes = productBDI.products.images.split(',');
              product.pictures = urlsDeImagenes.map((urlImage: string) => ({ width: '600', height: '600', url: urlImage }));
              product.sm_pictures = urlsDeImagenes.map((urlImage: string) => ({ width: '300', height: '300', url: urlImage }));
            }
          }

          // No modificar el id para productos existentes
          const existingProduct = existingProductsMap.get(product.partnumber);
          if (existingProduct) {
            product.id = existingProduct.id;
          }
        }
        // Asignar un nuevo id solo si el producto es nuevo
        if (!existingProductsMap.has(product.partnumber)) {
          product.id = nextId.toString();
          nextId += 1; // Incrementamos el nextId para el siguiente nuevo producto
        }
        const idP = parseInt(product.id || nextId.toString());
        const productC = await this.categorizarProductos(product, idP, firstsProducts); // Use product.id instead of nextId
        productC.sheetJson = product.sheetJson;
        productsAdd.push(productC);
        // Combinamos los updates en un solo objeto
        const updateData = {
          ...productC,
          active: true
        };
        bulkOperations.push({
          updateOne: {
            filter: { partnumber: product.partnumber, 'suppliersProd.idProveedor': idProveedor },
            update: { $set: updateData },
            upsert: true
          }
        });
      }
      if (bulkOperations.length > 0) {
        const bulkResult = await this.getDB().collection(this.collection).bulkWrite(bulkOperations);
        // Verifica si se realizaron actualizaciones o inserciones
        const isSuccess = (bulkResult.matchedCount || 0) > 0 || (bulkResult.upsertedCount || 0) > 0;
        return {
          status: isSuccess,
          message: isSuccess ? 'Se han actualizado los productos.' : 'No se han actualizado los productos.',
          products: []
        };
      }
      return {
        status: false,
        message: 'No se realizaron operaciones de actualización/inserción',
        products: []
      };
    } catch (error) {
      logger.error(`insertMany->Hubo un error al generar los productos. ${error}`);
      return {
        status: false,
        message: error,
        products: []
      };
    }
  }

  async categorizarProductos(product: IProduct, i: number, firstsProducts: boolean) {
    // Asignar el id solo si es un nuevo producto y no tiene uno
    if (!product.id) {
      product.id = i.toString();
    }

    // Clasificar Categorias y Subcategorias
    if (product.subCategory && product.subCategory.length > 0) {
      if (!firstsProducts) {
        delete product.pictures;
        delete product.sm_pictures;
      }
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
      product.registerDate = new Date().toISOString();
    }
    return await product;
  }

  // Guardar Imagenes
  async saveImages(context: IContextData) {
    try {
      let productsAdd: IProduct[] = [];
      let productsPictures: IProduct[] = [];
      let productsWithoutPictures: IProduct[] = [];
      const supplierId = this.getVariables().supplierId;
      const dafaultImage = 'logo-icon.png';
      const uploadFolder = `./${process.env.UPLOAD_URL}images/`;
      const urlImageSave = `${process.env.UPLOAD_URL}images/`;
      const productsBDIMap = new Map<string, any>();
      const createPicture = (width: string, height: string, url: string) => {
        const picture = new Picture();
        picture.width = width;
        picture.height = height;
        picture.url = url;
        return picture;
      };
      let filter: object = {};
      if (supplierId) {
        filter = {
          'suppliersProd.idProveedor': supplierId,
          'pictures.url': {
            $not: {
              '$regex': '^uploads'
            }
          }
        };
      }
      // Recuperar los productos de un proveedor
      const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
      if (!result || !result.items || result.items.length === 0) {
        logger.error(`saveImages->listAll.products:: No existen elementos para integrar de ${supplierId}.\n`);
        return {
          status: false,
          message: 'No existen elementos para recuperar las imagenes',
          products: []
        };
      }
      let existOnePicture = false;
      let products = result.items as IProduct[];
      // const filteredProducts = products.filter(product => product.pictures && product.pictures.length > 0);
      const idProveedor = supplierId;
      logger.info(`saveImages->productos de ${supplierId}: ${products.length} \n`);

      // ============================== Temporal
      // Identificar los productos que ya tengan imagenes
      for (let i = 0; i < products.length; i++) {
        existOnePicture = false;
        let product = products[i];
        let pictures: Picture[] = [];
        let sm_pictures: Picture[] = [];
        if (product.partnumber !== '') {
          const partnumber = product.partnumber;
          const sanitizedPartnumber = this.sanitizePartnumber(partnumber);
          for (let j = 0; j <= 15; j++) {
            const urlImage = `${process.env.API_URL}${process.env.UPLOAD_URL}images/${sanitizedPartnumber}_${j}.jpg`;
            // logger.info(`saveImages->producto: ${product.partnumber}; imagen: ${urlImage}`);
            let existFile = await checkImageExists(urlImage);
            if (existFile) {
              existOnePicture = true;
              pictures.push(createPicture('600', '600', path.join(urlImageSave, `${sanitizedPartnumber}_${j}.jpg`)));
              sm_pictures.push(createPicture('300', '300', path.join(urlImageSave, `${sanitizedPartnumber}_${j}.jpg`)));
              // console.log(`  ------->  producto: ${product.partnumber}; imagen guardada: ${urlImage}`);
            } else {
              break;
            }
          }
          // Si no hay fotos del producto.
          if (existOnePicture) {
            product.pictures = pictures;
            product.sm_pictures = sm_pictures;
            const updateImage = await this.modifyImages(product);
            if (!updateImage.status) {
              logger.error(`saveImages->No se pudo reiniciar las imagenes de ${product.partnumber}.\n`);
            }
            productsPictures.push(product);
          }
        }
      }

      // Si hubo productos que se encontraron las imagenes en el server daru.
      // logger.info(`Productos con imagenes actualizadas / productsPictures.length: ${productsPictures.length}`);
      if (productsPictures.length > 0) {
        logger.info(`saveImages->productsPictures DARU de ${supplierId}: ${productsPictures.length} \n`);
        const productIdsWithImages = new Set(productsPictures.map(picture => picture.id));
        const filteredProducts = products.filter(product => !productIdsWithImages.has(product.id));
        if (filteredProducts.length > 0) {
          productsWithoutPictures = filteredProducts;
        }
        products = productsWithoutPictures;
      } else {
        productsWithoutPictures = products;
      }
      logger.info(`Productos con imagenes pendientes de actualizar / productsWithoutPictures.length: ${productsWithoutPictures.length}`);

      // Si no hay productos para buscar entonces salir.
      if (productsWithoutPictures.length <= 0) {
        logger.error(`saveImages->products: No se encontraron productos sin imagenes de ${idProveedor}\n`);
        return {
          status: false,
          message: 'No se encontraron productos sin imagenes.',
          products: []
        };
      }
      // ============================== Temporal

      logger.info(`saveImages->productos a buscar imagenes de ${supplierId}: ${products.length} \n`);

      // Out
      return {
        status: true,
        message: 'Fin.',
        products
      };

      // Descarga multiple de archivos
      const downloadImages = async (imageUrls: string[], destFolder: string, partnumber: string, product: any): Promise<void> => {
        await Promise.all(imageUrls.map(async (url: string, index) => {
          const filename = this.generateFilename(this.sanitizePartnumber(partnumber), index);
          const filePath = path.join(destFolder, filename);
          // logger.info(`saveImages->filePath ${filePath} \n`);

          try {
            if (imageCache.has(url)) {
              if (product.pictures[index]) {
                product.pictures[index].url = path.join(urlImageSave, imageCache.get(url)!);
              }
            } else {
              const downloadPromise = downloadImage(url, destFolder, filename);
              downloadQueue.push(downloadPromise);
              if (downloadQueue.length > MAX_CONCURRENT_DOWNLOADS) {
                await Promise.race(downloadQueue);
                downloadQueue.splice(0, 1);
              }
              await downloadPromise;
              imageCache.set(url, filename);
              if (product.pictures[index]) {
                product.pictures[index].url = path.join(urlImageSave, filename);
                // } else {
                // logger.error(`saveImages->error: product.pictures[${index}] is undefined`);
                // Establecer una URL de imagen de reemplazo o un valor predeterminado
                // product.pictures[index] = { url: `${urlImageSave}${dafaultImage}` };
              }
            }
          } catch (error) {
            logger.error(`saveImages-> error.downloadImages: ${error}`);
            // Establecer una URL de imagen de reemplazo o un valor predeterminado
            // if (product.pictures[index]) {
            //   product.pictures[index].url = `${urlImageSave}${dafaultImage}`;
            // }
          }
        }));
      };
      // Proveedor principal Ingram.
      if (idProveedor === 'ingram') {
        logger.info(`saveImages->cargar imagenes de : ${idProveedor} \n`);
        const resultBDI = await new ExternalBDIService({}, {}, context).getProductsBDI();
        if (!resultBDI || !resultBDI.productsBDI) {
          logger.error(`saveImages->resultBDI: ${resultBDI.message} \n`);
          return {
            status: resultBDI.status,
            message: resultBDI.message,
            products: []
          };
        }
        if (!resultBDI.status || resultBDI.productsBDI.length <= 0) {
          logger.error(`saveImages->resultBDI: ${resultBDI.message} \n`);
          return {
            status: resultBDI.status,
            message: resultBDI.message,
            products: []
          };
        }

        // Si se pueden recuperar los datos del servicio de ingram
        const productsBDI = resultBDI.productsBDI;
        logger.info(`saveImages->products ${idProveedor}: ${productsBDI.length}.\n`);

        // Crear un mapa para buscar productos por número de parte
        for (const productBDI of productsBDI) {
          if (productBDI.products && productBDI.products.vendornumber) {
            productsBDIMap.set(productBDI.products.vendornumber, productBDI);
          } else {
            logger.error(`saveImages->Producto ${productBDI.products.vendornumber} no localizado.\n`);
          }
        }

        logger.info(`saveImages->products a revisar: ${products.length}.\n`);

        // Recuperar de todos los productos guardados las imagenes.
        for (let k = 0; k < products.length; k++) {
          let product = products[k];
          const productIngram = productsBDIMap.get(product.partnumber);
          if (productIngram && productIngram.products && productIngram.products.images !== '') {
            let imageUrls = productIngram.products.images.split(',');
            product.pictures = [];
            product.sm_pictures = [];
            await downloadImages(imageUrls.map((url: string) => url.trim()), uploadFolder, product.partnumber, product);
            const updateImage = await this.modifyImages(product);
            if (updateImage.status) {
              productsAdd.push(product);
              // logger.info(`saveImages->producto actualizado: ${product.partnumber}; imagenes guardadas: ${product.pictures?.length}`);
            } else {
              logger.error(`saveImages->No se pudo reiniciar las imagenes de ${product.partnumber}.\n`);
            }
          } else {
            logger.error(`saveImages->No existen imagenes del producto ${product.partnumber} en Ingram.\n`);
          }
        }
      }

      // Proveedores que no tienen imagenes
      if (idProveedor === 'inttelec' || idProveedor === 'daisytek' || idProveedor === 'ct' || idProveedor === 'cva') {
        const productsBDI = (await this.listAll(this.collection, this.catalogName, 1, -1, { 'suppliersProd.idProveedor': { $ne: 'ingram' } })).items;
        logger.info(`insertMany/productsBDI.length: ${productsBDI.length} \n`);
        if (productsBDI && productsBDI.length > 0) {
          const productsBDIMap = new Map<string, any>();
          for (const productBDI of productsBDI) {
            if (productBDI && productBDI.partnumber) {
              productsBDIMap.set(productBDI.partnumber, productBDI);
            }
          }
          // Procesa la carga de imagenes.
          logger.info(`insertMany/products.length: ${products?.length} \n`);
          for (const product of products) {
            const productBDI = productsBDIMap.get(product.partnumber);
            if (productBDI) {
              product.pictures = productBDI.pictures;
              product.sm_pictures = productBDI.sm_pictures;
            } else {
              productsWithoutPictures.push(product);
            }
          }
        }
      }

      // Proveedores que si tienen imagenes
      if (idProveedor === 'syscom') {
        for (let l = 0; l < products.length; l++) {
          let product = products[l];
          let imageUrls = product.pictures?.map((image) => image.url);
          await downloadImages(imageUrls || [], uploadFolder, product.partnumber, product);
          product.sm_pictures = product.pictures;
          productsAdd.push(product);
        }
      }
      logger.info(`saveImages->productsAdd.length: ${productsAdd?.length} \n`);
      return {
        status: true,
        message: 'Se realizo con exito la subida de imagenes.',
        products: []
      };
    } catch (error) {
      // logger.error(`saveImages->error: ${error} \n`);
      return {
        status: false,
        message: error,
        products: []
      };
    }
  }

  // Guardar Jsons
  async saveJsons(context: IContextData) {
    try {
      let productsAdd: IProduct[] = [];
      let productsJsons: IProduct[] = [];
      let productsWithoutJsons: IProduct[] = [];
      const supplierId = this.getVariables().supplierId;
      const uploadFolder = `./${process.env.UPLOAD_URL}jsons/`;
      const urlJsonSave = `${process.env.UPLOAD_URL}jsons/`;
      const productsBDIMap = new Map<string, any>();

      let filter: object = {};
      if (supplierId) {
        filter = {
          'suppliersProd.idProveedor': supplierId,
          'sheetJson': {
            $not: {
              '$regex': '^uploads'
            }
          }
        };
      }
      // Recuperar los productos de un proveedor
      const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
      if (!result || !result.items || result.items.length === 0) {
        logger.error(`saveJsons->listAll.products:: No existen elementos para integrar de ${supplierId}.\n`);
        return {
          status: false,
          message: 'No existen elementos para recuperar los json',
          products: []
        };
      }
      let existOneJson = false;
      let products = result.items as IProduct[];
      // const filteredProducts = products.filter(product => product.pictures && product.pictures.length > 0);
      const idProveedor = supplierId;
      logger.info(`saveJsons->productos de ${supplierId}: ${products.length} \n`);

      // ============================== Temporal
      // Identificar los productos que ya tengan jsons
      for (let i = 0; i < products.length; i++) {
        existOneJson = false;
        let product = products[i];
        // logger.info(`saveJsons->producto sheetJson: ${product.partnumber}; imagen a buscar: ${product.sheetJson}`);
        if (product.partnumber !== '') {
          const partnumber = product.partnumber;
          const sanitizedPartnumber = this.sanitizePartnumber(partnumber);
          const urlImage = `${process.env.API_URL}${process.env.UPLOAD_URL}jsons/${sanitizedPartnumber}.json`;
          let existFile = await checkFileExistsJson(urlImage);
          // logger.info(`saveJsons->prod:${product.partnumber}; json:${urlImage}; exis:(${existFile})`);
          // Si hay fotos del producto.
          if (existFile) {
            // logger.info(`  :::::  producto: ${product.partnumber}; json: ${urlImage}`);
            product.sheetJson = `${process.env.UPLOAD_URL}jsons/${sanitizedPartnumber}.json`;;
            const updateImage = await this.modifyJsons(product);
            if (!updateImage.status) {
              logger.error(`saveJsons->No se pudo reiniciar los json de ${product.partnumber}.\n`);
            }
            productsJsons.push(product);
          }
        }
      }

      // Out
      return {
        status: true,
        message: 'Fin.',
        products: productsJsons
      };

      // Si hubo productos que se encontraron los json en el server daru.
      // logger.info(`Productos con jsons actualizados / productsJsons.length: ${productsJsons.length}`);
      if (productsJsons.length > 0) {
        logger.info(`saveJsons->productsJsons DARU de ${supplierId}: ${productsJsons.length} \n`);
        const productIdsWithJsons = new Set(productsJsons.map(jsonProd => jsonProd.id));
        const filteredProducts = products.filter(product => !productIdsWithJsons.has(product.id));
        if (filteredProducts.length > 0) {
          productsWithoutJsons = filteredProducts;
        }
        products = productsWithoutJsons;
      } else {
        productsWithoutJsons = products;
      }
      logger.info(`Productos con jsons pendientes de actualizar / productsWithoutJsons.length: ${productsWithoutJsons.length}`);

      // Si no hay productos para buscar entonces salir.
      if (productsWithoutJsons.length <= 0) {
        logger.error(`saveJsons->products: No se encontraron productos sin jsons de ${idProveedor}\n`);
        return {
          status: false,
          message: 'No se encontraron productos sin jsons.',
          products: []
        };
      }
      // ============================== Temporal

      logger.info(`saveJsons->productos a buscar jsons de ${supplierId}: ${products.length} \n`);

      const downloadJsons = async (imageUrl: string, destFolder: string, partnumber: string, product: any): Promise<void> => {
        const filename = this.generateFilenameJson(this.sanitizePartnumber(partnumber));
        const filePath = path.join(destFolder, filename);

        try {
          // if (imageCache.has(imageUrl)) {
          //   if (product.saveJsons) {
          //     product.saveJsons = path.join(urlJsonSave, imageCache.get(imageUrl)!);
          //   }
          // } else {
          const downloadPromise = downloadJson(imageUrl, destFolder, filename);
          downloadQueue.push(downloadPromise);
          if (downloadQueue.length > MAX_CONCURRENT_DOWNLOADS) {
            await Promise.race(downloadQueue);
            downloadQueue.splice(0, 1);
          }
          await downloadPromise;
          imageCache.set(imageUrl, filename);
          if (product.sheetJson) {
            product.sheetJson = path.join(urlJsonSave, filename);
            // } else {
            //   logger.error(`saveJsons->error: product.sheetJson is undefined`);
          }
          // }
        } catch (error) {
          logger.error(`saveJsons->error.downloadJsons: ${error}`);
        }
      };
      // Proveedor principal Ingram.
      if (idProveedor === 'ingram') {
        logger.info(`saveJsons->cargar jsons de : ${idProveedor} \n`);
        const resultBDI = await new ExternalBDIService({}, {}, context).getProductsBDI();
        if (!resultBDI || !resultBDI.productsBDI) {
          logger.error(`saveJsons->resultBDI: Error en la recuperacion de los productos de ${idProveedor}\n`);
          return {
            status: false,
            message: `Error en la recuperacion de los productos de ${idProveedor}\n`,
            products: []
          };
        }
        if (!resultBDI.status || resultBDI.productsBDI.length <= 0) {
          logger.error(`saveJsons->resultBDI: ${resultBDI.message} \n`);
          return {
            status: resultBDI.status,
            message: resultBDI.message,
            products: []
          };
        }

        // Si se pueden recuperar los datos del servicio de ingram
        const productsBDI = resultBDI.productsBDI;
        logger.info(`saveJsons->products ${idProveedor}: ${productsBDI.length}.\n`);

        // Crear un mapa para buscar productos por número de parte
        for (const productBDI of productsBDI) {
          if (productBDI.products && productBDI.products.vendornumber) {
            productsBDIMap.set(productBDI.products.vendornumber, productBDI);
          } else {
            logger.error(`saveJsons->Producto ${productBDI.products.vendornumber} no localizado.\n`);
          }
        }

        logger.info(`saveJsons->products a revisar: ${products.length}.\n`);

        // Recuperar de todos los productos guardados con json.
        for (let k = 0; k < products.length; k++) {
          let product = products[k];
          const productIngram = productsBDIMap.get(product.partnumber);
          if (productIngram && productIngram.products && productIngram.products.sheetJson !== '') {
            let jsonUrls = productIngram.products.sheetJson;
            // await downloadJsons(jsonUrls.map((url: string) => url.trim()), uploadFolder, product.partnumber, product);
            await downloadJsons(jsonUrls, uploadFolder, product.partnumber, product);
            const updateJson = await this.modifyJsons(product);
            if (updateJson.status) {
              productsAdd.push(product);
              // logger.info(`saveJsons->producto actualizado: ${product.partnumber}; json guardado: ${product.sheetJson}`);
            } else {
              logger.error(`saveJsons->No se pudo reiniciar los json de ${product.partnumber}.\n`);
            }
          } else {
            logger.error(`saveJsons->No existen imagenes del producto ${product.partnumber} en Ingram.\n`);
          }
        }
      }

      // Proveedores que no tienen jsons
      if (idProveedor === 'inttelec' || idProveedor === 'daisytek' || idProveedor === 'ct' || idProveedor === 'cva') {
        const productsBDI = (await this.listAll(this.collection, this.catalogName, 1, -1, { 'suppliersProd.idProveedor': { $ne: 'ingram' } })).items;
        logger.info(`insertMany/productsBDI.length: ${productsBDI.length} \n`);
        if (productsBDI && productsBDI.length > 0) {
          const productsBDIMap = new Map<string, any>();
          for (const productBDI of productsBDI) {
            if (productBDI && productBDI.partnumber) {
              productsBDIMap.set(productBDI.partnumber, productBDI);
            }
          }
          // Procesa la carga de jsons.
          logger.info(`insertMany/products.length: ${products?.length} \n`);
          for (const product of products) {
            const productBDI = productsBDIMap.get(product.partnumber);
            if (productBDI) {
              product.sheetJson = productBDI.sheetJson;
            } else {
              productsWithoutJsons.push(product);
            }
          }
        }
      }

      // Proveedores que si tienen jsons
      if (idProveedor === 'syscom') {
        for (let l = 0; l < products.length; l++) {
          let product = products[l];
          let imageUrls = product.sheetJson as string;
          await downloadJsons(imageUrls, uploadFolder, product.partnumber, product);
          product.sheetJson = product.sheetJson;
          productsAdd.push(product);
        }
      }
      logger.info(`saveJsons->productsAdd.length: ${productsAdd?.length} \n`);
      return {
        status: true,
        message: 'Se realizo con exito la subida de jsons.',
        products: []
      };
    } catch (error) {
      // logger.error(`saveJsons->error: ${error} \n`);
      return {
        status: false,
        message: error,
        products: []
      };
    }
  }

  // Modificar Item
  async modifyImages(product: IProduct) {
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
      pictures: product?.pictures,
      sm_pictures: product?.sm_pictures,
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

  // Modificar Item
  async modifyJsons(product: IProduct) {
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
      sheetJson: product?.sheetJson,
      updaterDate: new Date().toISOString()
    };
    // Conocer el id de la marcar
    const filter = { id: product?.id };
    // Ejecutar actualización
    // console.log('filter: ', filter);
    // console.log('objectUpdate: ', objectUpdate);
    const result = await this.update(this.collection, filter, objectUpdate, 'productos');
    return {
      status: result.status,
      message: result.message,
      product: result.item
    };
  }

  // Función para reemplazar caracteres no permitidos en los nombres de archivo
  sanitizePartnumber(partnumber: string): string {
    return partnumber.replace(/[\/ #]/g, '_');
  }

  generateFilename(partNumber: string, index: number): string {
    return `${partNumber}_${index}.jpg`;
  }

  generateFilenameJson(partNumber: string): string {
    return `${partNumber}.json`;
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