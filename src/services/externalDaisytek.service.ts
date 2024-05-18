import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import fetch from 'node-fetch';
import { COLLECTIONS } from '../config/constants';
import { Db } from 'mongodb';
import logger from '../utils/logger';
import { BranchOffices, Brands, Categorys, Descuentos, Picture, Product, SupplierProd, UnidadDeMedida } from '../models/product.models';
import slugify from 'slugify';
import ConfigsService from './config.service';
import { IProductDaisytek, IWarehouseDaisytek, IWarehousesDaisytek } from '../interfaces/suppliers/_Daisyteks.interface';
import { IBranchOffices, ISupplierProd } from '../interfaces/product.interface';

class ExternalDaisytekService extends ResolversOperationsService {
  collection = COLLECTIONS.INGRAM_PRODUCTS;
  catalogName = 'Productos Daisytek';
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

  async getTokenDaisytek() {
    return {
      status: true,
      message: 'El token se ha generado manualmente',
      tokenDaisytek: { token: 'evemNp1P46mj94HiSzQSNEpkPgHs8gPABI5hhJMw' }
    };
  }

  async getProductsDaisytek() {
    const token = await this.getTokenDaisytek();
    if (!token || !token.status) {
      return {
        status: token.status,
        message: token.message,
        productsDaisytek: null,
      };
    }
    const options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token.tokenDaisytek.token
      },
      redirect: 'follow' as RequestRedirect
    };
    const url = 'https://www.daisytek.com.mx/api/products/full-catalog';
    const response = await fetch(url, options);
    if (response.status < 200 || response.status >= 300) {
      return {
        status: false,
        message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
        productsDaisytek: null
      };
    }
    const data = await response.json();
    process.env.PRODUCTION === 'true' && logger.info(`getCategoriesDaisytek.data: \n ${JSON.stringify(data)} \n`);
    const products = data;
    return {
      status: true,
      message: 'Esta es la lista de Productos de Daisytek',
      productsDaisytek: products,
    };
  }

  async getListProductsDaisytek() {
    const listProductsDaisytek = (await this.getProductsDaisytek()).productsDaisytek;
    if (listProductsDaisytek) {
      console.log('listProductsDaisytek.length: ', listProductsDaisytek.length);
      const productos: Product[] = [];
      if (listProductsDaisytek && listProductsDaisytek.length > 0) {
        const db = this.db;
        const config = await new ConfigsService({}, { id: '1' }, { db }).details();
        const stockMinimo = config.config.minimum_offer;
        const exchangeRate = config.config.exchange_rate;
        for (const product of listProductsDaisytek) {
          if (product.sku !== '') {
            const itemData: Product = await this.setProduct('syscom', product, null, stockMinimo, exchangeRate);
            if (itemData.id !== undefined) {
              productos.push(itemData);
            }
          }
        }
      }
      console.log('productos: ', productos);
      return await {
        status: true,
        message: `Productos listos para agregar.`,
        listProductsDaisytek: productos
      }
    } else {
      logger.info('No se pudieron recuperar los productos del proveedor');
      return {
        status: false,
        message: 'No se pudieron recuperar los productos del proveedor.',
        listProductsDaisytek: null,
      };
    }
  } catch(error: any) {
    return {
      status: false,
      message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
      listProductsDaisytek: null,
    };
  }

  async getExistenciaProductoDaisytek() {
    const existenciaProducto = this.getVariables().existenciaProducto;
    if (!existenciaProducto) {
      return {
        status: false,
        message: 'Se requiere especificar los datos del producto.',
        existenciaProductoDaisytek: null,
      };
    }
    const token = await this.getTokenDaisytek();
    const partNumberDaisytek = existenciaProducto.codigo;
    if (!token || !token.status) {
      return {
        status: token.status,
        message: token.message,
        existenciaProductoDaisytek: null,
      };
    }
    const options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token.tokenDaisytek.token
      },
      redirect: 'follow' as RequestRedirect
    };
    const url = `https://www.daisytek.com.mx/api/products/${partNumberDaisytek}/pna`;
    const response = await fetch(url, options);
    if (response.status < 200 || response.status >= 300) {
      return {
        status: false,
        message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
        existenciaProductoDaisytek: null
      };
    }
    const data: IProductDaisytek = await response.json();
    process.env.PRODUCTION === 'true' && logger.info(`getExistenciaProductoDaisytek.data: \n ${JSON.stringify(data)} \n`);
    if (data) {
      const warehousesDaisytek: IWarehousesDaisytek = data.warehouses;
      const almacenesConExistencia = this.buscarAlmacenesConExistencia(existenciaProducto, warehousesDaisytek);
      const almacenesCompletos = Object.values(almacenesConExistencia)
        .filter((almacen): almacen is IWarehouseDaisytek => almacen !== undefined)
        .map((almacen: IWarehouseDaisytek) => {
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
        message: 'Esta es la lista de Productos de Daisytek',
        existenciaProductoDaisytek: existenciaProducto,
      };
    } else {
      return {
        status: false,
        message: 'Error en el servicio. url: ' + url + ', options: ' + options + ', response:' + response,
        existenciaProductoDaisytek: null,
      };
    }
  }

  buscarAlmacenesConExistencia(
    existenciaProducto: ISupplierProd,
    existenciaProductoDaisytek: IWarehousesDaisytek
  ): IWarehousesDaisytek {
    const cantidad = existenciaProducto.branchOffices[0]?.cantidad;
    const almacenesConExistencia: IWarehousesDaisytek = {};
    for (const [key, almacen] of Object.entries(existenciaProductoDaisytek)) {
      if (almacen && cantidad !== undefined && almacen.stock >= cantidad) {
        almacen.id = key;
        almacenesConExistencia[key] = almacen;
      }
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
    console.log('item: ', item);
    if (item && item.warehouses) {
      if (item.price && item.price > 0) {
        const branchOfficesDaisytek: BranchOffices[] = [];
        const existenciaProductoDaisytek: IWarehousesDaisytek = item.warehouses;
        const almacenesConExistencia: IWarehousesDaisytek = {};
        for (const [key, almacen] of Object.entries(existenciaProductoDaisytek)) {
          if (almacen && almacen.stock >= stockMinimo) {
            almacen.id = key;
            almacenesConExistencia[key] = almacen;
            console.log('almacen: ', almacen);
            const almacenTmp = this.getAlmacenCant(almacen);
            branchOfficesDaisytek.push(almacenTmp)
          }
        }
        console.log('branchOfficesDaisytek: ', branchOfficesDaisytek);
        let featured = false;
        itemData.id = item.sku;
        itemData.name = item.title;
        itemData.slug = slugify(item.title, { lower: true });
        itemData.short_desc = item.description;
        price = parseFloat((parseFloat(item.price) * utilidad * iva).toFixed(2));
        salePrice = parseFloat((parseFloat(item.price) * utilidad * iva).toFixed(2));
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
        }
        // SupplierProd
        s.idProveedor = proveedor;
        s.codigo = item.sku;
        s.cantidad = stockMinimo;
        s.price = parseFloat(item.price);
        s.sale_price = 0;
        s.moneda = 'MXN';
        s.category = new Categorys();
        s.subCategory = new Categorys();
        // Almacenes
        s.branchOffices = branchOfficesDaisytek;
        itemData.suppliersProd = s;
        itemData.model = '';
        itemData.pictures = [];
        itemData.sm_pictures = [];
        itemData.especificaciones = [];
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

export default ExternalDaisytekService;