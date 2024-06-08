import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import fetch from 'node-fetch';
import { COLLECTIONS } from '../config/constants';
import { Db } from 'mongodb';
import logger from '../utils/logger';
import { BranchOffices, Brands, Categorys, Descuentos, Picture, Product, SupplierProd, UnidadDeMedida } from '../models/product.models';
import slugify from 'slugify';
import ConfigsService from './config.service';

class ExternalBDIService extends ResolversOperationsService {
  collection = COLLECTIONS.INGRAM_PRODUCTS;
  catalogName = 'Productos BDI';
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

  async getTokenBDI() {
    const username = 'admin@daru.im';
    const password = 'daru.01.02';
    const optionsBDI = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: username,
        password: password
      }),
      redirect: 'follow' as RequestRedirect
    };
    const tokenBDI = await fetch('https://admin.bdicentralapi.net/signin', optionsBDI)
      .then(response => response.json())
      .then(async response => {
        return await response;
      })
      .catch(err => console.error(err));
    const status = tokenBDI.token !== '' ? true : false;
    const message = tokenBDI.access_token !== '' ? 'El token se ha generado correctamente. data:' : 'Error en el servicio. ' + JSON.stringify(tokenBDI);
    return {
      status,
      message,
      tokenBDI
    };
  }

  async getBrandsBDI() {
    const token = await this.getTokenBDI();
    if (!token || !token.status) {
      return {
        status: token.status,
        message: token.message,
        brandsBDI: null,
      };
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.tokenBDI.token
      }
    };
    const url = 'https://admin.bdicentralapi.net/api/manufacturer';
    const response = await fetch(url, options);
    if (response.status < 200 || response.status >= 300) {
      return {
        status: false,
        message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
        brandsBDI: null
      };
    }
    const data = await response.json();
    process.env.PRODUCTION === 'true' && logger.info(`getBrandsBDI.data: \n ${JSON.stringify(data)} \n`);
    const brands = data.manufacturer;
    return {
      status: true,
      message: 'Esta es la lista de Marcas de BDI',
      brandsBDI: brands,
    };
  }

  async getCategoriesBDI() {
    const token = await this.getTokenBDI();
    if (!token || !token.status) {
      return {
        status: token.status,
        message: token.message,
        categoriesBDI: null,
      };
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.tokenBDI.token
      }
    };
    const url = 'https://admin.bdicentralapi.net/api/categories';
    const response = await fetch(url, options);
    if (response.status < 200 || response.status >= 300) {
      return {
        status: false,
        message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
        categoriesBDI: null
      };
    }
    const data = await response.json();
    process.env.PRODUCTION === 'true' && logger.info(`getCategoriesBDI.data: \n ${JSON.stringify(data)} \n`);
    const brands = data.categories;
    return {
      status: true,
      message: 'Esta es la lista de Marcas de BDI',
      categoriesBDI: brands,
    };
  }

  async getLocationsBDI() {
    try {
      const token = await this.getTokenBDI();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          locationsBDI: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenBDI.token
        }
      };
      const url = 'https://admin.bdicentralapi.net/api/brslocations';
      const response = await fetch(url, options);
      if (response.status < 200 || response.status >= 300) {
        return {
          status: false,
          message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
          locationsBDI: null
        };
      }
      const data = await response.json();
      const sucursales = data.brsLocations;
      return {
        status: true,
        message: 'Esta es la lista de Sucursales de BDI',
        locationsBDI: sucursales
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        locationsBDI: null,
      };
    }
  }

  async getProductsBDI() {
    const token = await this.getTokenBDI();
    if (!token || !token.status) {
      return {
        status: token.status,
        message: token.message,
        productsBDI: null,
      };
    }
    const raw = JSON.stringify({
      "report": "json",
      "filters": {
        "active": true
      }
    });
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.tokenBDI.token
      },
      body: raw
    };
    const url = 'https://admin.bdicentralapi.net/api/products';
    const response = await fetch(url, options);
    if (response.status < 200 || response.status >= 300) {
      return {
        status: false,
        message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
        productsBDI: null
      };
    }
    const data = await response.json();
    process.env.PRODUCTION === 'true' && logger.info(`getProductsBDI.data: \n ${JSON.stringify(data)} \n`);
    const products = data.products;
    return {
      status: true,
      message: 'Esta es la lista de Productos de BDI',
      productsBDI: products,
    };
  }

  async getProductsPricesBDI() {
    const token = await this.getTokenBDI();
    if (!token || !token.status) {
      return {
        status: token.status,
        message: token.message,
        productsPricesBDI: null,
      };
    }
    const raw = JSON.stringify({
      "report": "json",
      "filters": {
        "active": true
      }
    });
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.tokenBDI.token
      },
      body: raw
    };
    const url = 'https://admin.bdicentralapi.net/api/prices';
    const response = await fetch(url, options);
    if (response.status < 200 || response.status >= 300) {
      return {
        status: false,
        message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
        productsPricesBDI: null
      };
    }
    const data = await response.json();
    process.env.PRODUCTION === 'true' && logger.info(`getProductsPricesBDI.data: \n ${JSON.stringify(data)} \n`);
    const productsPrices = data.products;
    return {
      status: true,
      message: 'Esta es la lista de Precios de Productos de BDI',
      productsPricesBDI: productsPrices,
    };
  }

  async getListProductsBDI() {
    const listProductsBDI = (await this.getProductsBDI()).productsBDI;
    const listProductsPricesBDI = (await this.getProductsPricesBDI()).productsPricesBDI;
    if (listProductsBDI && listProductsPricesBDI) {
      const productos: Product[] = [];
      if (listProductsBDI.length > 0 && listProductsPricesBDI.length > 0) {
        const db = this.db;
        const config = await new ConfigsService({}, { id: '1' }, { db }).details();
        const stockMinimo = config.config.minimum_offer;
        const exchangeRate = config.config.exchange_rate;
        for (const product of listProductsBDI) {
          for (const productsP of listProductsPricesBDI) {
            if (product.sku === productsP.sku) {
              const itemData: Product = await this.setProduct('ingram', product, productsP, null, stockMinimo, exchangeRate);
              if (itemData.id !== undefined) {
                productos.push(itemData);
              }
            }
          }
        }
      }
      return await {
        status: true,
        message: `Productos listos para agregar.`,
        listProductsBDI: productos
      }
    } else {
      logger.info('No se pudieron recuperar los productos del proveedor');
      return {
        status: false,
        message: 'No se pudieron recuperar los productos del proveedor.',
        listProductsBDI: null,
      };
    }
  } catch(error: any) {
    return {
      status: false,
      message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
      listProductsBDI: null,
    };
  }

  async setProduct(proveedor: string, item: any, productPrice: any = null, imagenes: any = null, stockMinimo: number, exchangeRate: number) {
    const utilidad: number = 1.08;
    const iva: number = 1.16;
    let itemData: Product = new Product();
    let unidad: UnidadDeMedida = new UnidadDeMedida();
    let b: Brands = new Brands();
    let s: SupplierProd = new SupplierProd();
    let i: Picture = new Picture();
    let is: Picture = new Picture();
    let desc: Descuentos = new Descuentos();
    let disponible = 0;
    let price = 0;
    let salePrice = 0;
    itemData.id = undefined;
    if (item && item.inventory > 0) {
      disponible = item.inventory;
      let featured = false;
      itemData.id = item.sku;
      itemData.name = item.products.description || 'SIN DESCRIPCION';
      itemData.slug = slugify(item.products.description || '', { lower: true });
      itemData.short_desc = item.products.productDetailDescription || item.products.description;
      itemData.exchangeRate = exchangeRate;
      if (item.price) {
        if (item.currencyCode && (item.currencyCode === 'MXN' || item.currencyCode === 'MXP')) {
          exchangeRate = 1;
        }
        const priceS = parseFloat(item.price);
        price = parseFloat((priceS * exchangeRate * utilidad * iva).toFixed(2));
        salePrice = priceS;
        if (productPrice.priceSpecial && productPrice.priceSpecial.specialPriceDiscount) {
          const priceD = parseFloat(productPrice.priceSpecial.specialPriceDiscount);
          salePrice = parseFloat(((priceS - priceD) * exchangeRate * utilidad * iva).toFixed(2));
        }
        if (price > salePrice) {
          featured = true;
        }
      }
      itemData.price = price;
      itemData.sale_price = salePrice;
      itemData.review = 0;
      itemData.ratings = 0;
      itemData.until = this.getFechas(new Date());
      itemData.top = false;
      itemData.featured = featured;
      itemData.new = false;
      itemData.sold = '';
      itemData.stock = disponible;
      itemData.sku = item.sku;
      itemData.upc = item.products.upcnumber;
      itemData.ean = '';
      itemData.partnumber = item.products.vendornumber;
      unidad.id = 'PZ';
      unidad.name = 'Pieza';
      unidad.slug = 'pieza';
      itemData.unidadDeMedida = unidad;
      // Categorias
      if (item.products.categoriesIdIngram) {
        itemData.category = [];
        itemData.subCategory = [];
        const partes: string[] = item.products.categoriesIdIngram.split("->", 2);
        if (partes && partes.length > 0) {
          // Categorias
          if (partes[0].length > 0) {
            const c = new Categorys();
            c.name = partes[0];
            c.slug = slugify(partes[0] || '', { lower: true });
            itemData.category.push(c);
          }
          // Subcategorias
          if (partes[1].length > 0) {
            const c = new Categorys();
            c.name = partes[1];
            c.slug = slugify(partes[1] || '', { lower: true });
            itemData.subCategory.push(c);
          }
        }
      }
      // Marcas
      if (item.products.manufacturerIdIngram) {
        itemData.brand = item.products.manufacturerIdIngram.toLowerCase();
        itemData.brands = [];
        b.name = item.products.manufacturerIdIngram;
        b.slug = slugify(item.products.manufacturerIdIngram || '', { lower: true });
        itemData.brands.push(b);
      }
      // SupplierProd
      s.idProveedor = proveedor;
      s.codigo = item.products.vendornumber;
      s.cantidad = stockMinimo;
      s.price = parseFloat(item.price);
      if (productPrice.priceSpecial && productPrice.priceSpecial.specialPriceDiscount) {
        s.sale_price = parseFloat(item.price) - parseFloat(productPrice.priceSpecial.specialPriceDiscount);
      }
      s.moneda = item.currencyCode;
      s.category = new Categorys();
      s.subCategory = new Categorys();
      const partes: string[] = item.products.categoriesIdIngram.split("->", 2);
      if (partes && partes.length > 0) {
        // Categoria
        if (partes[0].length > 0) {
          s.category.name = partes[0];
          s.category.slug = slugify(partes[0] || '', { lower: true });
        }
        // Subcategoria
        if (partes[1].length > 0) {
          s.subCategory.name = partes[1];
          s.subCategory.slug = slugify(partes[1] || '', { lower: true });
        }
      }
      // Almacenes
      const branchOfficesIngram: BranchOffices[] = [];
      if (productPrice.brs && productPrice.brs.length > 0) {
        for (const brs of productPrice.brs) {
          let branchOffice: BranchOffices = new BranchOffices();
          branchOffice.id = brs.id;
          branchOffice.name = brs.name;
          branchOffice.estado = brs.name;
          branchOffice.cp = '31000';
          branchOffice.latitud = '';
          branchOffice.longitud = '';
          branchOffice.cantidad = brs.inventory;
          branchOfficesIngram.push(branchOffice);
        }
      }
      s.branchOffices = branchOfficesIngram;
      itemData.suppliersProd = s;
      function extraerModelo(description: string): string | null {
        const regex = /MODELO\s*:\s*([^\s]+)/;
        const match = description.match(regex);
        return match ? match[1] : '';
      }
      if (productPrice.description) {
        itemData.model = extraerModelo(productPrice.description) || '';
      }
      // Imagenes
      if (item.products.images) {
        const urlsDeImagenes: string[] = item.products.images.split(',');
        if (urlsDeImagenes.length > 0) {
          // Imagenes
          itemData.pictures = [];
          for (const urlImage of urlsDeImagenes) {
            const i = new Picture();
            i.width = '600';
            i.height = '600';
            i.url = urlImage;
            itemData.pictures.push(i);
            // Imagenes pequeñas
            itemData.sm_pictures = [];
            const is = new Picture();
            is.width = '300';
            is.height = '300';
            is.url = urlImage;
            itemData.sm_pictures.push(i);
          }
        }
      }
    }
    return itemData;
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

}

export default ExternalBDIService;