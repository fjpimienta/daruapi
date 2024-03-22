import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import logger from '../utils/logger';
import fetch from 'node-fetch';
import { IAvailabilityByWarehouse, IIngramProduct, IPricesIngram, IProductsQuery } from '../interfaces/suppliers/_Ingram.interface';
import { COLLECTIONS } from '../config/constants';
import { IBranchOffices } from '../interfaces/product.interface';
import { BranchOffices, Brands, Categorys, Descuentos, Picture, Product, Promociones, SupplierProd, UnidadDeMedida } from '../models/product.models';
import { Db } from 'mongodb';
import ConfigsService from './config.service';
import slugify from 'slugify';

class ExternalIngramService extends ResolversOperationsService {
  collection = COLLECTIONS.INGRAM_PRODUCTS;
  catalogName = 'Productos Ingram';
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

  async getTokenIngram() {
    const username = 'ZpGbzheF2yQlsfA00vuvu4JdXkf76w9L';
    const password = 'WOPaXqEcyG3kQGJw';

    const data = `${username}:${password}`;
    const base64String = Buffer.from(data).toString('base64');

    const encodedCredentials = base64String;
    const optionsIngram = {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      }).toString(),
      redirect: 'manual' as RequestRedirect
    };

    const tokenIngram = await fetch('https://api.ingrammicro.com:443/oauth/oauth30/token', optionsIngram)
      .then(response => response.json())
      .then(async response => {
        return await response;
      })
      .catch(err => console.error(err));

    const status = tokenIngram.access_token !== '' ? true : false;
    const message = tokenIngram.access_token !== '' ? 'El token se ha generado correctamente. data:' : 'Error en el servicio. ' + JSON.stringify(data);

    return {
      status,
      message,
      tokenIngram
    };
  }

  async getIngramProduct(variables: IVariables) {
    try {
      let { ingramPartNumber } = variables;

      if (ingramPartNumber === undefined) {
        const result = await this.getByField(this.collection);
        ingramPartNumber = result.item.imSKU.trim();
      }

      if (!ingramPartNumber) {
        return {
          status: false,
          message: `No existe el producto ${ingramPartNumber}`,
          ingramProduct: null,
        };
      }
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/catalog/details';
      const optionsIngram = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token
        },
      };
      const url = `${apiUrl}/${ingramPartNumber}`;
      const response = await fetch(url, optionsIngram);
      const responseJson = await response.json();
      if (response.statusText === 'OK') {
        return {
          status: true,
          message: `El producto ${ingramPartNumber} se ha encontrado.`,
          ingramProduct: responseJson,
        };
      } else {
        return {
          status: false,
          message: `No existe el producto ${ingramPartNumber}`,
          ingramProduct: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        ingramProduct: null,
      };
    }
  }

  async getListProductsIngram(): Promise<{
    status: boolean;
    message: string;
    listProductsIngram: Product[] | [];
  }> {
    const db = this.db;
    const allRecords = { allRecords: true };
    const productos: Product[] = [];
    const config = await new ConfigsService({}, { id: '1' }, { db }).details();
    const stockMinimo = config.config.minimum_offer;
    const exchangeRate = config.config.exchange_rate;
    // const productosIngram = await (await this.getPricesIngram(allRecords)).pricesIngram;
    // const productosIngram = await (await this.getPricesIngram(allRecords)).pricesIngram;

    const catalogIngrams = await (await this.getCatalogIngrams()).ingramProduct;
    // console.log('catalogIngrams: ', catalogIngrams?.length);
    const productosIngram = await (await this.getPricesIngrams(catalogIngrams)).pricesIngram;
    // console.log('productosIngram: ', productosIngram?.length);
    if (productosIngram && productosIngram.length <= 0) {
      return await {
        status: false,
        message: 'No se han encontrado los precios de los productos.',
        listProductsIngram: []
      }
    }
    if (catalogIngrams && catalogIngrams.length <= 0) {
      return await {
        status: false,
        message: 'No se han encontrado los productos del proveedor en nuestra base de datos.',
        listProductsIngram: []
      }
    }
    if (productosIngram) {
      // console.log('productosIngram[0]: ', productosIngram[0]);
      // console.log('catalogIngrams[0]: ', catalogIngrams[0]);
      // console.log('productosIngram[1]: ', productosIngram[1]);
      // console.log('catalogIngrams[1]: ', catalogIngrams[1]);
      // console.log('productosIngram[1]: ', productosIngram[2]);
      // console.log('catalogIngrams[2]: ', catalogIngrams[2]);
      for (const prodIngram of productosIngram) {
        const { availability } = prodIngram;
        if (availability && availability.availabilityByWarehouse) {
          const warehouses: IAvailabilityByWarehouse[] = [];
          for (const almacen of availability.availabilityByWarehouse) {
            if (almacen.quantityAvailable >= stockMinimo) {
              warehouses.push({
                warehouseId: almacen.warehouseId,
                location: almacen.location,
                quantityAvailable: almacen.quantityAvailable,
                quantityBackordered: almacen.quantityBackordered,
                backOrderInfo: almacen.backOrderInfo as { quantity: number; etaDate: string } | undefined
              });
            }
          }
          if (warehouses.length > 0) {
            if (availability.availabilityByWarehouse.length !== warehouses.length) {
              prodIngram.availability.availabilityByWarehouse = warehouses.map(warehouse => ({
                warehouseId: warehouse.warehouseId,
                location: warehouse.location,
                quantityAvailable: warehouse.quantityAvailable,
                quantityBackordered: warehouse.quantityBackordered,
                backOrderInfo: Array.isArray(warehouse.backOrderInfo) ? warehouse.backOrderInfo : []
              }));
              const catalogIngram = catalogIngrams.find(cat => cat.imSKU.trim() === prodIngram.ingramPartNumber.trim());
              if (catalogIngram && availability.availabilityByWarehouse && availability.availabilityByWarehouse.length > 0) {
                const itemData: Product = await this.setProduct('ingram', prodIngram, catalogIngram, null, stockMinimo, exchangeRate);
                if (itemData.id !== undefined && itemData.partnumber !== '') {
                  productos.push(itemData);
                }
              }
            }
          }
        }
      }
    }
    return await {
      status: true,
      message: 'Productos listos para agregar.',
      listProductsIngram: productos
    }
  }

  async setProduct(proveedor: string, item: any, productJson: any = null, imagenes: any = null, stockMinimo: number, exchangeRate: number) {
    const utilidad: number = 1.08;
    const iva: number = 1.16;
    const itemData = new Product();
    const unidad = new UnidadDeMedida();
    const b = new Brands();
    const c = new Categorys();
    const s = new SupplierProd();
    const bo = new BranchOffices();
    const i = new Picture();
    const is = new Picture();
    const desc = new Descuentos();
    const promo = new Promociones();
    let disponible = 0;
    let price = 0;
    let salePrice = 0;

    try {
      disponible = 0;
      salePrice = 0;
      itemData.id = undefined;
      if (item.availability && item.availability.availabilityByWarehouse && item.availability.availabilityByWarehouse.length > 0) {
        const branchOfficesIngram: BranchOffices[] = [];
        let featured = false;
        for (const element of item.availability.availabilityByWarehouse) {
          const almacen = this.getAlmacenIngram(element);
          if (almacen.cantidad >= stockMinimo) {
            disponible += almacen.cantidad;
            branchOfficesIngram.push(almacen);
          }
        }
        if (branchOfficesIngram.length > 0) {
          // TO-DO Promociones
          price = 0;
          salePrice = 0;
          itemData.id = item.vendorPartNumber.trim();
          itemData.name = productJson.descriptionLine1.trim();
          itemData.slug = slugify(productJson.descriptionLine1.trim(), { lower: true });
          itemData.short_desc = productJson.descriptionLine1.trim() + '. ' + productJson.descriptionLine2.trim();
          if (item.discounts && item.discounts.length > 0 && item.discounts[0].specialPricing
            && item.discounts[0].specialPricing.length > 0 && item.discounts[0].specialPricing[0].specialPricingAvailableQuantity > 0) {
            const specialPricingDiscount = item.discounts[0].specialPricing[0].specialPricingDiscount;
            salePrice = item.pricing.customerPrice - specialPricingDiscount;
          }
          if (item.pricing.customerPrice > 0) {
            price = item.pricing.customerPrice;           // Vienen dos precios customerPrice y retailPrice
            if (item.pricing.currencyCode === 'USD') {
              itemData.price = parseFloat((price * exchangeRate * utilidad * iva).toFixed(2));
              itemData.sale_price = parseFloat((salePrice * exchangeRate * utilidad * iva).toFixed(2));
            } else {
              itemData.price = parseFloat((price * utilidad * iva).toFixed(2));
              itemData.sale_price = parseFloat((salePrice * utilidad * iva).toFixed(2));
            }
          } else {
            itemData.price = price;
            itemData.sale_price = salePrice;
          }
          itemData.exchangeRate = exchangeRate;
          itemData.review = 0;
          itemData.ratings = 0;
          itemData.until = this.getFechas(new Date());
          itemData.top = false;
          itemData.featured = featured;
          itemData.new = false;
          itemData.sold = '';
          itemData.stock = disponible;
          itemData.sku = item.vendorNumber.trim();
          itemData.upc = item.upc;
          itemData.partnumber = item.vendorPartNumber.trim();
          unidad.id = 'PZ';
          unidad.name = 'Pieza';
          unidad.slug = 'pieza';
          itemData.unidadDeMedida = unidad;
          // Categorias
          itemData.category = [];
          if (item.category) {
            const c = new Categorys();
            c.name = item.category;
            c.slug = slugify(item.category, { lower: true });
            itemData.category.push(c);
          } else {
            const c = new Categorys();
            c.name = '';
            c.slug = '';
            itemData.category.push(c);
          }
          // SubCategorias
          itemData.subCategory = [];
          if (item.subCategory) {
            const c1 = new Categorys();
            c1.name = item.subCategory;
            c1.slug = slugify(item.subCategory, { lower: true });
            itemData.subCategory.push(c1);
          } else {
            const c1 = new Categorys();
            c1.name = '';
            c1.slug = '';
            itemData.subCategory.push(c1);
          }
          // Marcas
          if (item.vendorName) {
            itemData.brand = item.vendorName.replace(/[^\w\s]/gi, '').toLowerCase();
            itemData.brands = [];
            b.name = item.vendorName.replace(/[^\w\s]/gi, '');
            b.slug = slugify(b.name, { lower: true });
            itemData.brands.push(b);
          } else {
            itemData.brand = 'SM';
            itemData.brands = [];
            b.name = 'SM';
            b.slug = slugify(b.name, { lower: true });
            itemData.brands.push(b);
          }
          s.idProveedor = proveedor;
          s.codigo = productJson.imSKU.trim();
          s.cantidad = stockMinimo;
          s.price = price;
          s.sale_price = salePrice;
          s.moneda = item.pricing.currencyCode === 'MXP' ? 'MXN' : 'USD';
          // TO-DO Promociones
          s.moneda = item.pricing.currencyCode;
          s.branchOffices = branchOfficesIngram;
          s.category = new Categorys();
          s.subCategory = new Categorys();
          if (item.category) {
            s.category.slug = slugify(item.category, { lower: true });;
            s.category.name = item.category;
          }
          if (item.subCategory) {
            s.subCategory.slug = slugify(item.subCategory, { lower: true });;
            s.subCategory.name = item.subCategory;
          }
          itemData.suppliersProd = s;
          itemData.variants = [];
          itemData.especificaciones = [];
          itemData.especificaciones.push({ tipo: 'Longitud', valor: productJson.length });
          itemData.especificaciones.push({ tipo: 'Ancho', valor: productJson.width });
          itemData.especificaciones.push({ tipo: 'Altura', valor: productJson.height });
        }
      }
      return itemData;
    } catch (error) {
      return itemData;
    }

  }

  getAlmacenIngram(branch: any): BranchOffices {
    const almacen = new BranchOffices();
    almacen.id = branch.warehouseId.toString();
    almacen.name = branch.location;
    const parts = branch.location.split('-');
    if (parts.length > 1) {
      almacen.estado = branch.Estado;
    } else {
      almacen.estado = branch.Estado;
    }
    almacen.cp = '';
    almacen.latitud = '';
    almacen.longitud = '';
    almacen.cantidad = branch.quantityAvailable;
    return almacen;
  }

  getFechas(fecha: Date) {
    let dtS = '';
    let monthS = '';
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1);
    const dt = fecha.getDate();
    dtS = dt < 10 ? '0' + dt : dt.toString();
    monthS = month < 10 ? '0' + month : month.toString();
    return year + '-' + monthS + '-' + dtS;
  }

  async getIngramProducts() {
    try {
      // Get todos los productos.
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/catalog';
      const optionsIngram = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token
        },
      };
      const url = `${apiUrl}/?pageNumber=1&pageSize=10000&type=IM::any`;
      const response = await fetch(url, optionsIngram);
      const responseJson = await response.json();
      if (response.statusText === 'OK' && responseJson.catalog.length > 0) {
        return await {
          status: true,
          message: `Se ha generado la lista de productos.`,
          ingramProducts: responseJson.catalog,
        };
      } else {
        return await {
          status: false,
          message: `No se ha generado la lista de productos.`,
          ingramProducts: [],
        };
      }
    } catch (error: any) {
      return await {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        ingramProducts: [],
      };
    }
  }

  async getPricesIngrams(catalog: any[]) {
    try {
      // Get todos los productos.
      const productosIngram = catalog;
      if (productosIngram && productosIngram.length > 0) {
        // Generar bloques de 50 productos.
        let i = 0;
        let partsNumber: IProductsQuery[] = [];
        const pricesIngram: IPricesIngram[] = [];
        const vendedoresExcluidos = ["APPLE ACCS RETAIL", "APPLE IPAD RETAIL"];
        for (const prod of productosIngram) {
          if (!vendedoresExcluidos.includes(prod.vendorName.toUpperCase())) {
            i += 1;
            partsNumber.push({ ingramPartNumber: prod.imSKU });
            if (i % 50 === 0) {
              // console.log('partsNumber: ', partsNumber);
              const productPrices = await this.getPricesIngramBloque(partsNumber)
              // console.log('productPrices.pricesIngram.length: ', productPrices.pricesIngram.length);
              // console.log('productPrices.pricesIngram[0]: ', productPrices.pricesIngram[0]);
              if (productPrices && productPrices.pricesIngram && productPrices.pricesIngram.length > 0) {
                for (const prodPrices of productPrices.pricesIngram) {
                  pricesIngram.push(prodPrices);
                }
              }
              partsNumber = [];
            }
          }
        }
        // Verificar si quedan productos pendientes.
        if (partsNumber.length > 0) {
          const productPrices = await this.getPricesIngramBloque(partsNumber);
          if (productPrices && productPrices.pricesIngram && productPrices.pricesIngram.length > 0) {
            for (const prodPrices of productPrices.pricesIngram) {
              // console.log('productPrices.pricesIngram[0]: ', productPrices.pricesIngram[0]);
              // console.log('productPrices.pricesIngram[1]: ', productPrices.pricesIngram[1]);
              // console.log('productPrices.pricesIngram[2]: ', productPrices.pricesIngram[2]);
              if (prodPrices.availability) {
                pricesIngram.push(prodPrices);
              }
            }
          }
        }
        if (pricesIngram.length > 0) {
          // Agregar categorias y subcategorias
          for (const priceItem of pricesIngram) {
            const item = productosIngram.find((x: IIngramProduct) => x.vendorPartNumber === priceItem.vendorPartNumber);
            if (item) {
              priceItem.category = item.category ? item.category : '';
              priceItem.subCategory = item.subCategory ? item.subCategory : '';
              priceItem.newProduct = item.newProduct === 'true' ? true : false;
            }
          }
          // Fin Agregar
          return {
            status: true,
            message: `Se ha generado la lista de precios de productos.`,
            pricesIngram
          };
        } else {
          return {
            status: false,
            message: `No se han encontrado productos.`,
            pricesIngram: null,
          };
        }
      } else {
        return {
          status: false,
          message: `No se ha generado la lista de precios de productos.`,
          pricesIngram: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        pricesIngram: null,
      };
    }
  }

  async getPricesIngram(variables: IVariables) {
    try {
      // Get todos los productos.
      const { allRecords } = variables;
      const productosIngram = await this.getIngramProducts();
      if (productosIngram.status && productosIngram.ingramProducts.length > 0) {
        // Generar bloques de 50 productos.
        let i = 0;
        let partsNumber: IProductsQuery[] = [];
        const pricesIngram: IPricesIngram[] = [];
        for (const prod of productosIngram.ingramProducts) {
          if (prod.vendorName.toUpperCase() !== "APPLE TEST") {
            i += 1;
            partsNumber.push({ ingramPartNumber: prod.ingramPartNumber });
            if (i % 50 === 0) {
              const productPrices = await this.getPricesIngramBloque(partsNumber)
              if (productPrices && productPrices.pricesIngram && productPrices.pricesIngram.length > 0) {
                for (const prodPrices of productPrices.pricesIngram) {
                  if (allRecords) {
                    pricesIngram.push(prodPrices);
                  } else if (prodPrices.availability && ['A', 'B', 'C'].includes(prodPrices.productClass)) {
                    pricesIngram.push(prodPrices);
                  }
                }
              }
              partsNumber = [];
            }
          }
        }
        // Verificar si quedan productos pendientes.
        if (partsNumber.length > 0) {
          const productPrices = await this.getPricesIngramBloque(partsNumber);
          if (productPrices && productPrices.pricesIngram && productPrices.pricesIngram.length > 0) {
            for (const prodPrices of productPrices.pricesIngram) {
              if (prodPrices.availability) {
                pricesIngram.push(prodPrices);
              }
            }
          }
        }
        if (pricesIngram.length > 0) {
          // Agregar categorias y subcategorias
          for (const priceItem of pricesIngram) {
            const item = productosIngram.ingramProducts.find((x: IIngramProduct) => x.vendorPartNumber === priceItem.vendorPartNumber);
            if (item) {
              priceItem.category = item.category ? item.category : '';
              priceItem.subCategory = item.subCategory ? item.subCategory : '';
              priceItem.newProduct = item.newProduct === 'true' ? true : false;
            }
          }
          // Fin Agregar
          return {
            status: true,
            message: `Se ha generado la lista de precios de productos.`,
            pricesIngram
          };
        } else {
          return {
            status: false,
            message: `No se han encontrado productos.`,
            pricesIngram: null,
          };
        }
      } else {
        return {
          status: false,
          message: `No se ha generado la lista de precios de productos.`,
          pricesIngram: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        pricesIngram: null,
      };
    }
  }

  async getCatalogIngram(variables: IVariables) {
    try {
      const result = await this.getByField(this.collection);
      return {
        status: result.status,
        message: result.message,
        catalogIngram: result.item
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        catalogIngram: null,
      };
    }
  }

  async getCatalogIngrams() {
    // Extraer solo los productos disponibles en Ingram.
    const filter: object = {}
    const result = await this.listAll(this.collection, this.catalogName, 1, -1, filter);
    return {
      status: result.status,
      message: result.message,
      ingramProduct: result.items
    };
  }

  async getExistenciaProductoIngram(variables: IVariables) {
    try {
      const { existenciaProducto } = variables;
      const existenciaProductoIngram = { ...existenciaProducto };
      const products = [];
      products.push({ ingramPartNumber: existenciaProducto?.codigo });
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/catalog/priceandavailability';
      const optionsIngram = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token,
        },
        body: JSON.stringify({
          'products': products
        }),
        redirect: 'manual' as RequestRedirect
      };
      const url = `${apiUrl}?includeAvailability=true&includePricing=true&includeProductAttributes=true`;
      const response = await fetch(url, optionsIngram);
      const responseJson = await response.json();
      for (const product of responseJson) {
        let branchOffices: IBranchOffices[] = [];
        if (product.availability && product.availability.availabilityByWarehouse) {
          for (const warehouse of product.availability.availabilityByWarehouse) {
            if (warehouse.quantityAvailable > 1) {
              const branchOffice: IBranchOffices = {
                id: warehouse.warehouseId,
                name: warehouse.location,
                estado: warehouse.location,
                cantidad: warehouse.quantityAvailable,
                cp: '',
                latitud: '',
                longitud: ''
              }
              branchOffices.push(branchOffice);
            }
          }
        }
        existenciaProductoIngram.branchOffices = branchOffices;
      }
      // Generar
      if (response.statusText === 'OK' || response.status === 207) {
        return {
          status: true,
          message: `Se ha generado la disponbilidad de precios de productos.`,
          existenciaProductoIngram,
        };
      } else {
        return {
          status: false,
          message: `No se ha generado la lista de precios de productos.`,
          existenciaProductoIngram: [],
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        existenciaProductoIngram: [],
      };
    }
  }

  async getPricesIngramBloque(productsQuery: IProductsQuery[]) {
    try {
      // Consultar precio y disponibilidad por bloques de 100.
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/catalog/priceandavailability';
      const optionsIngram = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token,
        },
        body: JSON.stringify({
          'showAvailableDiscounts': true,
          'showReserveInventoryDetails': true,
          'availabilityByWarehouse': {
            'availabilityForAllLocation': true
          },
          'products': productsQuery
        }),
        redirect: 'manual' as RequestRedirect
      };
      const url = `${apiUrl}?includeAvailability=true&includePricing=true&includeProductAttributes=true`;
      const response = await fetch(url, optionsIngram);
      logger.info(`getPricesIngramBloque.response: \n ${JSON.stringify(response)} \n`);
      const responseJson = await response.json();
      if (response.statusText === 'OK' || response.status === 207) {
        return {
          status: true,
          message: `Se ha generado la lista de precios de productos.`,
          pricesIngram: responseJson,
        };
      } else {
        return {
          status: false,
          message: `No se ha generado la lista de precios de productos.`,
          pricesIngram: [],
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        pricesIngram: [],
      };
    }
  }

  async setOrderIngram(variables: IVariables) {
    try {
      if (!variables.pedidoIngram) {
        return {
          status: false,
          message: `No se pudo guardar la orden: pedidoIngram no está definido`,
          orderIngram: null,
        };
      }
      const bodyIngram = {
        customerOrderNumber: variables.pedidoIngram.customerOrderNumber,
        endCustomerOrderNumber: variables.pedidoIngram.endCustomerOrderNumber,
        resellerInfo: variables.pedidoIngram.resellerInfo,
        shipToInfo: variables.pedidoIngram.shipToInfo,
        lines: variables.pedidoIngram.lines,
        additionalAttributes: variables.pedidoIngram.additionalAttributes
      }
      if (!bodyIngram.customerOrderNumber || !bodyIngram.endCustomerOrderNumber) {
        return {
          status: false,
          message: `No se puedo guardar la orden: ${bodyIngram}`,
          orderIngram: null,
        };
      }
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/orders';
      const optionsIngram = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token
        },
        body: JSON.stringify(bodyIngram),
        redirect: 'manual' as RequestRedirect
      };
      const url = `${apiUrl}`;
      const response = await fetch(url, optionsIngram);
      logger.info(`setOrderCva.response: \n ${JSON.stringify(response)} \n`);
      const responseJson = await response.json();
      if (response.status >= 200 && response.status < 300 && response.statusText === 'Created') {
        return {
          status: true,
          message: `Se ha creado la orden de forma correcta.`,
          orderIngram: responseJson,
        };
      } else {
        return {
          status: false,
          message: `Hubo un problema en la generacion de la orden ${JSON.stringify(response)}`,
          orderIngram: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        orderIngram: null,
      };
    }
  }

  async getOrderIngram(variables: IVariables) {
    try {
      const { idOrderIngram } = variables;
      const token = await this.getTokenIngram();
      const apiUrl = 'https://api.ingrammicro.com:443/sandbox/resellers/v6/orders';
      const optionsIngram = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'IM-CustomerNumber': '20-840450',
          'IM-CountryCode': 'MX',
          'IM-CorrelationID': 'fbac82ba-cf0a-4bcf-fc03-0c5084',
          'IM-SenderID': 'DARU DEV',
          'Authorization': 'Bearer ' + token.tokenIngram.access_token,
        },
        redirect: 'manual' as RequestRedirect
      };
      const url = `${apiUrl}/${idOrderIngram}`;
      const response = await fetch(url, optionsIngram);
      // console.log('response: ', response);
      const responseJson = await response.json();
      console.log('responseJson: ', responseJson);
      // Generar
      if (response.statusText === 'OK' || (response.status >= 200 && response.status < 299)) {
        return {
          status: true,
          message: `Se ha recuperado la orden ${idOrderIngram} de forma correcta.`,
          orderOneIngram: responseJson
        };
      } else {
        return {
          status: false,
          message: `No se ha encontrado la orden ${idOrderIngram}. Favor de verificar.`,
          orderOneIngram: {}
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        orderOneIngram: {}
      };
    }
  }

  async getListOrdesrIngram() {

  }
}

export default ExternalIngramService;