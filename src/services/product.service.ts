import slugify from 'slugify';
import { ACTIVE_VALUES_FILTER, COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { asignDocumentIdInt, findOneElement, findSubcategoryProduct } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';
import { IPicture, IProduct, IProductResponse } from '../interfaces/product.interface';
import ExternalIcecatsService from './externalIcecat.service';
import ExternalIngramService from './externalIngram.service';
import { Especificacion, Picture } from '../models/product.models';
import ExternalBDIService from './externalBDI.service';
import logger from '../utils/logger';
import { MAX_CONCURRENT_DOWNLOADS, checkImageExists, downloadImage, downloadQueue, imageCache } from './download.service';
import { checkFileExistsJson, downloadJson } from './downloadJson.service';
import { IProductBDI } from '../models/productBDI.models';
import TraslateService from './traducciones.services';
import { loadAndNormalizeJson } from './fileService'; // Ajusta la ruta según tu estructura de carpetas
import { env } from 'process';
import http from 'http';
import https from 'https';
import { ICatalog } from '../interfaces/catalog.interface';
import * as fs from 'fs';
import * as path from 'path';

class ProductsService extends ResolversOperationsService {
  collection = COLLECTIONS.PRODUCTS;
  collectionCat = COLLECTIONS.CATEGORYS;
  catalogName = 'Productos';

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion
  async items(variables: IVariables): Promise<IProductResponse> {
    const {
      active,
      filterName = '',
      offer,
      brands,
      categories,
      subCategories,
      supplierId,
      withImages,
      isAdmin
    } = variables;

    const regExp = new RegExp(filterName, 'i');

    // Construir el filtro inicial basado en el estado activo
    let filter = this.buildActiveFilter(active || ACTIVE_VALUES_FILTER.ALL);

    // Agregar filtros adicionales
    filter = this.addTextFilters(filter, regExp, filterName);
    filter = this.addOfferFilter(filter, offer);
    filter = this.addArrayFilters(filter, 'brands.slug', brands);
    filter = this.addArrayFilters(filter, 'category.slug', categories);
    filter = this.addArrayFilters(filter, 'subCategory.slug', subCategories);
    filter = this.addSupplierFilter(filter, supplierId);
    filter = this.addImageFilter(filter, withImages);

    const { page = 1, itemsPage = 10 } = this.getVariables().pagination || {};
    const result = await this.listProducts(this.collection, this.catalogName, page, itemsPage, filter, isAdmin);

    return {
      info: result.info,
      status: result.status,
      message: result.message,
      products: result.products
    };
  }

  private buildActiveFilter(active: string): object {
    if (active === ACTIVE_VALUES_FILTER.ALL) {
      return {}; // Sin filtro
    }

    return { active: active === ACTIVE_VALUES_FILTER.INACTIVE ? { $eq: false } : { $ne: false } };
  }

  private addTextFilters(filter: object, regExp: RegExp, filterName: string): object {
    if (!filterName) return filter;
    return {
      ...filter,
      $or: [
        { name: regExp },
        { sku: regExp },
        { partnumber: regExp }
      ]
    };
  }

  private addOfferFilter(filter: object, offer?: boolean): object {
    if (offer) {
      return { ...filter, featured: { $eq: offer } };
    }
    return filter;
  }

  private addArrayFilters(filter: object, fieldPath: string, values?: ICatalog[]): object {
    if (values && values.length > 0) {
      return { ...filter, [fieldPath]: { $in: values } };
    }
    return filter;
  }

  private addSupplierFilter(filter: object, supplierId?: string): object {
    if (supplierId) {
      return { ...filter, 'suppliersProd.idProveedor': supplierId };
    }
    return filter;
  }

  private addImageFilter(filter: object, withImages?: boolean): object {
    if (withImages) {
      return {
        ...filter,
        pictures: {
          $exists: true,
          $not: { $size: 0 },
        },
        "pictures.url": { $regex: "^uploads" }
      };
    }
    return filter;
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
    if (product.sheetJson) {
      const urlImage = `${process.env.API_URL}${product.sheetJson}`;
      // Crear una instancia de TraslateService
      const translateService = new TraslateService(this.getRoot(), this.getVariables(), this.getContext());
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
      let firstsProducts = true;
      const products = this.getVariables().products;
      let productsAdd: IProduct[] = [];
      if (!products || products.length === 0) {
        return {
          status: false,
          message: 'No existen elementos para integrar',
          products: null,
        };
      }
      logger.info(`insertMany->products.length: ${products.length}.`);
      // Recuperar el siguiente ID disponible
      let id = parseInt(await asignDocumentIdInt(this.getDB(), this.collection));
      id = isNaN(id) ? 1 : id;
      firstsProducts = id > 1 ? false : true;

      const idProveedor = products[0].suppliersProd.idProveedor;
      let existingProductsMap = new Map<string, any>();
      let existingProductsBDIMap = new Map<string, any>();
      let allExistingProducts = [];
      let allExistingProductsBDI = [];

      const filter = { 'suppliersProd.idProveedor': idProveedor };
      const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
      logger.info(`insertMany->listAll. ${result.status}; ${result.message}.`);
      if (result && result.items && result.items.length > 0) {
        allExistingProducts = result.items;
        logger.info(`insertMany->allExistingProducts.length: ${allExistingProducts.length}.`);
        existingProductsMap = new Map(result.items.map(item => [item.partnumber, item]));
      }

      // Recuperar productos existentes del proveedor
      if (idProveedor !== 'ingram') {
        const responseBDI = await new ExternalBDIService({}, {}, context).getProductsBDI();
        logger.info(`insertMany->responseBDI. ${responseBDI.status}; ${responseBDI.message}.`);

        // Manejo de productos existentes si no se obtienen de la fuente externa
        if (!responseBDI || !responseBDI.productsBDI || responseBDI.productsBDI.length === 0) {
          const filter = { 'suppliersProd.idProveedor': idProveedor };
          const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
          logger.info(`insertMany->listAll. ${result.status}; ${result.message}.`);

          if (!result || !result.items || result.items.length === 0) {
            // Asignar nuevos ids para productos nuevos si no hay productos existentes
            let j = id;
            for (const product of products) {
              const productC = await this.categorizarProductos(product, j, firstsProducts);
              productsAdd.push(productC);
              j += 1;
            }
          }
        } else {
          // Manejar productos obtenidos de la fuente externa
          const productsBDI = responseBDI.productsBDI;
          allExistingProductsBDI = productsBDI.map((productBDI: IProductBDI) => productBDI.products);
          logger.info(`insertMany->allExistingProductsBDI.length: ${allExistingProductsBDI.length}.`);
          existingProductsBDIMap = new Map(productsBDI.map((productBDI: IProductBDI) => [productBDI.products.vendornumber, productBDI]));
        }
      }

      let bulkOperations = [];
      let nextId = id;
      const newProductPartNumbers = new Set(products.map(product => product.partnumber));
      // Inactivar productos que no están en la nueva lista
      const productsToInactivate = allExistingProducts.filter(
        (existingProduct: any) => !newProductPartNumbers.has(existingProduct.partnumber)
      );
      for (const productToInactivate of productsToInactivate) {
        bulkOperations.push({
          updateOne: {
            filter: { partnumber: productToInactivate.partnumber, 'suppliersProd.idProveedor': idProveedor },
            update: { $set: { active: false } },
          },
        });
      }
      // Procesar productos para actualización o inserción
      for (const product of products) {
        const existingProduct = existingProductsMap.get(product.partnumber);
        // Si el producto existe, conservar el ID y evitar modificaciones no deseadas
        if (existingProduct) {
          product.id = existingProduct.id;
        } else {
          // Si es un nuevo producto, asignar un nuevo ID
          product.id = nextId.toString();
          nextId += 1;
        }
        // Verificar el id antes de continuar
        if (!existingProduct || (existingProduct && product.id === existingProduct.id)) {
          // Procesar el producto antes de agregarlo
          const idP = parseInt(product.id || nextId.toString());
          const productC = await this.categorizarProductos(product, idP, firstsProducts);
          const sanitizedPartnumber = this.sanitizePartnumber(product.partnumber);
          // Verificar archivos JSON
          const resultEspec = await this.readJson(sanitizedPartnumber);
          if (resultEspec.status) {
            const urlJson = `${env.UPLOAD_URL}jsons/${sanitizedPartnumber}.json`;
            productC.sheetJson = urlJson;
            const especificaciones: Especificacion[] = resultEspec.getJson;
            especificaciones.forEach(nuevaEspecificacion => {
              const index = productC.especificaciones.findIndex(
                especificacion => especificacion.tipo === nuevaEspecificacion.tipo
              );
              if (index !== -1) {
                productC.especificaciones[index] = nuevaEspecificacion;
              } else {
                productC.especificaciones.push(nuevaEspecificacion);
              }
            });
          }
          // Verificar imágenes
          productC.pictures = product.pictures;
          // console.log('product.pictures: ', product.pictures);
          productC.sm_pictures = product.sm_pictures;
          const resultImages = await this.readImages(sanitizedPartnumber);
          if (resultImages && resultImages.status) {
            productC.pictures = resultImages.getImages;
            productC.sm_pictures = resultImages.getImages;
          }
          productsAdd.push(productC);
          // Preparar los datos para la operación de actualización o inserción
          const updateData = {
            ...productC,
            active: true,
          };
          bulkOperations.push({
            updateOne: {
              filter: { partnumber: product.partnumber, 'suppliersProd.idProveedor': idProveedor },
              update: { $set: updateData },
              upsert: true,
            },
          });
        } else {
          // Log para identificar si se detectó un conflicto de IDs
          logger.warn(`Conflicto detectado: se intentó cambiar el id del producto existente. Partnumber: ${product.partnumber}, id esperado: ${existingProduct?.id}, id asignado: ${product.id}`);
        }
      }
      // Verificar antes de ejecutar bulkWrite
      logger.info(`Preparando para bulkWrite. Operaciones a ejecutar: ${bulkOperations.length}`);
      // bulkOperations.forEach(op => logger.debug(`Operación: ${JSON.stringify(op)}`));
      // Ejecutar operaciones bulk
      if (bulkOperations.length > 0) {
        const bulkResult = await this.getDB().collection(this.collection).bulkWrite(bulkOperations);
        logger.info(`bulkResult.matchedCount: ${bulkResult.upsertedCount}`);
        logger.info(`bulkResult.upsertedCount: ${bulkResult.matchedCount}`);
        const isSuccess = (bulkResult.matchedCount || 0) > 0 || (bulkResult.upsertedCount || 0) > 0;
        return {
          status: isSuccess,
          message: isSuccess ? 'Se han actualizado los productos.' : 'No se han actualizado los productos.',
          products: [],
        };
      }
      return {
        status: false,
        message: 'No se realizaron operaciones de actualización/inserción',
        products: [],
      };
    } catch (error) {
      logger.error(`Error en insertMany: ${error}`);
      return {
        status: false,
        message: `Error: ${error}`,
        products: [],
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
      // if (!firstsProducts) {
      //   delete product.pictures;
      //   delete product.sm_pictures;
      // }
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

  // Cargar Nuevas Imagenes
  async addNewImages(context: IContextData) {
    try {
      let productsAdd: IProduct[] = [];
      let productsPictures: IProduct[] = [];
      let productsWithoutPictures: IProduct[] = [];
      const supplierId = this.getVariables().supplierId;
      const uploadBaseFolder = `./${process.env.UPLOAD_URL}images/`;
      const urlImageSaveBase = `${process.env.UPLOAD_URL}images/`;
      const productsBDIMap = new Map<string, any>();
      const productsSyscomMap = new Map<string, any>();

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
        return {
          status: false,
          message: `No existen elementos para recuperar las imágenes de ${supplierId}.`,
          products: []
        };
      }

      let existOnePicture = false;
      let products = result.items as IProduct[];
      const idProveedor = supplierId;
      logger.info(`saveImages->productos de ${supplierId}: ${products.length} \n`);

      // Función para descargar múltiples imágenes
      const downloadImages = async (imageUrls: string[], partnumber: string, product: any): Promise<void> => {
        const destFolder = path.join(uploadBaseFolder, this.sanitizePartnumber(partnumber));

        // Crear la carpeta si no existe
        if (!fs.existsSync(destFolder)) {
          fs.mkdirSync(destFolder, { recursive: true });
        }

        await Promise.all(imageUrls.map(async (url: string, index) => {
          const filename = this.generateFilename(this.sanitizePartnumber(partnumber), index);
          const filePath = path.join(destFolder, filename);

          try {
            if (imageCache.has(url)) {
              if (product.pictures[index]) {
                product.pictures[index].url = path.join(urlImageSaveBase, this.sanitizePartnumber(partnumber), imageCache.get(url)!);
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
                product.pictures[index].url = path.join(urlImageSaveBase, this.sanitizePartnumber(partnumber), filename);
              }
            }
          } catch (error) {
            logger.error(`saveImages-> error.downloadImages: ${error}`);
          }
        }));
      };

      // Proveedor principal Ingram
      if (idProveedor === 'ingram') {
        logger.info(`saveImages->cargar imágenes de : ${idProveedor} \n`);
        const resultBDI = await new ExternalBDIService({}, {}, context).getProductsBDI();
        if (!resultBDI || !resultBDI.productsBDI) {
          return {
            status: resultBDI.status,
            message: resultBDI.message,
            products: []
          };
        }

        const productsBDI = resultBDI.productsBDI;
        logger.info(`saveImages->productsBDI ${idProveedor}: ${productsBDI.length}.\n`);

        // Crear un mapa para buscar productos por número de parte
        for (const productBDI of productsBDI) {
          if (productBDI.products && productBDI.products.vendornumber) {
            productsBDIMap.set(productBDI.products.vendornumber, productBDI);
          }
        }

        logger.info(`saveImages->products ${idProveedor}: ${products.length}.\n`);

        for (let k = 0; k < products.length; k++) {
          let product = products[k];
          const productIngram = productsBDIMap.get(product.partnumber);
          if (productIngram && productIngram.products && productIngram.products.images !== '') {
            let imageUrls = productIngram.products.images.split(',');
            product.pictures = [];
            product.sm_pictures = [];
            await downloadImages(imageUrls.map((url: string) => url.trim()), product.partnumber, product);
            const updateImage = await this.modifyImages(product);
            if (updateImage.status) {
              productsAdd.push(product);
            } else {
              logger.error(`saveImages->No se pudieron reiniciar las imágenes de ${product.partnumber}.\n`);
            }
          } else {
            logger.error(`saveImages->No existen imágenes del producto ${product.partnumber} en Ingram.\n`);
          }
        }
      } else {
        if (idProveedor === 'syscom' || idProveedor === 'ct') {
          logger.info(`saveImages->cargar imágenes de : ${idProveedor} \n`);
          const filter = { 'suppliersProd.idProveedor': idProveedor };
          const resultSyscom = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
          logger.info(`insertMany->listAll. ${resultSyscom.status}; ${resultSyscom.message}.`);
          if (!resultSyscom || !resultSyscom.items) {
            return {
              status: resultSyscom.status,
              message: resultSyscom.message,
              products: []
            };
          }
          const productsSyscom = resultSyscom.items;
          logger.info(`saveImages->productsSyscom ${idProveedor}: ${productsSyscom.length}.\n`);
          // Crear un mapa para buscar productos por número de parte
          for (const productSyscom of productsSyscom) {
            if (productSyscom && productSyscom.partnumber) {
              productsSyscomMap.set(productSyscom.partnumber, productSyscom);
            }
          }
          logger.info(`saveImages->products ${idProveedor}: ${products.length}.\n`);
          for (let k = 0; k < products.length; k++) {
            let product = products[k];
            const productIngram = productsSyscomMap.get(product.partnumber);
            // Verificamos si el producto tiene imágenes en el campo "pictures"
            if (productIngram && productIngram.pictures && productIngram.pictures.length > 0) {
              // Extraemos las URLs de las imágenes desde el array de objetos "pictures"
              let imageUrls = productIngram.pictures.map((picture: any) => picture.url);
              // // Inicializamos los arrays de imágenes
              // product.pictures = [];
              // product.sm_pictures = [];
              // Usamos la función reutilizada para descargar las imágenes
              await downloadImages(imageUrls, product.partnumber, product);
              // Modificamos las imágenes en el producto
              const updateImage = await this.modifyImages(product);
              if (updateImage.status) {
                productsAdd.push(product);
              } else {
                logger.error(`saveImages->No se pudieron reiniciar las imágenes de ${product.partnumber}.\n`);
              }
            } else {
              // logger.error(`saveImages->No existen imágenes del producto ${product.partnumber}.\n`);
            }
          }

        }
      }

      // Otros proveedores...

      logger.info(`saveImages->productsAdd.length: ${productsAdd?.length} \n`);
      return {
        status: true,
        message: 'Se realizó con éxito la subida de imágenes.',
        products: []
      };
    } catch (error) {
      return {
        status: false,
        message: error,
        products: []
      };
    }
  }

  // Guardar Imagenes
  async updateImages(context: IContextData) {
    try {
      let productsPictures: IProduct[] = [];
      let productsWithoutPictures: IProduct[] = [];
      const supplierId = this.getVariables().supplierId;
      const urlImageSaveBase = `${process.env.UPLOAD_URL}images/`; // Ruta base para guardar imágenes

      // Crear una función para guardar la imagen con la ruta correcta
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
        return {
          status: false,
          message: `No existen elementos para recuperar las imagenes de ${supplierId}.`,
          products: []
        };
      }

      let products = result.items as IProduct[];
      const idProveedor = supplierId;
      logger.info(`saveImages->productos de ${supplierId}: ${products.length} \n`);

      // ============================== Temporal
      // Identificar los productos que ya tengan imagenes
      for (let i = 0; i < products.length; i++) {
        let product = products[i];
        let pictures: Picture[] = [];
        let sm_pictures: Picture[] = [];

        if (product.partnumber !== '') {
          const partnumber = product.partnumber;
          const sanitizedPartnumber = this.sanitizePartnumber(partnumber);
          let existOnePicture = false; // Mueve la variable aquí para reiniciarla por producto
          const maxImagesToSearch = 6; // Máximo de imágenes a buscar
          const maxConsecutiveMissesAfterFound = 3; // Máximo de imágenes consecutivas faltantes después de encontrar alguna

          let consecutiveMisses = 0; // Contador de imágenes no encontradas consecutivas
          let foundAtLeastOneImage = false; // Indicador de si ya se encontró al menos una imagen

          // Intentamos buscar hasta 6 imágenes o hasta encontrar 3 faltantes consecutivas después de la primera imagen
          for (let j = 0; j <= maxImagesToSearch; j++) {
            // Modificamos la URL para que incluya una carpeta con el número de parte
            const urlImage = `${process.env.API_URL}${process.env.UPLOAD_URL}images/${sanitizedPartnumber}/${sanitizedPartnumber}_${j}.jpg`;
            let existFile = await checkImageExists(urlImage);

            if (existFile) {
              existOnePicture = true;
              foundAtLeastOneImage = true; // Ya se encontró al menos una imagen
              consecutiveMisses = 0; // Reseteamos el contador de fallos consecutivos si encontramos una imagen

              // Guardar la imagen encontrada dentro de la carpeta del número de parte
              pictures.push(createPicture('600', '600', `${urlImageSaveBase}${sanitizedPartnumber}/${sanitizedPartnumber}_${j}.jpg`));
              sm_pictures.push(createPicture('300', '300', `${urlImageSaveBase}${sanitizedPartnumber}/${sanitizedPartnumber}_${j}.jpg`));

              // logger.info(`  ------->  producto: ${product.partnumber}; imagen guardada: ${urlImage}`);
            } else {
              if (foundAtLeastOneImage) {
                consecutiveMisses++; // Solo contar fallos consecutivos si ya se encontró una imagen
              }

              // logger.info(`  ------->  producto: ${product.partnumber}; imagen NO encontrada: ${urlImage}`);
            }

            // Si alcanzamos el máximo de fallos consecutivos después de encontrar al menos una imagen, detenemos la búsqueda
            if (consecutiveMisses >= maxConsecutiveMissesAfterFound) {
              logger.info(`Deteniendo la búsqueda de imágenes para ${product.partnumber} después de ${consecutiveMisses} imágenes faltantes consecutivas.`);
              break;
            }
          }

          // Si se encontró al menos una imagen, guardamos las imágenes del producto
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

      // Si hubo productos que se encontraron las imágenes en el server daru.
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
        return {
          status: false,
          message: `No se encontraron productos sin imagenes de ${idProveedor}.`,
          products: []
        };
      }

      logger.info(`saveImages->productos a buscar imagenes de ${supplierId}: ${products.length} \n`);
      // Out
      return {
        status: true,
        message: 'Fin.',
        products
      };

    } catch (error) {
      return {
        status: false,
        message: error,
        products: []
      };
    }
  }

  // Cargar Nuevos Jsons
  async addNewJsons(context: IContextData) {
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

      const downloadJsons = async (imageUrl: string, destFolder: string, partnumber: string, product: any): Promise<void> => {
        const filename = this.generateFilenameJson(this.sanitizePartnumber(partnumber));
        const filePath = path.join(destFolder, filename);

        try {
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
          }
        } catch (error) {
          logger.error(`saveJsons->error.downloadJsons: ${error}`);
        }
      };
      // Proveedor principal Ingram.
      if (idProveedor === 'ingram') {
        logger.info(`saveJsons->cargar jsons de : ${idProveedor} \n`);
        const resultBDI = await new ExternalBDIService({}, {}, context).getProductsBDI();
        if (!resultBDI || !resultBDI.productsBDI) {
          return {
            status: false,
            message: `Error en la recuperacion de los productos de ${idProveedor}\n`,
            products: []
          };
        }
        if (!resultBDI.status || resultBDI.productsBDI.length <= 0) {
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
            logger.error(`saveJsons->No existe json del producto ${product.partnumber} en Ingram.\n`);
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
      return {
        status: false,
        message: error,
        products: []
      };
    }
  }

  // Guardar Jsons
  async updateJsons(context: IContextData) {
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
        return {
          status: false,
          message: `No existen elementos para recuperar los json de ${supplierId}.`,
          products: []
        };
      }
      let existOneJson = false;
      let products = result.items as IProduct[];
      // const filteredProducts = products.filter(product => product.pictures && product.pictures.length > 0);
      const idProveedor = supplierId;
      logger.info(`saveJsons->productos de ${supplierId}: ${products.length} \n`);
      // Identificar los productos que ya tengan jsons
      for (let i = 0; i < products.length; i++) {
        existOneJson = false;
        let product = products[i];
        if (product.partnumber !== '') {
          // logger.info(`prod:${product.partnumber}; json:${product.sheetJson}`);
          const partnumber = product.partnumber;
          const sanitizedPartnumber = this.sanitizePartnumber(partnumber);
          const urlImage = `${process.env.API_URL}${process.env.UPLOAD_URL}jsons/${sanitizedPartnumber}.json`;
          let existFile = await checkFileExistsJson(urlImage);
          // logger.info(`json:${urlImage}; exist:(${existFile})`);
          // Si hay archivo json.
          if (existFile) {
            // logger.info(`  :::::  json guardado: ${urlImage}`);
            product.sheetJson = `${process.env.UPLOAD_URL}jsons/${sanitizedPartnumber}.json`;;
            const updateImage = await this.modifyJsons(product);
            if (!updateImage.status) {
              logger.error(`saveJsons->No se pudo reiniciar los json de ${product.partnumber}.\n`);
            }
            productsJsons.push(product);
          }
        }
      }

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
        return {
          status: false,
          message: `No se encontraron productos sin jsons de ${idProveedor}.`,
          products: []
        };
      }

      logger.info(`saveJsons->productsAdd.length: ${productsAdd?.length} \n`);

      // Out
      return {
        status: true,
        message: 'Se realizo con exito la subida de jsons.',
        products: productsJsons
      };

    } catch (error) {
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
    const result = await this.update(this.collection, filter, objectUpdate, 'productos');
    return {
      status: result.status,
      message: result.message,
      product: result.item
    };
  }

  // Función para caracteres especiales (incluyendo tabulaciones, saltos de línea, etc.) por "_"
  sanitizePartnumber(partnumber: string): string {
    return partnumber.replace(/[\/ #\t\n\r:*?<>\|]/g, '_').trim();
  }

  generateFilename(partnumber: string, index: number): string {
    return `${partnumber}_${index}.jpg`;
  }

  generateFilenameJson(partnumber: string): string {
    return `${partnumber}.json`;
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

  // Buscar json por el partnumber
  async readJson(idProd: string = ''): Promise<{ status: boolean; message: string; getJson: [Especificacion] }> {
    const productId = idProd === '' ? this.getVariables().productId : idProd;
    if (productId == null) {
      return {
        status: false,
        message: 'Producto no definido, verificar datos.',
        getJson: [{ tipo: '', valor: '' }]
      };
    }
    const urlJson = `${env.API_URL}${env.UPLOAD_URL}/jsons/${productId}.json`;
    const client = urlJson.startsWith('https') ? https : http;
    try {
      const jsonData: any = await new Promise<any>((resolve, reject) => {
        const options: https.RequestOptions = {
          rejectUnauthorized: false
        };
        client.get(urlJson, options, (response) => {
          let data = '';
          if (response.statusCode !== 200) {
            let MessageError = '';
            switch (response.statusCode) {
              case 404:
                MessageError = 'Error 404: Archivo Json no encontrado.';
                break;
              case 500:
                MessageError = 'Error 500: Error interno del servidor.';
                break;
              case 403:
                MessageError = 'Error 403: Acceso prohibido al Archivo Json.';
                break;
              case 400:
                MessageError = 'Error 400: Solicitud incorrecta.';
                break;
              default:
                MessageError = `Error ${response.statusCode}: Ocurrió un problema desconocido.`;
            }
            reject(new Error(MessageError));
            return;
          }
          response.on('data', (chunk) => {
            data += chunk;
          });
          response.on('end', () => {
            try {
              const parsedData = JSON.parse(data);
              resolve(parsedData);
            } catch (error) {
              reject(new Error('Respuesta no es un JSON válido'));
            }
          });
        }).on('error', (error) => {
          reject(error);
        });
      });
      const getJson = loadAndNormalizeJson(jsonData);
      if (getJson) {
        return {
          status: true,
          message: 'Json del producto encontrado',
          getJson: getJson
        };
      } else {
        return {
          status: false,
          message: 'Json del producto no encontrado',
          getJson: [{ tipo: '', valor: '' }]
        };
      }
    } catch (error) {
      return {
        status: false,
        message: (error as Error).message,
        getJson: [{ tipo: '', valor: '' }]
      };
    }
  }

  // Set Json
  async writeJson(idProd: string = '') {
    const productId = this.getVariables().productId;
    if (productId === null) {
      return {
        status: false,
        mesage: 'Numero de parte no definido, verificar datos.',
        product: null
      };
    }
    const resultEspec = await this.readJson(productId);
    if (!resultEspec.status) {
      return {
        status: resultEspec.status,
        message: `No se puede actualizar el producto ${productId} (${resultEspec.message})`,
        product: null
      };
    }
    const especificaciones = resultEspec.getJson;
    const filterProd = {
      partnumber: productId
    }
    const resultProd = await this.getByField(this.collection, filterProd);
    if (!resultProd.status) {
      return {
        status: resultProd.status,
        message: `No se puede actualizar el producto ${productId} (${resultProd.message})`,
        product: null
      };
    }
    const product = resultProd.item;
    product.especificaciones = especificaciones;
    return {
      status: true,
      message: `Se han actualizados las especificaciones del producto.`,
      product
    };
  }

  // Buscar imagenes por el partnumber
  async readImages(idProd: string = ''): Promise<{ status: boolean; message: string; getImages: Picture[] }> {
    const productId = idProd === '' ? this.getVariables().productId : idProd;
    const createPicture = (width: string, height: string, url: string) => {
      const picture = new Picture();
      picture.width = width;
      picture.height = height;
      picture.url = url;
      return picture;
    };

    if (!productId) {
      return {
        status: false,
        message: 'Producto no definido, verificar datos.',
        getImages: [createPicture('', '', '')]
      };
    }

    const urlImageSaveBase = `${process.env.UPLOAD_URL}images/`; // Ruta base para guardar imágenes
    const maxImagesToSearch = 6; // Máximo de imágenes a buscar
    const maxConsecutiveMisses = 3; // Máximo de imágenes faltantes consecutivas

    try {
      let pictures: Picture[] = [];
      let sm_pictures: Picture[] = [];
      let consecutiveMisses = 0;
      let foundAtLeastOneImage = false;

      // Función que genera la promesa para verificar la existencia de una imagen
      const checkImage = async (index: number) => {
        // Modificar el URL para que incluya la carpeta basada en el productId (partnumber)
        const urlImage = `${process.env.API_URL}${process.env.UPLOAD_URL}images/${productId}/${productId}_${index}.jpg`;
        const existFile = await checkImageExists(urlImage);
        return { existFile, urlImage, index };
      };

      // Crear las promesas de verificación de todas las imágenes
      const promises = Array.from({ length: maxImagesToSearch + 1 }, (_, index) => checkImage(index));

      // Esperar a que todas las promesas se resuelvan o rechacen
      const results = await Promise.allSettled(promises);

      // Procesar los resultados
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { existFile, urlImage, index } = result.value;

          if (existFile) {
            foundAtLeastOneImage = true;
            consecutiveMisses = 0; // Resetear el contador de imágenes faltantes consecutivas

            // Guardar las imágenes dentro de la carpeta basada en productId
            pictures.push(createPicture('600', '600', path.join(urlImageSaveBase, productId, `${productId}_${index}.jpg`)));
            sm_pictures.push(createPicture('300', '300', path.join(urlImageSaveBase, productId, `${productId}_${index}.jpg`)));

            // logger.info(`Imagen encontrada y guardada: ${urlImage}`);
          } else {
            if (foundAtLeastOneImage) {
              consecutiveMisses++; // Aumentar el contador de imágenes faltantes consecutivas
            }
            // logger.info(`Imagen NO encontrada: ${urlImage}`);
          }

          // Si alcanzamos el máximo de imágenes faltantes consecutivas, detenemos el proceso
          if (consecutiveMisses >= maxConsecutiveMisses) {
            // logger.info(`Deteniendo la búsqueda después de ${consecutiveMisses} imágenes faltantes consecutivas.`);
            break;
          }
        }
      }

      if (pictures.length > 0) {
        return {
          status: true,
          message: 'Imágenes del producto encontradas.',
          getImages: pictures
        };
      } else {
        return {
          status: false,
          message: 'Imágenes del producto no encontradas.',
          getImages: [createPicture('', '', '')]
        };
      }
    } catch (error) {
      return {
        status: false,
        message: (error as Error).message,
        getImages: [createPicture('', '', '')]
      };
    }
  }

}
export default ProductsService;