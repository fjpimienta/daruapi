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
import { Categorys, Picture } from '../models/product.models';
import ExternalBDIService from './externalBDI.service';
import path from 'path';
import logger from '../utils/logger';
import checkImageExists from './checkimage.service';
import fs from 'fs';
import { downloadImage } from './download.service';

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

  async insertMany(context: IContextData) {
    try {
      const products = this.getVariables().products;
      let productsAdd: IProduct[] = [];
      if (!products || products?.length === 0) {
        logger.error(`insertMany->No existen elementos para integrar`);
        return {
          status: false,
          message: 'No existen elementos para integrar',
          products: null
        };
      }
      const id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
      const idProveedor = products![0].suppliersProd.idProveedor;
      if (idProveedor !== 'ingram') {
        const responseBDI = (await new ExternalBDIService({}, {}, context).getProductsBDI());
        if (!responseBDI || !responseBDI.productsBDI || responseBDI.productsBDI.length === 0) {
          const filter = { 'suppliersProd.idProveedor': idProveedor };
          // Recuperar los productos de Ingram dentro de DARU.
          const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
          if (!result || !result.items || result.items.length === 0) {
            let j = id ? parseInt(id) : 1;
            for (const product of products) {
              const productC = await this.categorizarProductos(product, j);
              productsAdd.push(productC);
              j += 1;
            }
          }
          const productsBDILocal = result.items;
          if (productsBDILocal && productsBDILocal.length > 0) {
            // Crear un mapa para buscar productos por número de parte
            const productsBDIMap = new Map<string, any>();
            for (const productBDILocal of productsBDILocal) {
              if (productBDILocal && productBDILocal.partnumber) {
                productsBDIMap.set(productBDILocal.partnumber, productBDILocal);
              } else {
                logger.error(`insertMany->El producto: ${productBDILocal} no se localiza en la Base Local.\n`);
              }
            }
            let i = id ? parseInt(id) : 1;
            for (const product of products) {
              const productBDI = productsBDIMap.get(product.partnumber);
              if (productBDI) {
                // Categorias
                if (!product.category || (product.category.length > 0 && product.category[0].name === '')) {
                  // Categorizar por BDI
                  if (productBDI && productBDI.category) {
                    product.category = [];
                    product.subCategory = [];
                    product.category = productBDI.category
                    product.subCategory = productBDI.subCategory
                  }
                  // TO DO  - Categorizar por ICECAT
                }
                // Imagenes
                if (!product.pictures || (product.pictures.length > 0 && product.pictures[0].url === '')) {
                  const urlImage = product.pictures[0].url;
                  // Imagenes por BDI
                  if (urlImage.startsWith('uploads/images/')) {
                    product.pictures = [];
                    product.sm_pictures = [];
                    product.pictures = productBDI.pictures;
                    product.sm_pictures = productBDI.sm_pictures;
                  }
                  // TO DO  - Imagenes por ICECAT
                }
              }
              const productC = await this.categorizarProductos(product, i);
              productsAdd.push(productC);
              i += 1;
            }
          }
        } else {
          const productsBDI = responseBDI.productsBDI;
          if (productsBDI && productsBDI.length > 0) {
            logger.info(`insertMany/productsBDI.length: ${productsBDI.length} \n`);
            // Crear un mapa para buscar productos por número de parte
            const productsBDIMap = new Map<string, any>();
            for (const productBDI of productsBDI) {
              if (productBDI.products && productBDI.products.vendornumber) {
                productsBDIMap.set(productBDI.products.vendornumber, productBDI);
              } else {
                logger.error(`productBDI.products.vendornumber is undefined: ${productBDI} \n`);
              }
            }
            // if (productsICECAT && productsICECAT.length > 0) {
            //   console.log('productsICECAT.length: ', productsICECAT?.length);
            //   process.env.PRODUCTION === 'true' && logger.info(`insertMany/productsICECAT.length: ${productsICECAT.length} \n`);
            //   // Crear un mapa para buscar productos por número de parte ICECAT
            //   const productsICECATMap = new Map<string, any>();
            //   for (const productICECAT of productsICECAT) {
            //     if (productICECAT.products && productICECAT.products.vendornumber) {
            //       productsICECATMap.set(productICECAT.products.vendornumber, productICECAT);
            //     } else {
            //       console.log('productICECAT.products.vendornumber is undefined: ', productICECAT);
            //       process.env.PRODUCTION === 'true' && logger.info(`productICECAT.products.vendornumber is undefined: ${productICECAT} \n`);
            //     }
            //   }
            // }
            let i = id ? parseInt(id) : 1;
            for (const product of products) {
              // Verificar si el producto viene categorizado
              const productBDI = productsBDIMap.get(product.partnumber);
              if (productBDI) {
                // Categorias
                if (!product.category || (product.category.length > 0 && product.category[0].name === '')) {
                  // Categorizar por BDI
                  if (productBDI.products && productBDI.products.categoriesIdIngram) {
                    product.category = [];
                    product.subCategory = [];
                    const partes: string[] = productBDI.products.categoriesIdIngram.split("->", 2);
                    if (partes && partes.length > 0) {
                      // Categorias
                      if (partes[0].length > 0) {
                        const c = new Categorys();
                        c.name = partes[0];
                        c.slug = slugify(partes[0] || '', { lower: true });
                        product.category.push(c);
                      }
                      // Subcategorias
                      if (partes[1].length > 0) {
                        const c = new Categorys();
                        c.name = partes[1];
                        c.slug = slugify(partes[1] || '', { lower: true });
                        product.subCategory.push(c);
                      }
                    }
                  }
                  // TO DO  - Categorizar por ICECAT
                }
                // Imagenes
                if (!product.pictures || (product.pictures.length > 0 && product.pictures[0].url === '')) {
                  // Imagenes por BDI
                  if (productBDI.products.images) {
                    const urlsDeImagenes: string[] = productBDI.products.images.split(',');
                    if (urlsDeImagenes.length > 0) {
                      // Imagenes
                      product.pictures = [];
                      for (const urlImage of urlsDeImagenes) {
                        const i = new Picture();
                        i.width = '600';
                        i.height = '600';
                        i.url = urlImage;
                        product.pictures.push(i);
                        // Imagenes pequeñas
                        product.sm_pictures = [];
                        const is = new Picture();
                        is.width = '300';
                        is.height = '300';
                        is.url = urlImage;
                        product.sm_pictures.push(i);
                      }
                    }
                  }
                  // TO DO  - Imagenes por ICECAT
                }
              }
              const productC = await this.categorizarProductos(product, i);
              productsAdd.push(productC);
              i += 1;
            }
          }
        }
      } else {
        let i = id ? parseInt(id) : 1;
        for (const product of products) {
          const productC = await this.categorizarProductos(product, i);
          productsAdd.push(productC);
          i += 1;
        }
      }
      // Guardar los elementos nuevos
      if (productsAdd.length > 0) {
        let filter: object = { 'suppliersProd.idProveedor': idProveedor };
        const delResult = await this.delList(this.collection, filter, 'producto');
        if (delResult) {
          const result = await this.addList(this.collection, productsAdd || [], 'products');
          return {
            status: result.status,
            message: result.message,
            products: []
          };
        }
        logger.error(`insertMany->Hubo un error al generar los productos. No se pudieron eliminar previamente.`);
        return {
          status: false,
          message: 'Hubo un error al generar los productos. No se pudieron eliminar previamente.',
          products: []
        };
      }
    } catch (error) {
      logger.error(`insertMany->Hubo un error al generar los productos. ${error}`);
      return {
        status: false,
        message: error,
        products: []
      };
    }
  }

  // Guardar Imagenes
  async saveImages(context: IContextData) {
    try {
      let productsAdd: IProduct[] = [];
      let productsPictures: IProduct[] = [];
      let productsWithoutPictures: IProduct[] = [];
      const supplierId = this.getVariables().supplierId;
      const dafaultImage = 'logo-icon.png';
      const uploadFolder = './uploads/images/';
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
              $regex: '^uploads/images'
            }
          }
        };
      }
      logger.info(`saveImages->productos de ${supplierId} \n`);
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
      console.log(`saveImages->productos de ${supplierId}: ${products.length} \n`);
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
            // console.log(`producto: ${product.partnumber}; imagen a buscar: ${urlImage}`);
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
            console.log(`  :::::  producto: ${product.partnumber}; imagenes guardadas: ${product.pictures.length}`);
            const updateImage = await this.modifyImages(product);
            if (!updateImage.status) {
              logger.error(`saveImages->No se pudo reiniciar las imagenes de ${product.partnumber} por ${path.join(urlImageSave, dafaultImage)}.\n`);
            }
            productsPictures.push(product);
          }
        }
      }
      console.log('productsPictures.length:', productsPictures.length);
      products = productsPictures;
      // return {
      //   status: true,
      //   message: 'Se realizo con exito la identificacion de imagenes.',
      //   products: productsPictures
      // };
      // Proveedor principal Ingram.
      let savePictures = false;
      if (idProveedor === 'ingram') {
        const resultBDI = await new ExternalBDIService({}, {}, context).getProductsBDI();
        if (!resultBDI || !resultBDI.productsBDI) {
          logger.error(`saveImages->resultBDI: Error en la recuperacion de los productos de ${idProveedor}\n`);
          return {
            status: false,
            message: `Error en la recuperacion de los productos de ${idProveedor}\n`,
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
        logger.info(`saveImages->products ingram: ${productsBDI.length}.\n`);
        // Crear un mapa para buscar productos por número de parte
        for (const productBDI of productsBDI) {
          if (productBDI.products && productBDI.products.vendornumber) {
            productsBDIMap.set(productBDI.products.vendornumber, productBDI);
          } else {
            logger.error(`saveImages->Producto ${productBDI.products.vendornumber} no localizado.\n`);
          }
        }
        // Recuperar de todos los productos guardados las imagenes.
        for (let j = 0; j < products.length; j++) {
          savePictures = false;
          let product = products[j];
          const productIngram = productsBDIMap.get(product.partnumber);
          if (productIngram) {
            if (productIngram.products && productIngram.products.images !== '') {
              let imageUrls = productIngram.products.images.split(',');
              product.pictures = [];
              product.sm_pictures = [];
              for (let i = 0; i < imageUrls.length; i++) {
                let urlImage = imageUrls[i].trim();
                try {
                  const partnumber = product.partnumber;
                  const sanitizedPartnumber = this.sanitizePartnumber(partnumber);
                  let fileNameLocal = this.generateFilename(sanitizedPartnumber, i);
                  let existFile = await checkImageExists(urlImage);
                  if (existFile) {
                    let filePath = path.join(uploadFolder, fileNameLocal);
                    if (fs.existsSync(filePath)) {
                      await fs.promises.unlink(filePath);
                    }
                    await downloadImage(urlImage, uploadFolder, fileNameLocal);
                    product.pictures.push(createPicture('600', '600', path.join(urlImageSave, fileNameLocal)));
                    product.sm_pictures.push(createPicture('300', '300', path.join(urlImageSave, fileNameLocal)));
                    savePictures = true;
                  }
                  // }
                } catch (error) {
                  process.env.PRODUCTION === 'true' && logger.error(`saveImages->Error downloading image from ${urlImage}: ${error}`);
                }
              }
              if (savePictures) {
                const updateImage = await this.modifyImages(product);
                if (updateImage.status) {
                  logger.info(`saveImages->producto actualizado: ${product.partnumber}; imagenes guardadas: ${product.pictures.length}`);
                } else {
                  logger.error(`saveImages->No se pudo reiniciar las imagenes de ${product.partnumber} por ${path.join(urlImageSave, dafaultImage)}.\n`);
                }
              }
            }
          } else {
            logger.error(`saveImages->No existen imagenes del producto ${product.partnumber} en Ingram.\n`);
          }
          productsAdd.push(product);
        }
      }
      // Proveedores que no tienen imagenes
      if (idProveedor === 'daisytek' || idProveedor === 'ct' || idProveedor === 'cva' || idProveedor === 'syscom') {
        const productsBDI = (await this.listAll(this.collection, this.catalogName, 1, -1, { 'suppliersProd.idProveedor': { $ne: 'ingram' } })).items;
        console.log(`insertMany/productsBDI.length: ${productsBDI.length} \n`);
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
        for (let j = 0; j < products.length; j++) {
          let product = products[j];
          for (let i = 0; i < product.pictures.length; i++) {
            let image = product.pictures[i];
            let urlImage = image.url;
            logger.info(`saveImages->producto: ${product.partnumber}; urlImage ${i}: ${urlImage}.\n`);
            // if (!urlImage.startsWith('uploads/images/' && product.partnumber)) {
            try {
              let fileNameLocal = `${product.partnumber}_${i}`;
              // let urlImageDaru = `${process.env.API_URL}${process.env.UPLOAD_URL}images/${fileNameLocal}`;
              // let existFileLocal = await checkImageExists(urlImageDaru);
              // if (existFileLocal) {
              //   image.url = path.join(urlImageSave, fileNameLocal);
              // } else {
              // Si no existe el archivo localmente entonces busca las imagenes del producto
              // let existFile = await checkImageExists(urlImage);
              // if (existFile) {
              let filename = this.generateFilename(product.partnumber, i);
              let filePath = path.join(uploadFolder, filename);
              if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
              }
              await downloadImage(urlImage, uploadFolder, fileNameLocal);
              image.url = path.join(urlImageSave, fileNameLocal);
              // }
              // }
            } catch (error) {
              logger.error(`saveImages->No se encontro la imagen ${urlImage} del producto ${product.partnumber}:: ${error}.\n`);
              image.url = path.join(urlImageSave, dafaultImage);
            }
            // } else {
            //   let urlImageDaru = `${process.env.API_URL}${urlImage}`;
            //   let existFile = await checkImageExists(urlImageDaru);
            //   if (!existFile) {
            //     logger.error(`saveImages->No se encontro la imagen ${urlImageDaru} del producto ${product.partnumber}.\n`);
            //     // TO DO - Recuperar Imagen de otro proveedor.
            //   }
            // }
          }
          product.sm_pictures = product.pictures;
          productsAdd.push(product);
        }
      }
      console.log(`saveImages->productsAdd.length: ${productsAdd?.length} \n`);
      logger.info(`saveImages->productsAdd.length: ${productsAdd?.length} \n`);
      return {
        status: true,
        message: 'Se realizo con exito la subida de imagenes.',
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

  // Función para reemplazar caracteres no permitidos en los nombres de archivo
  sanitizePartnumber(partnumber: string): string {
    return partnumber.replace(/[\/ ]/g, '_');
  }

  generateFilename(partNumber: string, index: number): string {
    return `${partNumber}_${index}.jpg`;
  }

  async categorizarProductos(product: IProduct, i: number) {
    // Clasificar Categorias y Subcategorias
    if (product.subCategory && product.subCategory.length > 0) {
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
      product.registerDate = new Date().toISOString();
    }
    return await product;
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