import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import logger from '../utils/logger';
import fetch from 'node-fetch';
import { COLLECTIONS } from '../config/constants';
import { Db } from 'mongodb';
import { BranchOffices, Brands, Categorys, Descuentos, Especificacion, Picture, Product, SupplierProd, UnidadDeMedida } from '../models/product.models';
import ConfigsService from './config.service';
import { IPromociones } from '../interfaces/product.interface';
import slugify from 'slugify';

class ExternalSyscomService extends ResolversOperationsService {
  collection = COLLECTIONS.INGRAM_PRODUCTS;
  catalogName = 'Productos Ingram';
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

  async getTokenSyscom() {
    try {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: 'EI20OXsIzHJUkJdWK1ekemWqc3rCtqNX',
          client_secret: '5wwq695ERsumcKdazCR04LhTxQVsPE8NlcZSvg78',
          grant_type: 'client_credentials'
        })
      };
      const url = 'https://developers.syscom.mx/oauth/token';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getTokenSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.error && data.error !== '') {
        return {
          status: false,
          message: data.message || data.detail,
          tokenSyscom: null
        };
      }
      return {
        status: true,
        message: 'El token se ha generado correctamente.',
        tokenSyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        tokenSyscom: null,
      };
    }
  }

  async getListProductsSyscomByBrand(brand: string = '') {
    try {
      const brandName = this.getVariables().brandName || brand;
      if (!brandName || brandName === '') {
        return {
          status: false,
          message: 'Se requiere especificar la marca',
          listProductsSyscomByBrand: null,
        };
      }
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          listProductsSyscomByBrand: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/productos/?marca=' + brandName;
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getTokenSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          listProductsSyscomByBrand: null
        };
      }
      return {
        status: true,
        message: 'La lista de productos se ha generado correctamente',
        listProductsSyscomByBrand: data.productos
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        listProductsSyscomByBrand: null,
      };
    }
  }

  async getListProductsSyscom() {
    try {
      const brand = 'ugreen';
      const listProductsSyscom = (await this.getListProductsSyscomByBrand(brand)).listProductsSyscomByBrand;
      if (listProductsSyscom) {
        const productos: Product[] = [];
        if (listProductsSyscom && listProductsSyscom.length > 0) {
          const db = this.db;
          const config = await new ConfigsService({}, { id: '1' }, { db }).details();
          const stockMinimo = config.config.minimum_offer;
          const exchangeRate = config.config.exchange_rate;
          for (const product of listProductsSyscom) {
            if (product.producto_id !== '') {
              const itemData: Product = await this.setProduct('syscom', product, null, stockMinimo, exchangeRate);
              if (itemData.id !== undefined) {
                productos.push(itemData);
              }
            }
          }
          return await {
            status: true,
            message: `Productos listos para agregar.`,
            listProductsSyscom: productos
          }
        }
        return await {
          status: false,
          message: `No se encontratos los productos del proveedor.`,
          listProductsSyscom: productos
        }

      } else {
        logger.info('No se pudieron recuperar los productos via FTP');
        return {
          status: false,
          message: 'No se pudieron recuperar los productos via FTP.',
          listProductsSyscom: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        listProductsSyscom: null,
      };
    }
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
    if (item && item.total_existencia > 0) {
      const branchOfficesSyscom: BranchOffices[] = [];
      let featured = false;
      itemData.id = item.producto_id;
      itemData.name = item.titulo;
      itemData.slug = slugify(item.titulo, { lower: true });
      itemData.short_desc = item.titulo;
      if (item.precios && item.precios.precio_1) {
        price = parseFloat((parseFloat(item.precios.precio_lista) * exchangeRate * utilidad * iva).toFixed(2));
        salePrice = parseFloat((parseFloat(item.precios.precio_descuento) * exchangeRate * utilidad * iva).toFixed(2));
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
      itemData.stock = item.total_existencia;
      itemData.sku = item.sat_key;
      itemData.upc = item.modelo;
      itemData.ean = '';
      itemData.partnumber = item.sat_key;
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
            // Subcategorias
          } else if (category.nivel === 3) {
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
      s.branchOffices = branchOfficesSyscom;
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
      itemData.suppliersProd = s;
      itemData.model = item.modelo;
      // Imagenes
      itemData.pictures = [];
      i.width = '600';
      i.height = '600';
      i.url = item.img_portada;
      itemData.pictures.push(i);
      // Imagenes pequeñas
      itemData.sm_pictures = [];
      is.width = '300';
      is.height = '300';
      is.url = item.img_portada;
      itemData.variants = [];
      itemData.sm_pictures.push(is);
      itemData.especificaciones = [];
      itemData.especificaciones.push({ tipo: 'Peso', valor: item.peso });
      itemData.especificaciones.push({ tipo: 'Altura', valor: item.alto });
      itemData.especificaciones.push({ tipo: 'Longitud', valor: item.largo });
      itemData.especificaciones.push({ tipo: 'Ancho', valor: item.ancho });
      itemData.especificaciones.push({ tipo: 'Link', valor: item.link });
      itemData.especificaciones.push({ tipo: 'Link_privado', valor: item.link_privado });
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

export default ExternalSyscomService;