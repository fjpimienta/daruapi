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
    const username = 'bdimx@customer.com';
    const password = 'yIP9fj4I8g';
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
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.tokenBDI.token
      }
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
    process.env.PRODUCTION === 'true' && logger.info(`getCategoriesBDI.data: \n ${JSON.stringify(data)} \n`);
    const products = data.products;
    return {
      status: true,
      message: 'Esta es la lista de Productos de BDI',
      productsBDI: products,
    };
  }

  async getListProductsBDI() {
    const listProductsBDI = (await this.getProductsBDI()).productsBDI;
    const sucursales = (await this.getLocationsBDI()).locationsBDI;
    const sucursal = sucursales.find((suc: any) => suc.name === 'Mexico DF');
    let branchOffice: BranchOffices = new BranchOffices();
    branchOffice.id = sucursal ? sucursal.brId : '10';
    branchOffice.name = sucursal ? sucursal.name : 'Mexico DF';
    branchOffice.estado = sucursal ? sucursal.alias : 'Mexico DF';
    branchOffice.cantidad = 0;
    branchOffice.cp = sucursal ? sucursal.codigo_postal : '31000';
    branchOffice.latitud = '';
    branchOffice.longitud = '';
    if (listProductsBDI) {
      const productos: Product[] = [];
      if (listProductsBDI && listProductsBDI.length > 0) {
        const db = this.db;
        const config = await new ConfigsService({}, { id: '1' }, { db }).details();
        const stockMinimo = config.config.minimum_offer;
        const exchangeRate = config.config.exchange_rate;
        for (const product of listProductsBDI) {
          if (product.producto_id !== '') {
            const itemData: Product = await this.setProduct('syscom', product, null, stockMinimo, exchangeRate, branchOffice);
            if (itemData.id !== undefined) {
              productos.push(itemData);
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

  async getExistenciaProductoBDI() {

  }


  quitarAcentos(texto: string): string {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  async setProduct(proveedor: string, item: any, imagenes: any = null, stockMinimo: number, exchangeRate: number, sucursal: BranchOffices) {
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
      itemData.name = item.productDetailDescription;
      itemData.slug = slugify(item.productDetailDescription, { lower: true });
      itemData.short_desc = item.description;
      if (item.price) {
        price = parseFloat((parseFloat(item.price) * exchangeRate * utilidad * iva).toFixed(2));
        salePrice = parseFloat((parseFloat(item.price) * exchangeRate * utilidad * iva).toFixed(2));
        if (price > salePrice) {
          featured = true;
        }
      }
      itemData.price = price;
      itemData.sale_price = salePrice;
      itemData.exchangeRate = exchangeRate;
      itemData.review = 0;
      itemData.ratings = 0;
      itemData.until = this.getFechas(new Date());
      itemData.top = false;
      itemData.featured = featured;
      itemData.new = false;
      itemData.sold = '';
      itemData.stock = disponible;
      itemData.sku = item.producto_id;
      itemData.upc = item.sat_key;
      itemData.ean = '';
      itemData.partnumber = item.modelo;
      unidad.id = item.unidad_de_medida.codigo_unidad || 'PZ';
      unidad.name = item.unidad_de_medida.nombre || 'Pieza';
      unidad.slug = slugify(item.unidad_de_medida.nombre) || 'pieza';
      itemData.unidadDeMedida = unidad;
      // Categorias
      if (item.categorias) {
        itemData.category = [];
        itemData.subCategory = [];
        item.categorias.forEach((category: any) => {
          // Categorias
          if (category.nivel === 1 || category.nivel === 2) {
            const c = new Categorys();
            c.name = category.nombre;
            c.slug = slugify(category.nombre, { lower: true });
            itemData.category.push(c);
          }
          // Subcategorias
          if (category.nivel === 3) {
            const c = new Categorys();
            c.name = category.nombre;
            c.slug = slugify(category.nombre, { lower: true });
            itemData.subCategory.push(c);
          }
        });
      }
      // Marcas
      itemData.brand = item.marca.toLowerCase();
      itemData.brands = [];
      b.name = item.marca;
      b.slug = slugify(item.marca, { lower: true });
      itemData.brands.push(b);
      // SupplierProd
      s.idProveedor = proveedor;
      s.codigo = item.producto_id;
      s.cantidad = stockMinimo;
      s.price = parseFloat(item.precios.precio_lista);
      s.sale_price = parseFloat(item.precios.precio_descuento);
      s.moneda = 'MXN';
      s.category = new Categorys();
      s.subCategory = new Categorys();
      item.categorias.forEach((category: any) => {
        if (category.nivel === 1) {
          const c = new Categorys();
          c.name = category.nombre;
          c.slug = slugify(category.nombre, { lower: true });
        } else if (category.nivel === 3) {
          const c = new Categorys();
          c.name = category.nombre;
          c.slug = slugify(category.nombre, { lower: true });
        }
      });
      // Almacenes
      const branchOfficesSyscom: BranchOffices[] = [];
      let branchOffice: BranchOffices = new BranchOffices();
      branchOffice.id = sucursal ? sucursal.id : 'chihuahua';
      branchOffice.name = sucursal ? sucursal.name : 'Matriz Chihuahua';
      branchOffice.estado = sucursal ? sucursal.estado : 'Chihuahua';
      branchOffice.cp = sucursal ? sucursal.cp : '31000';
      branchOffice.latitud = '';
      branchOffice.longitud = '';
      branchOffice.cantidad = disponible;
      branchOfficesSyscom.push(branchOffice);
      s.branchOffices = branchOfficesSyscom;
      itemData.suppliersProd = s;
      itemData.model = item.modelo;
      itemData.pictures = item.pictures;
      itemData.sm_pictures = item.sm_pictures;
      itemData.especificaciones = [];
      if (item.especificaciones && item.especificaciones.length > 0) {
        itemData.especificaciones = item.especificaciones;
      }
      itemData.especificaciones.push({ tipo: 'Peso', valor: item.peso });
      itemData.especificaciones.push({ tipo: 'Altura', valor: item.alto });
      itemData.especificaciones.push({ tipo: 'Longitud', valor: item.largo });
      itemData.especificaciones.push({ tipo: 'Ancho', valor: item.ancho });
      itemData.especificaciones.push({ tipo: 'Link', valor: item.link });
      itemData.especificaciones.push({ tipo: 'Link_privado', valor: item.link_privado });
      itemData.especificacionesBullet = item.especificacionesBullet;
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