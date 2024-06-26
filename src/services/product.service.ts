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

  // Añadir una lista
  async insertMany_X(context: IContextData) {
    try {
      const uploadFolder = './uploads/images/';
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
      console.log('products.length: ', products?.length);
      const productsBDI = (await new ExternalBDIService({}, {}, context).getProductsBDI()).productsBDI;
      if (productsBDI) {
        // Crear un mapa para buscar productos por número de parte
        const productsBDIMap = new Map<string, any>();
        for (const productBDI of productsBDI) {
          productsBDIMap.set(productBDI.sku, productBDI);
        }
        console.log('productsBDI.length: ', productsBDI?.length);
        let i = id ? parseInt(id) : 1;
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
          // Recuperar imagenes de icecat todos los proveedores
          // Busca las imagenes en BDI
          if (idProveedor !== 'ingram') {
            if (productsBDI && productsBDI.length > 0) {
              const productBDI = productsBDIMap.get(product.partnumber);
              console.log('productBDI:', productBDI);
              if (productBDI) {

                // for (const productBDI of productsBDI) {
                console.log(`productBDI.sku: ${productBDI.sku} - product.partnumber: ${product.partnumber}`);
                // if (productBDI.sku === product.partnumber) {
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
                // }
              }
            }
          }
          // Busca las imagenes en Icecat Local
          const variableLocal = {
            brandIcecat: product.brands[0].slug,
            productIcecat: product.partnumber
          }
          if (product.pictures && product.pictures.length <= 0) {
            console.log(`product.partnumber: ${product.partnumber} - product.pictures.length: ${product.pictures.length}`);
            const icecatExt = await new ExternalIcecatsService({}, variableLocal, context).getIcecatProductLocal();
            if (icecatExt.status) {
              if (icecatExt.icecatProductLocal) {
                if (icecatExt.icecatProductLocal.LowPic !== '' &&
                  icecatExt.icecatProductLocal.ProductGallery && icecatExt.icecatProductLocal.ProductGallery.includes('|')
                ) {
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
                product.partnumber = icecatExt.icecatProductLocal.Requested_prod_id;
                product.upc = icecatExt.icecatProductLocal.Requested_GTIN_EAN_UPC;
                product.model = icecatExt.icecatProductLocal.model;
                product.name = icecatExt.icecatProductLocal.ProductTitle;
                product.slug = slugify(icecatExt.icecatProductLocal.ProductTitle, { lower: true });
                product.short_desc = icecatExt.icecatProductLocal.ShortSummaryDescription;

                product.category = [];
                const c = new Categorys();
                c.name = icecatExt.icecatProductLocal.Category;
                c.slug = slugify(icecatExt.icecatProductLocal.Category, { lower: true });
                product.category.push(c);
              }
            } else {                  // Si no hay imagenes en icecat local buscan en los otros proveedores las imagenes.
              const variableLoc = {
                partNumber: product.partnumber
              }
              const productLocal = await new ProductsService({}, variableLoc, context).getProductField();
              console.log('productLocal: ', productLocal);
              if (productLocal.productField && productLocal.productField.category) {
                product.category = productLocal.productField.category
              }
              if (productLocal.productField && productLocal.productField.subCategory) {
                product.subCategory = productLocal.productField.subCategory
              }
              if (productLocal.productField && productLocal.productField.brand) {
                product.brand = productLocal.productField.brand
              }
              if (productLocal.productField && productLocal.productField.brands) {
                product.brands = productLocal.productField.brands
              }
              if (productLocal.productField && productLocal.productField.pictures && productLocal.productField.pictures.length > 0) {
                product.pictures = [];
                product.sm_pictures = [];
                for (const pictureI of productLocal.productField.pictures) {
                  if (pictureI.url !== '') {
                    const pict: IPicture = {
                      width: pictureI.width,
                      height: pictureI.height,
                      url: pictureI.url
                    };
                    product.pictures.push(pict);
                  }
                }
                for (const pictureIsm of productLocal.productField.sm_pictures) {
                  if (pictureIsm.url !== '') {
                    const pict: IPicture = {
                      width: pictureIsm.width,
                      height: pictureIsm.height,
                      url: pictureIsm.url
                    };
                    product.sm_pictures.push(pict);
                  }
                }
              } else {
                product.pictures = [];
                product.sm_pictures = [];
                const pict: IPicture = {
                  width: "500",
                  height: "500",
                  url: "https://daru.mx/files/logo.png"
                };
                product.pictures.push(pict);
                const pictSm: IPicture = {
                  width: "250",
                  height: "250",
                  url: "https://daru.mx/files/logo.png"
                };
                product.sm_pictures.push(pictSm);
              }
            }
          }
          i += 1;
          console.log(`product.partnumber: ${product.partnumber} - product.pictures.length: ${product.pictures.length}`);
          // Guardar Imagenes
          for (const image of product.pictures) {
            const urlImage = image.url;
            try {
              console.log('urlImage: ', urlImage);
              const filename = await downloadImage(urlImage, uploadFolder, 'No existia');
              console.log('filename: ', filename);
              image.url = path.join(uploadFolder, filename);
            } catch (error) {
              image.url = "";
            }
          }
          for (const simage of product.sm_pictures) {
            const urlImage = simage.url;
            try {
              console.log('urlImage: ', urlImage);
              const filename = await downloadImage(urlImage, uploadFolder, 'No existia');
              console.log('filename: ', filename);
              simage.url = path.join(uploadFolder, filename);
            } catch (error) {
              simage.url = "";
            }
          }
          productsAdd.push(product);
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
    } catch (error) {
      // console.log('error: ', error);
      return {
        status: false,
        message: error,
        products: []
      };
    }
  }

  async insertMany(context: IContextData) {
    try {
      const products = this.getVariables().products;
      let productsAdd: IProduct[] = [];
      if (!products) {
        process.env.PRODUCTION === 'true' && logger.info(`insertMany->No existen elementos para integrar`);
        return {
          status: false,
          message: 'No existen elementos para integrar',
          products: null
        };
      }
      if (products?.length === 0) {
        return {
          status: false,
          message: 'No existen elementos para integrar',
          products: null
        };
      }
      const id = await asignDocumentId(this.getDB(), this.collection, { registerDate: -1 });
      console.log('products.length: ', products.length);
      process.env.PRODUCTION === 'true' && logger.info(`insertMany/products.length: ${products.length} \n`);
      const idProveedor = products![0].suppliersProd.idProveedor;
      if (idProveedor !== 'ingram') {
        const productsBDI = (await new ExternalBDIService({}, {}, context).getProductsBDI()).productsBDI;
        // const productsICECAT = (await new ExternalIcecatsService({}, {}, context).getIcecatProductLocal()).icecatProductLocal;
        if (productsBDI && productsBDI.length > 0) {
          console.log('productsBDI.length: ', productsBDI?.length);
          process.env.PRODUCTION === 'true' && logger.info(`insertMany/productsBDI.length: ${productsBDI.length} \n`);
          // Crear un mapa para buscar productos por número de parte
          const productsBDIMap = new Map<string, any>();
          for (const productBDI of productsBDI) {
            if (productBDI.products && productBDI.products.vendornumber) {
              productsBDIMap.set(productBDI.products.vendornumber, productBDI);
            } else {
              console.log('productBDI.products.vendornumber is undefined: ', productBDI);
              process.env.PRODUCTION === 'true' && logger.info(`productBDI.products.vendornumber is undefined: ${productBDI} \n`);
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
              console.log('product.partnumber: ', product.partnumber);
              // console.log('productBDI: ', productBDI); // Imprimir el resultado de la búsqueda
              // Categorias
              if (!product.category || (product.category.length > 0 && product.category[0].name === '')) {
                // Categorizar por BDI
                if (productBDI.products && productBDI.products.categoriesIdIngram) {
                  // console.log('product.category: ', product.category);
                  // console.log('productBDI.products.categoriesIdIngram: ', productBDI.products.categoriesIdIngram);
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
                  console.log('product.category: ', product.category);
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
        process.env.PRODUCTION === 'true' && logger.info(`insertMany/products: ${JSON.stringify(products[0])} \n`);
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
        return {
          status: false,
          message: 'Hubo un error al generar los productos. No se pudieron eliminar previamente.',
          products: []
        };
      }
    } catch (error) {
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
      const uploadFolder = './uploads/images/';
      const supplierId = this.getVariables().supplierId;
      let filter: object = {};
      if (supplierId) {
        filter = { 'suppliersProd.idProveedor': supplierId };
      }
      // Recuperar los productos de un proveedor
      const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
      if (!result || !result.items || result.items.length === 0) {
        process.env.PRODUCTION === 'true' && logger.info(`insertMany->No existen elementos para integrar`);
        return {
          status: false,
          message: 'No existen elementos para recuperar las imagenes',
          products: []
        };
      }
      const products = result.items as IProduct[];
      const idProveedor = supplierId;
      // Proveedores que no tienen imagenes
      if (idProveedor === 'daisytek' || idProveedor === 'ct' || idProveedor === 'cva') {
        const productsBDI = (await this.listAll(this.collection, this.catalogName, 1, -1, { 'suppliersProd.idProveedor': { $ne: 'ingram' } })).items;
        console.log('productsBDI.length: ', productsBDI.length);
        process.env.PRODUCTION === 'true' && logger.info(`insertMany/productsBDI.length: ${productsBDI.length} \n`);
        if (productsBDI && productsBDI.length > 0) {
          // Crear un mapa para buscar productos por número de parte
          const productsBDIMap = new Map<string, any>();
          for (const productBDI of productsBDI) {
            if (productBDI.products && productBDI.products.vendornumber) {
              productsBDIMap.set(productBDI.products.vendornumber, productBDI);
            }
          }
          // Procesa la carga de imagenes.
          console.log('products.length: ', products.length);
          process.env.PRODUCTION === 'true' && logger.info(`insertMany/products.length: ${products?.length} \n`);
          for (const product of products) {
            if (product.pictures && product.pictures.length > 0) {
              for (const image of product.pictures) {
                const urlImage = image.url;
                // Verificar si la URL de la imagen comienza con "uploads/images/"
                if (urlImage.startsWith('uploads/images/')) {
                  try {
                    const urlImageDaru = `${process.env.API_URL}${process.env.UPLOAD_URL}images/${urlImage}`;
                    const existFile = await checkImageExists(urlImageDaru);
                    if (!existFile) {
                      const productBDI = productsBDIMap.get(product.partnumber);
                      if (productBDI) {
                        product.pictures = productBDI.pictures;
                        product.sm_pictures = productBDI.sm_pictures;
                      }
                    }
                  } catch (error) {
                    console.error(`Error downloading image from ${urlImage}:`, error);
                    image.url = "";
                  }
                }
              }
            } else {
              const productBDI = productsBDIMap.get(product.partnumber);
              if (productBDI) {
                product.pictures = productBDI.pictures;
                product.sm_pictures = productBDI.sm_pictures;
              }
            }
          }
        }
      }
      // Proveedores que si tienen imagenes
      if (idProveedor === 'ingram' || idProveedor === 'syscom') {
        for (const product of products) {
          // Guardar Imagenes
          let imageIndex = 1;
          for (const image of product.pictures) {
            const urlImage = image.url;
            // Verificar si la URL de la imagen comienza con "uploads/images/"
            if (!urlImage.startsWith('uploads/images/')) {
              try {
                const segments = urlImage.split('/');
                const fileNameLocal = segments[segments.length - 1];
                const urlImageDaru = `${process.env.API_URL}${process.env.UPLOAD_URL}images/${fileNameLocal}`;
                const existFileLocal = await checkImageExists(urlImageDaru);
                if (!existFileLocal) {
                  const existFile = await checkImageExists(urlImage);
                  if (existFile) {
                    const filename = this.generateFilename(product.partnumber, imageIndex);
                    const filePath = path.join(uploadFolder, filename);
                    if (fs.existsSync(filePath)) {
                      await fs.promises.unlink(filePath);
                    }
                    imageIndex++;
                  } else {
                    image.url = "";
                  }
                  await downloadImage(urlImage, uploadFolder, fileNameLocal);
                }
                const urlImageSave = `${process.env.UPLOAD_URL}images/`;
                image.url = path.join(urlImageSave, fileNameLocal);
              } catch (error) {
                console.error(`Error downloading image from ${urlImage}:`, error);
                image.url = "";
              }
            } else {
              const urlImageDaru = `${process.env.UPLOAD_URL}images/${urlImage}`;
              const existFile = await checkImageExists(urlImageDaru);
              if (!existFile) {
                image.url = "";
              }
            }
          }
          product.sm_pictures = product.pictures;
          productsAdd.push(product);
        }
      }
      // Guardar los elementos nuevos
      console.log('productsAdd.length: ', productsAdd.length);
      process.env.PRODUCTION === 'true' && logger.info(`insertMany/productsAdd.length: ${productsAdd?.length} \n`);
      if (productsAdd.length > 0) {
        let filter: object = { 'suppliersProd.idProveedor': idProveedor };
        const delResult = await this.delList(this.collection, filter, 'producto');
        if (delResult) {
          const result = await this.addList(this.collection, productsAdd || [], 'products');
          return {
            status: result.status,
            message: result.message,
            products
          };
        }
        return {
          status: false,
          message: 'Hubo un error al generar los productos. No se pudieron eliminar previamente.',
          products: []
        };
      }
      return {
        status: false,
        message: 'No hubo productos para agregar imagenes.',
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