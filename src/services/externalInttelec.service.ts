import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import fetch from 'node-fetch';
import { COLLECTIONS } from '../config/constants';
import { Db } from 'mongodb';
import logger from '../utils/logger';
import { BranchOffices, Brands, Categorys, Descuentos, Picture, Product, SupplierProd, UnidadDeMedida } from '../models/product.models';
import slugify from 'slugify';
import ConfigsService from './config.service';
import { IProductInttelec, IWarehouseInttelec, IWarehousesInttelec } from '../interfaces/suppliers/_Inttelecs.interface';
import { IBranchOffices, ISupplierProd } from '../interfaces/product.interface';

class ExternalInttelecService extends ResolversOperationsService {
  collection = COLLECTIONS.INGRAM_PRODUCTS;
  catalogName = 'Productos Inttelec';
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

  async getTokenInttelec() {
    return {
      status: true,
      message: 'El token se ha generado manualmente',
      tokenInttelec: { token: '226476b012adba84026281feac92e7d22ecaa902526f3ebafd2b3717c61eb172' }
    };
  }

  async getProductsInttelec() {
    try {
      const token = await this.getTokenInttelec();
      if (!token || !token.status) {
        return {
          status: token.status,
          message: token.message,
          productsInttelec: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'X-Odoo-Api-Key': token.tokenInttelec.token
        },
        redirect: 'follow' as RequestRedirect
      };
      const url = 'https://inttelec.odoo.com/api/products/';
      const response = await fetch(url, options);
      if (response.status < 200 || response.status >= 300) {
        return {
          status: false,
          message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
          productsInttelec: null
        };
      }
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getCategoriesInttelec.data: \n ${JSON.stringify(data)} \n`);
      const products = data.result.result;
      return {
        status: true,
        message: 'Esta es la lista de Productos de Inttelec',
        productsInttelec: products,
      };
    } catch (error) {
      console.log('error: ', error);
      return {
        status: false,
        message: 'Lo sentimos hay un errror al recuperar los productos. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo',
        productsInttelec: null
      };
    }
  }

  async getListProductsInttelec() {
    try {
      const listProductsInttelec = (await this.getProductsInttelec()).productsInttelec;
      if (listProductsInttelec) {
        const productos: Product[] = [];
        if (listProductsInttelec && listProductsInttelec.length > 0) {
          const db = this.db;
          const config = await new ConfigsService({}, { id: '1' }, { db }).details();
          const stockMinimo = config.config.minimum_offer;
          const exchangeRate = config.config.exchange_rate;
          for (const product of listProductsInttelec) {
            if (product.sku !== '') {
              const itemData: Product = await this.setProduct('inttelec', product, null, stockMinimo, exchangeRate);
              if (itemData.id !== undefined) {
                productos.push(itemData);
              }
            }
          }
        }
        // console.log('productos: ', productos);
        return await {
          status: true,
          message: `Productos listos para agregar.`,
          listProductsInttelec: productos
        }
      } else {
        logger.info('No se pudieron recuperar los productos del proveedor');
        return {
          status: false,
          message: 'No se pudieron recuperar los productos del proveedor.',
          listProductsInttelec: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        listProductsInttelec: null,
      };
    }
  }

  async setOrderInttelec() {
    try {
      const orderInttelec = this.getVariables().orderInttelec;
      // console.log('orderInttelec: ', orderInttelec);
      if (!orderInttelec) {
        return {
          status: false,
          message: 'Se requiere especificar los datos del pedido.',
          addOrderInttelec: null,
        };
      }
      const token = await this.getTokenInttelec();
      if (!token || !token.status) {
        return {
          status: token.status,
          message: token.message,
          addOrderInttelec: null,
        };
      }
      const options = {
        method: 'POST',
        headers: {
          'X-Odoo-Api-Key': token.tokenInttelec.token
        },
        payload: {
          'purchase_order_number': orderInttelec.purchase_order_number,
          'warehouse': orderInttelec.warehouse,
          'products': orderInttelec.products,
        },
        redirect: 'follow' as RequestRedirect
      };
      const url = 'https://www.inttelec.com.mx/api/products/full-catalog';
      // console.log('options: ', options);
      const response = await fetch(url, options);
      if (response.status < 200 || response.status >= 300) {
        return {
          status: false,
          message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
          addOrderInttelec: null
        };
      }
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getCategoriesInttelec.data: \n ${JSON.stringify(data)} \n`);
      return {
        status: true,
        message: 'Esta es la lista de Productos de Inttelec',
        addOrderInttelec: data,
      };
    } catch (error) {
      console.log('error: ', error);
      return {
        status: false,
        message: 'Lo sentimos hay un errror al generar la orden con el proveedor. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo',
        addOrderInttelec: null
      };
    }
  }

  async getExistenciaProductoInttelec() {
    const existenciaProducto = this.getVariables().existenciaProducto;
    if (!existenciaProducto) {
      return {
        status: false,
        message: 'Se requiere especificar los datos del producto.',
        existenciaProductoInttelec: null,
      };
    }
    const token = await this.getTokenInttelec();
    const partNumberInttelec = existenciaProducto.codigo;
    if (!token || !token.status) {
      return {
        status: token.status,
        message: token.message,
        existenciaProductoInttelec: null,
      };
    }
    const options = {
      method: 'GET',
      headers: {
        'X-Odoo-Api-Key': token.tokenInttelec.token
      },
      redirect: 'follow' as RequestRedirect
    };
    const url = `https://inttelec.odoo.com/api/products/${partNumberInttelec}/pna`;
    const response = await fetch(url, options);
    if (response.status < 200 || response.status >= 300) {
      return {
        status: false,
        message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
        existenciaProductoInttelec: null
      };
    }
    const data: IProductInttelec = await response.json();
    process.env.PRODUCTION === 'true' && logger.info(`getExistenciaProductoInttelec.data: \n ${JSON.stringify(data)} \n`);
    if (data) {
      const warehousesInttelec: IWarehousesInttelec[] = data.warehouses;
      const almacenesConExistencia = this.buscarAlmacenesConExistencia(existenciaProducto, warehousesInttelec);
      const almacenesCompletos = Object.values(almacenesConExistencia)
        .filter((almacen): almacen is IWarehouseInttelec => almacen !== undefined)
        .map((almacen: IWarehouseInttelec) => {
          return {
            id: almacen.id,
            cantidad: almacen.stock,
            name: almacen.location,
            estado: almacen.location,
            cp: '',
            latitud: '',
            longitud: '',
          };
        });
      existenciaProducto.branchOffices = almacenesCompletos;
      return {
        status: true,
        message: 'Esta es la lista de Productos de Inttelec',
        existenciaProductoInttelec: existenciaProducto,
      };
    } else {
      return {
        status: false,
        message: 'Error en el servicio. url: ' + url + ', options: ' + options + ', response:' + response,
        existenciaProductoInttelec: null,
      };
    }
  }

  buscarAlmacenesConExistencia(
    existenciaProducto: ISupplierProd,
    existenciaProductoInttelec: IWarehousesInttelec[]
  ): IWarehousesInttelec {
    const cantidad = existenciaProducto.branchOffices[0]?.cantidad;
    const almacenesConExistencia: IWarehousesInttelec = { location_id: [], available_quantity: 0 };
    for (const [key, almacen] of Object.entries(existenciaProductoInttelec)) {
      // if (almacen && cantidad !== undefined && almacen.stock >= cantidad) {
      //   almacen.id = key;
      //   almacenesConExistencia[key] = almacen;
      // }
    }
    return almacenesConExistencia;
  }

  quitarAcentos(texto: string): string {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  async setProduct(proveedor: string, item: any, imagenes: any = null, stockMinimo: number, exchangeRate: number) {
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
    // console.log('item.warehouses: ', item.warehouses);

    if (item && item.warehouses) {
      console.log('item.price: ', item.price);
      if (item.price && item.price.length > 0 && item.price[0].price_unit && item.price[0].price_unit > 0) {
        const priceUnit = item.price[0].price_unit;
        const branchOfficesInttelec: BranchOffices[] = [];
        const existenciaProductoInttelec: IWarehousesInttelec = item.warehouses;
        // console.log('existenciaProductoInttelec: ', existenciaProductoInttelec);
        // const almacenesConExistencia: IWarehousesInttelec = {};
        for (const [key, almacen] of Object.entries(existenciaProductoInttelec)) {
          // console.log('almacen: ', almacen);
          if (almacen && almacen.available_quantity >= stockMinimo) {
            disponible += almacen.available_quantity;
            almacen.id = key;
            // almacenesConExistencia[key] = almacen;
            const almacenTmp = this.getAlmacenCant(almacen);
            branchOfficesInttelec.push(almacenTmp)
          }
        }
        console.log('disponible: ', disponible);
        if (disponible > 0) {
          let featured = false;
          itemData.id = item.sku;
          itemData.name = item.title;
          itemData.slug = slugify(item.title, { lower: true });
          itemData.short_desc = item.title;
          price = parseFloat((parseFloat(priceUnit) * utilidad * iva).toFixed(2));
          salePrice = parseFloat((parseFloat(priceUnit) * utilidad * iva).toFixed(2));
          if (price > salePrice) {
            featured = true;
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
          itemData.sku = item.sku;
          itemData.upc = '';
          itemData.ean = '';
          itemData.partnumber = item.manufacturer_sku;
          unidad.id = 'PZ';
          unidad.name = 'Pieza';
          unidad.slug = 'pieza';
          itemData.unidadDeMedida = unidad;
          itemData.category = [];
          itemData.subCategory = [];
          // Marcas
          if (item.manufacturer) {
            itemData.brand = item.manufacturer.toLowerCase();
            itemData.brands = [];
            b.name = item.manufacturer;
            b.slug = slugify(item.manufacturer, { lower: true });
            itemData.brands.push(b);
          } else {
            itemData.brand = 'N/E';
            itemData.brands = [];
            b.name = 'N/E';
            b.slug = 'ne';
            itemData.brands.push(b);
          }
          // Categorias
          const c = new Categorys();
          c.name = '';
          c.slug = '';
          itemData.category.push(c);
          // Subcatgorias
          const c1 = new Categorys();
          c1.name = '';
          c1.slug = '';
          itemData.subCategory.push(c1);
          // SupplierProd
          s.idProveedor = proveedor;
          s.codigo = item.sku;
          s.cantidad = stockMinimo;
          s.price = parseFloat(priceUnit);
          s.sale_price = 0;
          s.moneda = 'MXN';
          s.category = new Categorys();
          s.subCategory = new Categorys();
          // Almacenes
          s.branchOffices = branchOfficesInttelec;
          itemData.suppliersProd = s;
          itemData.model = '';
          itemData.pictures = [];
          itemData.sm_pictures = [];
          itemData.especificaciones = [];
          itemData.sheetJson = '';
        }
      }
    }
    return itemData;
  }

  getAlmacenCant(branch: any): BranchOffices {
    const almacen = new BranchOffices();
    almacen.id = branch.id;
    almacen.name = branch.location;
    almacen.estado = branch.location;
    almacen.cp = '';
    almacen.latitud = '';
    almacen.longitud = '';
    almacen.cantidad = branch.stock;
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

}

export default ExternalInttelecService;