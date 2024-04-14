import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import logger from '../utils/logger';
import fetch from 'node-fetch';
import { COLLECTIONS } from '../config/constants';
import { Db } from 'mongodb';
import { BranchOffices, Brands, Categorys, Descuentos, Picture, Product, SupplierProd, UnidadDeMedida } from '../models/product.models';
import ConfigsService from './config.service';
import slugify from 'slugify';
import { IMetodoPagoItemDetalle, IMetodoPagoSyscom } from '../interfaces/suppliers/_Syscom.interface';
import { IPicture } from '../interfaces/product.interface';

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
          client_id: 'ZPQOODICaW98DgXiNPodz4TkT4slhyBa',
          client_secret: 'ppUFuPSyiErb39lURH50sA72zW1JsinRXoH0tLjM',
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

  async getOneBrandSyscom(brand: string = '') {
    try {
      const brandName = this.getVariables().brandName || brand;
      if (!brandName || brandName === '') {
        return {
          status: false,
          message: 'Se requiere especificar la marca',
          oneBrandSyscom: null,
        };
      }
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          oneBrandSyscom: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/marcas/' + brandName;
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getOneBrandSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          oneBrandSyscom: null
        };
      }
      return {
        status: true,
        message: `La marca ${brandName} se ha generado correctamente`,
        oneBrandSyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        oneBrandSyscom: null,
      };
    }
  }

  async getListBrandsSyscom() {
    try {
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          listBrandsSyscom: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/marcas/';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getListBrandsSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          listBrandsSyscom: null
        };
      }
      return {
        status: true,
        message: `Las marcas se han generado correctamente`,
        listBrandsSyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        listBrandsSyscom: null,
      };
    }
  }

  async getOneCategorySyscom(idCategory: string = '') {
    try {
      const categoryId = this.getVariables().categoryId || idCategory;
      if (!categoryId || categoryId === '') {
        return {
          status: false,
          message: 'Se requiere especificar la categoria',
          oneCategorySyscom: null,
        };
      }
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          oneCategorySyscom: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/categorias/' + categoryId;
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getOneCategorySyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          oneCategorySyscom: null
        };
      }
      return {
        status: true,
        message: `La categoria ${categoryId} se ha generado correctamente`,
        oneCategorySyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        oneCategorySyscom: null,
      };
    }
  }

  async getListCategorySyscom() {
    try {
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          listCategorysSyscom: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/categorias/';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getListCategorySyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          listCategorysSyscom: null
        };
      }
      return {
        status: true,
        message: `Las categorias se han generado correctamente`,
        listCategorysSyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        listCategorysSyscom: null,
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
      if (!token.status) {
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
      const url = 'https://developers.syscom.mx/api/v1/productos/?marca=' + brandName + '&stock=1';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getTokenSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (response.status < 200 || response.status >= 300) {
        return {
          status: false,
          message: data.message || data.detail,
          listProductsSyscomByBrand: null
        };
      }
      let allProducts = data.productos;
      const totalPages = data.paginas;
      for (let page = 2; page <= totalPages; page++) {
        const pageUrl = `${url}&pagina=${page}`;
        const nextPageResponse = await fetch(pageUrl, options);
        const nextPageData = await nextPageResponse.json();
        allProducts = allProducts.concat(nextPageData.productos);
      }
      // console.log('allProducts[0]: ', allProducts[0]);
      for (const product of allProducts) {
        const productInfo = await this.getOneProductSyscomById(product.producto_id, token);
        // const productInfo = await this.getOneProductSyscomById('206909', token);
        // console.log('productInfo: ', productInfo);
        // let product = allProducts[0];
        if (productInfo && productInfo.oneProductSyscomById) {
          const productTmp = productInfo.oneProductSyscomById
          product.especificaciones = [];
          product.especificacionesBullet = [];
          product.especificacionesBullet.push({ tipo: 'Caracteristicas', valor: productTmp.caracteristicas });
          if (productTmp && productTmp.recursos && productTmp.recursos.length > 0) {
            for (const recurso of productTmp.recursos) {
              product.especificaciones.push({ tipo: 'Recurso(' + recurso.recurso + ')', valor: recurso.path });
            }
          }
          // Imagenes
          if (productTmp.imagenes.length > 0) {
            product.pictures = [];
            product.sm_pictures = [];
            for (const pictureI of productTmp.imagenes) {
              if (pictureI !== '') {
                const pict: IPicture = {
                  width: '500',
                  height: '500',
                  url: pictureI.imagen
                };
                product.pictures.push(pict);
                const pict_sm: IPicture = {
                  width: '300',
                  height: '300',
                  url: pictureI.imagen
                };
                product.sm_pictures.push(pict_sm);
              }
            }
          }
        }
      }
      return {
        status: true,
        message: 'La lista de productos se ha generado correctamente',
        listProductsSyscomByBrand: allProducts
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        listProductsSyscomByBrand: null,
      };
    }
  }

  async getOneProductSyscomById(product_id: string = '', token: any) {
    try {
      const productId = this.getVariables().productId || product_id;
      if (!productId || productId === '') {
        return {
          status: false,
          message: 'Se requiere especificar el producto',
          listProductsSyscomByBrand: null,
        };
      }
      if (!token.status) {
        return {
          status: token.status,
          message: token.message,
          oneProductSyscomById: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/productos/' + productId;
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getTokenSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (response.status < 200 || response.status >= 300) {
        return {
          status: false,
          message: data.message || data.detail,
          oneProductSyscomById: null
        };
      }
      return {
        status: true,
        message: `El producto ${productId} se ha encontrado`,
        oneProductSyscomById: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        oneProductSyscomById: null,
      };
    }
  }

  async getMetodosPagosSyscom() {
    try {
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          metodosPagosSyscom: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/carrito/pago/';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getMetodosPagosSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          metodosPagosSyscom: null
        };
      }
      const metodosPagosSyscom: IMetodoPagoSyscom[] = data.map((item: any) => {
        const nombre: string = item.nombre;
        const metodosPago: any = item.metodo;
        const metodo: IMetodoPagoItemDetalle[] = Object.entries(metodosPago).map(([key, value]: [string, any]) => {
          return {
            nombre: key,
            titulo: value.titulo,
            codigo: value.codigo,
            descuento: value.descuento,
            tipo_cambio: value.tipo_cambio,
            plazo: value.plazo,
            forma: value.forma
          };
        });
        return { nombre, metodo };
      });
      return {
        status: true,
        message: `Los Metodos de pagos se han generado correctamente`,
        metodosPagosSyscom
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        metodosPagosSyscom: null,
      };
    }
  }

  async getFleterasSyscom() {
    try {
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          fleterasSyscom: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/carrito/fleteras/';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getFleterasSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          fleterasSyscom: null
        };
      }
      return {
        status: true,
        message: `Las fleteras se han generado correctamente`,
        fleterasSyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        fleterasSyscom: null,
      };
    }
  }

  async getCfdisSyscom() {
    try {
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          cfdisSyscom: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/carrito/cfdi/';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getCfdisSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          cfdisSyscom: null
        };
      }
      return {
        status: true,
        message: `Las fleteras se han generado correctamente`,
        cfdisSyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        cfdisSyscom: null,
      };
    }
  }

  quitarAcentos(texto: string): string {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  async getPaisSyscom(pais: string = '') {
    try {
      const paisName = this.getVariables().paisName || pais;
      if (!paisName || paisName === '') {
        return {
          status: false,
          message: 'Se requiere especificar el nombre del pais',
          paisSyscom: '',
        };
      }
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          paisSyscom: '',
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/carrito/paises';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getPaisSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          paisSyscom: ''
        };
      }
      const paisEncontrado = data.paises.find((pais: any) => this.quitarAcentos(pais.nombre.toLowerCase()) === paisName.toLowerCase());
      const status = paisEncontrado ? true : false;
      const message = paisEncontrado ? `El código del país ${paisName} se ha generado correctamente` : `El código del país ${paisName} no se ha encontrado`;
      const paisSyscom = paisEncontrado ? paisEncontrado.codigo : '';
      return {
        status,
        message,
        paisSyscom
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        paisSyscom: '',
      };
    }
  }

  async getEstadoByCP(codigoPostal: number = 0) {
    try {
      const cp = this.getVariables().cp || codigoPostal;
      if (!cp || cp <= 0) {
        return {
          status: false,
          message: 'Se requiere especificar el Codigo Postal',
          estadoByCP: '',
        };
      }
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          estadoByCP: '',
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/carrito/estados/' + cp;
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getEstadoByCP.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          estadoByCP: null
        };
      }
      if (!data.estado || data.estado.length <= 0) {
        return {
          status: false,
          message: `El estado para el CP ${cp} no se ha encontrado`,
          estadoByCP: ''
        };
      }
      return {
        status: true,
        message: `El estado para el CP ${cp} se ha generado correctamente`,
        estadoByCP: data.estado[0].codigo_estado
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        estadoByCP: '',
      };
    }
  }

  async getColoniaByCP(codigoPostal: number = 0, colonia: string = '') {
    try {
      const cp = this.getVariables().cp || codigoPostal;
      const coloniaName = this.getVariables().coloniaName || colonia;
      if (!cp || cp <= 0) {
        return {
          status: false,
          message: 'Se requiere especificar el Codigo Postal',
          coloniaByCP: null,
        };
      }
      if (!coloniaName || coloniaName === '') {
        return {
          status: false,
          message: 'Se requiere especificar la colonia',
          coloniaByCP: null,
        };
      }
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          coloniaByCP: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/carrito/colonias/' + cp;
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getEstadoByCP.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          coloniaByCP: null
        };
      }
      const coloniasSyscom = data.colonias;
      if (!coloniasSyscom) {
        return {
          status: false,
          message: `El codigo posta ${cp} no tiene cobertura`,
          coloniaByCP: ''
        };
      }
      const coloniasEncontradas = data.colonias.filter((colonia: any) => this.quitarAcentos(colonia.toLowerCase()) === this.quitarAcentos(coloniaName.toLowerCase()));
      if (!coloniasEncontradas || coloniasEncontradas.length <= 0) {
        return {
          status: false,
          message: `La colonia ${coloniaName} no tiene cobertura`,
          coloniaByCP: ''
        };
      }
      return {
        status: true,
        message: `El estado para el CP ${cp} se ha generado correctamente`,
        coloniaByCP: coloniasEncontradas[0]
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        coloniaByCP: null,
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
        logger.info('No se pudieron recuperar los productos del proveedor');
        return {
          status: false,
          message: 'No se pudieron recuperar los productos del proveedor.',
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
      function extraerPrimeraSeccion(titulo: string) {
        const secciones = titulo.split(/[\/|]/);
        return secciones[0].trim();
      }
      const branchOfficesSyscom: BranchOffices[] = [];
      let featured = false;
      itemData.id = item.producto_id;
      const titulo = extraerPrimeraSeccion(item.titulo);
      itemData.name = titulo;
      itemData.slug = slugify(titulo, { lower: true });
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

  async setOrderSyscom() {
    try {
      const orderSyscomInput = this.getVariables().orderSyscomInput;
      if (!orderSyscomInput) {
        return {
          status: false,
          message: 'Es necesario especificar los datos de la orden',
          saveOrderSyscom: null,
        };
      }
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          saveOrderSyscom: null,
        };
      }
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        },
        body: JSON.stringify({
          tipo_entrega: orderSyscomInput.tipo_entrega,
          direccion: orderSyscomInput.direccion,
          metodo_pago: orderSyscomInput.metodo_pago,
          fletera: orderSyscomInput.fletera,
          productos: orderSyscomInput.productos,
          moneda: orderSyscomInput.moneda,
          uso_cfdi: orderSyscomInput.uso_cfdi,
          tipo_pago: orderSyscomInput.tipo_pago,
          orden_compra: orderSyscomInput.orden_compra,
          ordenar: orderSyscomInput.ordenar,
          iva_frontera: orderSyscomInput.iva_frontera,
          forzar: orderSyscomInput.forzar,
          testmode: orderSyscomInput.testmode
        }),
        redirect: 'follow' as RequestRedirect
      };
      const url = 'https://developers.syscom.mx/api/v1/carrito/generar';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`setOrderSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          saveOrderSyscom: null
        };
      }
      return {
        status: true,
        message: `La orden se ha generado correctamente`,
        saveOrderSyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        saveOrderSyscom: null,
      };
    }
  }
}

export default ExternalSyscomService;