import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { IAlmacenes, IProductoCt, IAlmacenPromocion, IPromocion, IResponseCtsJsonProducts, IEspecificacion, IExistenciaAlmacenCT, IExistenciaAlmacen, IOrderCtResponseList, IAlmacen } from '../interfaces/suppliers/_CtsShippments.interface';
import { IBranchOffices, IPromociones, ISupplierProd } from '../interfaces/product.interface';

import logger from '../utils/logger';
import fetch from 'node-fetch';
import { Client, AccessOptions } from 'basic-ftp';
import fs from 'fs';
const xml2js = require('xml2js');
import ResolversOperationsService from './resolvers-operaciones.service';

import almacenesCt from './../json/ct_almacenes.json';
import ConfigsService from './config.service';
import { Db } from 'mongodb';
import { BranchOffices, Brands, Categorys, Descuentos, Especificacion, Picture, Product, SupplierProd, UnidadDeMedida } from '../models/product.models';
import slugify from 'slugify';

class ExternalCtsService extends ResolversOperationsService {
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

  /**
   * 
   * @returns TokenCt: Objeto enviado por Ct minutos.
   */
  async getTokenCt() {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'david.silva@daru.mx',
        cliente: 'VHA2391',
        rfc: 'DIN2206222D3'
      })
    };

    const url = 'http://connect.ctonline.mx:3001/cliente/token';
    const response = await fetch(url, options);
    logger.info(`getTokenCt.response: \n ${JSON.stringify(response)} \n`);
    const data = await response.json();
    logger.info(`getTokenCt.data: \n ${JSON.stringify(data)} \n`);
    if (data && data.codigo && data.codigo === '5033') {
      return {
        status: false,
        message: data.referencia,
        tokenCt: null
      };
    }
    const status = response.ok;
    const message = status ? 'El token se ha generado correctamente. data:' : 'Error en el servicio. ' + JSON.stringify(data);

    return {
      status,
      message,
      tokenCt: status ? data : null
    };
  }

  async getJsonProductsCt() {
    try {
      const jsonProductsCt = (await this.downloadFileFromFTP()).data;
      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        jsonProductsCt,
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        jsonProductsCt: null,
      };
    }
  }

  async getJsonProductsCtHP() {
    try {
      const jsonProductsCtHP = (await this.downloadHPFileFromFTP()).data;
      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        jsonProductsCtHP,
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        jsonProductsCtHP: null,
      };
    }
  }

  /**
  * 
  * @param variables 
  * @returns ResponseCts: Objeto de respuesta de la covertura.
  */
  async setShippingCtRates(variables: IVariables) {
    const { destinoCt, productosCt } = variables;
    const token = await this.getTokenCt();
    if (token && !token.status) {
      return {
        status: token.status,
        message: token.message,
        shippingCtRates: null
      };
    }

    const options = {
      method: 'POST',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destino: destinoCt,
        productos: productosCt
      })
    };

    const url = 'http://connect.ctonline.mx:3001/paqueteria/cotizacion';
    const response = await fetch(url, options);
    logger.info(`setShippingCtRates.response: \n ${JSON.stringify(response)} \n`);
    const data = await response.json();

    if (response.ok) {
      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        shippingCtRates: {
          codigo: data.codigo,
          mensaje: data.mensaje,
          referecia: data.referecia,
          respuesta: data.respuesta
        }
      }
    }

    return {
      status: false,
      message: 'Error en el servicio. ' + JSON.stringify(data),
      shippingCtRates: null
    };
  }

  buscarAlmacenesConExistencia(existenciaProducto: ISupplierProd, existenciaProductoCt: IExistenciaAlmacen[]): IExistenciaAlmacen[] {
    const { cantidad } = existenciaProducto;
    const almacenesConExistencia = existenciaProductoCt.filter((almacen) => {
      return almacen.existencia >= cantidad;
    });
    return almacenesConExistencia;
  }

  async getExistenciaProductoCt(variables: IVariables) {
    try {
      const token = await this.getTokenCt();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          existenciaProductoCt: null,
        };
      }
      const { existenciaProducto } = variables;
      if (!existenciaProducto) {
        return {
          status: true,
          message: 'No hubo cambio en los almacenes. Verificar API.',
          existenciaProductoCt: existenciaProducto,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'x-auth': token.tokenCt.token,
          'Content-Type': 'application/json',
        },
      };
      const url = 'http://connect.ctonline.mx:3001/existencia/' + existenciaProducto.codigo;
      const response = await fetch(url, options);
      logger.info(`getExistenciaProductoCt.response: \n ${JSON.stringify(response)} \n`);
      if (response.ok) {
        const data: IExistenciaAlmacenCT = await response.json();
        const existenciaProductoCt = Object.keys(data).map(key => ({
          key,
          existencia: data[key].existencia,
        }));

        if (existenciaProductoCt.length > 0) {
          const existenciaProductoCtData = existenciaProductoCt;
          const almacenesConExistencia = this.buscarAlmacenesConExistencia(existenciaProducto, existenciaProductoCtData);
          const almacenesCompletos = almacenesConExistencia.map((almacen) => {
            const almacenInfo = almacenesCt.find((info) => info.id === almacen.key);
            if (almacenInfo) {
              return {
                id: almacen.key,
                cantidad: almacen.existencia,
                name: almacenInfo.Sucursal,
                estado: almacenInfo.Estado,
                cp: almacenInfo.CP,
                latitud: almacenInfo.latitud,
                longitud: almacenInfo.longitud,
              };
            }
            return {} as IBranchOffices;
          }).filter((almacen): almacen is IBranchOffices => almacen !== null);
          existenciaProducto.branchOffices = almacenesCompletos;
        }
        return {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          existenciaProductoCt: existenciaProducto,
        };
      } else {
        return {
          status: false,
          message: 'Error en el servicio. url: ' + url + ', options: ' + options + ', response:' + response,
          existenciaProductoCt: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        existenciaProductoCt: null,
      };
    }
  }

  async getStockProductsCt() {
    try {
      const token = await this.getTokenCt();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          stockProductsCt: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'x-auth': token.tokenCt.token,
          'Content-Type': 'application/json',
        },
      };

      const url = 'http://connect.ctonline.mx:3001/existencia/promociones';
      const response = await fetch(url, options);
      logger.info(`getStockProductsCt.response: \n ${JSON.stringify(response)} \n`);

      if (response.ok) {
        const data: IProductoCt[] = await response.json();
        const stockProductsCt = data.map((product: IProductoCt) => {
          const almacenes = product.almacenes.map((almacenItem: IAlmacenes) => {
            const almacenPromocion: IAlmacenPromocion[] = [];

            for (const key in almacenItem) {
              if (key !== 'almacenes') {
                const valor = almacenItem[key as keyof IAlmacenes];
                if (typeof valor === 'number') {
                  almacenPromocion.push({
                    key,
                    value: valor,
                    promocionString: JSON.stringify(almacenItem)
                  });
                }
                // Puedes manejar el caso de IPromocion si es necesario
              }
            }
            return { almacenPromocion };
          });

          return {
            ...product,
            almacenes,
          };
        });

        return {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          stockProductsCt,
        };
      } else {
        return {
          status: false,
          message: 'Error en el servicio. ',
          stockProductsCt: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        stockProductsCt: null,
      };
    }
  }

  async getListProductsCt() {
    try {
      const token = await this.getTokenCt();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          stockProductsCt: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'x-auth': token.tokenCt.token,
          'Content-Type': 'application/json',
        },
      };

      const listProductsCt = await this.getProductsXml();
      logger.info(`getListProductsCt.listProductsCt.length: \n ${JSON.stringify(listProductsCt.length)} \n`);
      logger.info(`getListProductsCt.listProductsCt[1]: \n ${JSON.stringify(listProductsCt[1])} \n`);
      logger.info(`getListProductsCt.listProductsCt[listProductsCt.length-1]: \n ${JSON.stringify(listProductsCt[listProductsCt.length - 1])} \n`);

      const url = 'http://connect.ctonline.mx:3001/existencia/promociones';
      const response = await fetch(url, options);

      if (response.ok) {
        const data: IProductoCt[] = await response.json();
        logger.info(`getListProductsCt.promociones.data: \n ${JSON.stringify(data)} \n`);
        const stockProductsCt = data.map((product: IProductoCt) => {
          const almacenes = product.almacenes.map((almacenItem: IAlmacenes) => {
            const almacenPromocion: IAlmacenPromocion[] = [];
            for (const key in almacenItem) {
              if (key !== 'almacenes') {
                const valor = almacenItem[key as keyof IAlmacenes];
                if (typeof valor === 'number') {
                  almacenPromocion.push({
                    key,
                    value: valor,
                    promocionString: JSON.stringify(almacenItem)
                  });
                }
                // Puedes manejar el caso de IPromocion si es necesario
              }
            }
            return { almacenPromocion };
          });

          return {
            ...product,
            almacenes,
          };
        });
        logger.info(`stockProductsCt: \n ${JSON.stringify(stockProductsCt)} \n`);
        logger.info(`stockProductsCt.length: \n ${JSON.stringify(stockProductsCt.length)} \n`);
        logger.info(`stockProductsCt[1]: \n ${JSON.stringify(stockProductsCt[1])} \n`);
        logger.info(`stockProductsCt[stockProductsCt.length-1]: \n ${JSON.stringify(stockProductsCt[stockProductsCt.length - 1])} \n`);
  
        let i = 1;
        const excludedCategories = [
          'Caretas', 'Cubrebocas', 'Desinfectantes', 'Equipo', 'Termómetros', 'Acceso', 'Accesorios para seguridad', 'Camaras Deteccion',
          'Control de Acceso', 'Sensores', 'Tarjetas de Acceso', 'Timbres', 'Administrativo', 'Contabilidad', 'Nóminas', 'Timbres Fiscales',
          'Análogos', 'Video Conferencia', 'Accesorios de Papeleria', 'Articulos de Escritura',
          'Basico de Papeleria', 'Cabezales', 'Cuadernos', 'Papel', 'Papelería', 'Camaras Deteccion',
          'Apple', 'Accesorios para Apple', 'Adaptadores para Apple', 'Audífonos para Apple', 'Cables Lightning', 'iMac', 'iPad', 'MacBook'
        ];

        const db = this.db;
        const config = await new ConfigsService({}, { id: '1' }, { db }).details();
        // TODO Recuperar de la API los precios y continuar.
        logger.info(`getListProductsCt.config: \n ${JSON.stringify(config)} \n`);
        const stockMinimo = config.config.minimum_offer;
        const exchangeRate = config.config.exchange_rate;
        const productos: Product[] = [];
        for (const product of listProductsCt) {
          if (!excludedCategories.includes(product.subcategoria)) {
            stockProductsCt.forEach(async productFtp => {
              if (product.clave === productFtp.codigo) {
                const productTmp: IProductoCt = this.convertirPromocion(product);
                const itemData: Product = await this.setProduct('ct', productTmp, productFtp, null, stockMinimo, exchangeRate);
                if (itemData.id !== undefined) {
                  productos.push(itemData);
                }
              }
            });
          }
        }
        logger.info(`getListProductsCt.productos: \n ${JSON.stringify(productos)} \n`);
        return await {
          status: true,
          message: 'Productos listos para agregar.',
          productos
        }
      } else {
        return {
          status: false,
          message: 'Error en el servicio. ',
          stockProductsCt: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        stockProductsCt: null,
      };
    }
  }

  convertirPromocion(product: IProductoCt): IProductoCt {
    try {
      const data = product;

      const almacenes: IAlmacenes[] = data.almacenes.map((almacenData: any) => {
        const almacenPromocion = almacenData.almacenPromocion[0];

        const promocionString = almacenPromocion ? almacenPromocion.promocionString : null;

        let promocionObj: IPromocion = { precio: 0, porciento: 0, vigente: { ini: '', fin: '' } };
        if (promocionString) {
          const promocionData = JSON.parse(promocionString).promocion;
          if (promocionData) {
            promocionObj = {
              precio: promocionData.precio || 0,
              porciento: promocionData.porciento || 0,
              vigente: {
                ini: promocionData.vigente ? promocionData.vigente.ini : '',
                fin: promocionData.vigente ? promocionData.vigente.fin : '',
              },
            };
          }
        }

        const almacenObj: IAlmacen = {
          key: almacenPromocion ? almacenPromocion.key : '',
          value: almacenPromocion ? almacenPromocion.value : 0,
        };

        return {
          promociones: promocionObj ? [promocionObj] : [],
          almacen: almacenObj,
        };
      });

      const producto: IProductoCt = {
        precio: data.precio,
        moneda: data.moneda,
        almacenes,
        codigo: data.codigo,
      };

      return producto;
    } catch (error) {
      console.error('Error al convertir el objeto JSON:', error);
      return product;
    }
  }

  async getProductsXml() {
    let sMessage: string = '';
    let productsCtFtp: any[] = [];
    const productosCtXml = await this.getJsonProductsCt();
    if (productosCtXml && !productosCtXml.status) {
      sMessage = productosCtXml.message + '. ';
    }
    if (productosCtXml && productosCtXml.status && productosCtXml.jsonProductsCt && productosCtXml.jsonProductsCt.length > 0) {
      productsCtFtp = productsCtFtp.concat(productosCtXml.jsonProductsCt);
    }
    const productosCtXmlHp = await this.getJsonProductsCtHP();
    if (productosCtXmlHp && !productosCtXmlHp.status) {
      sMessage += productosCtXmlHp.message;
    }
    if (productosCtXmlHp && productosCtXmlHp.status && productosCtXmlHp.jsonProductsCtHP && productosCtXmlHp.jsonProductsCtHP.length > 0) {
      productsCtFtp = productsCtFtp.concat(productosCtXmlHp.jsonProductsCtHP);
    }
    return productsCtFtp;
  }

  async setProduct(proveedor: string, item: any, productJson: any = null, imagenes: any = null, stockMinimo: number, exchangeRate: number) {
    const utilidad: number = 1.08;
    const iva: number = 1.16;
    let itemData: Product = new Product();
    let unidad: UnidadDeMedida = new UnidadDeMedida();
    let b: Brands = new Brands();
    let c: Categorys = new Categorys();
    let s: SupplierProd = new SupplierProd();
    let bo: BranchOffices = new BranchOffices();
    let i: Picture = new Picture();
    let is: Picture = new Picture();
    let desc: Descuentos = new Descuentos();

    let disponible = 0;
    let price = 0;
    let salePrice = 0;

    disponible = 0;
    salePrice = 0;
    if (item.almacenes.length > 0) {
      const branchOfficesCt: BranchOffices[] = [];
      let featured = false;
      for (const element of item.almacenes) {
        const almacen = this.getAlmacenCant(element);
        if (almacen.cantidad >= stockMinimo) {
          disponible += almacen.cantidad;
          branchOfficesCt.push(almacen);
        }
      }
      // if (disponible >= this.stockMinimo) {                         // Si hay mas de 10 elementos disponibles
      if (branchOfficesCt.length > 0) {                         // Si hay mas de 10 elementos disponibles
        // Si hay promociones en los almacenes ocupa el primero y asigna el total de disponibilidad
        if (item.almacenes[0].promociones[0]) {
          const promo: IPromociones = {
            clave_promocion: '',
            descripcion_promocion: 'Producto con Descuento',
            inicio_promocion: item.almacenes[0].promociones[0].vigente.ini,
            vencimiento_promocion: item.almacenes[0].promociones[0].vigente.fin,
            disponible_en_promocion: item.almacenes[0].promociones[0].precio,
            porciento: item.almacenes[0].promociones[0].porciento
          }
          salePrice = item.almacenes[0].promociones[0].precio;
          featured = salePrice > 0 ? true : false;
          // // Se elimina hasta confirmar que es descuento.
          // if (salePrice === 0 && promo.porciento > 0) {
          //   const desc = parseFloat(item.almacenes[0].promociones[0].porciento) * parseFloat(item.precio) / 100;
          //   salePrice = item.precio - desc;
          // }
          itemData.promociones = promo;
        }
      }
      itemData.id = productJson.clave;
      itemData.name = productJson.nombre;
      itemData.slug = slugify(productJson.nombre, { lower: true });
      itemData.short_desc = productJson.descripcion_corta;
      if (item.moneda === 'USD') {
        itemData.price = parseFloat((parseFloat(item.precio) * exchangeRate * utilidad * iva).toFixed(2));
        itemData.sale_price = parseFloat((salePrice * exchangeRate * utilidad * iva).toFixed(2));
      } else {
        itemData.price = parseFloat((parseFloat(item.precio) * utilidad * iva).toFixed(2));
        itemData.sale_price = salePrice * utilidad * iva;
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
      itemData.sku = productJson.clave;
      itemData.upc = productJson.upc;
      itemData.ean = productJson.ean;
      itemData.partnumber = productJson.numParte;
      unidad.id = 'PZ';
      unidad.name = 'Pieza';
      unidad.slug = 'pieza';
      itemData.unidadDeMedida = unidad;
      // Categorias
      itemData.category = [];
      if (productJson.categoria) {
        const c = new Categorys();
        c.name = productJson.categoria;
        c.slug = slugify(productJson.categoria, { lower: true });
        itemData.category.push(c);
      } else {
        const c = new Categorys();
        c.name = '';
        c.slug = '';
        itemData.category.push(c);
      }
      //Subcategorias
      itemData.subCategory = [];
      if (productJson.subcategoria) {
        const c1 = new Categorys();
        c1.name = productJson.subcategoria;
        c1.slug = slugify(productJson.subcategoria, { lower: true });
        itemData.subCategory.push(c1);
      } else {
        const c1 = new Categorys();
        c1.name = '';
        c1.slug = '';
        itemData.subCategory.push(c1);
      }
      // Marcas
      itemData.brand = productJson.marca.toLowerCase();
      itemData.brands = [];
      b.name = productJson.marca;
      b.slug = slugify(productJson.marca, { lower: true });
      itemData.brands.push(b);
      // SupplierProd
      s.idProveedor = proveedor;
      s.codigo = productJson.clave;
      s.cantidad = stockMinimo;
      if (itemData.promociones && (
        itemData.promociones.disponible_en_promocion > 0 || itemData.promociones.porciento > 0)) {
        const precioPromocion = (parseFloat(item.precio) - (parseFloat(item.precio) * itemData.promociones.porciento / 100)).toFixed(2);
        s.price = parseFloat(item.precio);
        s.sale_price = parseFloat(item.almacenes[0].promociones[0].precio);
      } else {
        s.price = parseFloat(item.precio);
        s.sale_price = 0;
      }
      s.moneda = item.moneda;
      s.branchOffices = branchOfficesCt;
      s.category = new Categorys();
      s.subCategory = new Categorys();
      if (productJson.categoria) {
        s.category.slug = slugify(productJson.categoria, { lower: true });;
        s.category.name = productJson.categoria;
      }
      if (productJson.subcategoria) {
        s.subCategory.slug = slugify(productJson.subcategoria, { lower: true });;
        s.subCategory.name = productJson.subcategoria;
      }
      itemData.suppliersProd = s;
      itemData.model = productJson.modelo;
      // Imagenes
      itemData.pictures = [];
      i.width = '600';
      i.height = '600';
      i.url = productJson.imagen;
      itemData.pictures.push(i);
      // Imagenes pequeñas
      itemData.sm_pictures = [];
      is.width = '300';
      is.height = '300';
      is.url = productJson.imagen;
      itemData.variants = [];
      itemData.sm_pictures.push(is);
      itemData.especificaciones = [];
      if (productJson.especificaciones && productJson.especificaciones.length > 0) {
        for (const e of productJson.especificaciones) {
          const espec: Especificacion = new Especificacion();
          espec.tipo = e.tipo;
          espec.valor = e.valor;
          itemData.especificaciones.push(espec);
        }
      }
      // // Para validar un producto en depuracion.
      // if (productJson.numParte === 'TN630') {
      //   console.log('promo: ', promo)
      //   console.log('productJson: ', productJson)
      //   console.log('item: ', item)
      //   console.log('itemData: ', itemData)
      // }
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

  getAlmacenCant(branch: any): BranchOffices {
    const almacen = new BranchOffices();
    const almacenEstado = this.getCtAlmacenes(branch.almacen.key);
    almacen.id = almacenEstado.id.toString();
    almacen.name = almacenEstado.Sucursal;
    almacen.estado = almacenEstado.Estado;
    almacen.cp = almacenEstado.CP;
    almacen.latitud = almacenEstado.latitud;
    almacen.longitud = almacenEstado.longitud;
    almacen.cantidad = branch.almacen.value;
    return almacen;
  }

  getCtAlmacenes(id: string): any {
    const ctAlmacenes = almacenesCt;
    const almacen = ctAlmacenes.filter(almacen => almacen.id === id);
    if (almacen.length > 0) {
      const sucursal = almacen.map(element => element);
      return sucursal[0];
    }
    return '';
  }

  formatPromocion(promocion: IPromocion): string {
    return `Precio: ${promocion.precio}, Vigencia: ${promocion.vigente.ini} a ${promocion.vigente.fin}`;
  }

  async setOrderCt(variables: IVariables) {
    const { idPedido, almacen, tipoPago, guiaConnect, envio, producto, cfdi } = variables;
    const token = await this.getTokenCt();
    if (token && !token.status) {
      return {
        status: token.status,
        message: token.message,
        orderCt: null,
      };
    }
    const options = {
      method: 'POST',
      headers: {
        'x-auth': token.tokenCt.token,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idPedido,
        almacen,
        tipoPago,
        guiaConnect,
        envio,
        producto: producto,
        cfdi
      })
    };
    const url = 'http://connect.ctonline.mx:3001/pedido';
    const response = await fetch(url, options);
    logger.info(`setOrderCt.response: \n ${JSON.stringify(response)} \n`);
    const data = await response.json();
    logger.info(`setOrderCt.data: \n ${JSON.stringify(data)} \n`);
    if (data && data.length > 0 && data[0].respuestaCT) {
      if (data[0].respuestaCT.errores && data[0].respuestaCT.errores.length <= 0) {
        return {
          status: true,
          message: 'El pedido se ha creado de manera satisfactoria',
          orderCt: {
            pedidoWeb: data[0].respuestaCT.pedidoWeb,
            fecha: data[0].respuestaCT.fecha,
            tipoDeCambio: data[0].respuestaCT.tipoDeCambio,
            estatus: data[0].respuestaCT.estatus,
            errores: data[0].respuestaCT.errores,
          }
        }
      } else {
        return {
          status: false,
          message: 'Hay un error en la generacion del pedido.',
          orderCt: {
            pedidoWeb: data[0].respuestaCT.pedidoWeb,
            fecha: data[0].respuestaCT.fecha,
            tipoDeCambio: data[0].respuestaCT.tipoDeCambio,
            estatus: data[0].respuestaCT.estatus,
            errores: data[0].respuestaCT.errores,
          }
        }
      }
    }
    return {
      status: false,
      message: 'Error en el servicio. options: ' + JSON.stringify(options) + ', data: ' + JSON.stringify(data),
      orderCt: null
    };
  }

  async setConfirmOrderCt(variables: IVariables) {
    const { folio } = variables;
    const token = await this.getTokenCt();
    if (token && !token.status) {
      return {
        status: token.status,
        message: token.message,
        confirmOrderCt: null,
      };
    }
    const options = {
      method: 'POST',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        folio
      })
    };

    const url = `http://connect.ctonline.mx:3001/pedido/confirmar`;
    const response = await fetch(url, options);
    logger.info(`setConfirmOrderCt.response: \n ${JSON.stringify(response)} \n`);
    const data = await response.json();
    logger.info(`setConfirmOrderCt.data: \n ${JSON.stringify(data)} \n`);

    const status = response.ok;
    const message = status ? 'La información que hemos enviado se ha cargado correctamente' : `Error en el servicio. ${JSON.stringify(data)}`;

    return {
      status,
      message,
      confirmOrderCt: status ? {
        okCode: data.okCode,
        okMessage: data.okMessage,
        okReference: data.okReference
      } : null
    };
  }

  async getListOrderCt() {
    const token = await this.getTokenCt();
    if (token && !token.status) {
      return {
        status: token.status,
        message: token.message,
        listOrdersCt: null,
      };
    }
    const options = {
      method: 'GET',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      }
    };

    const url = 'http://connect.ctonline.mx:3001/pedido/listar';
    const response = await fetch(url, options);
    logger.info(`getListOrderCt.response: \n ${JSON.stringify(response)} \n`);
    const data = await response.json();

    if (response.ok) {
      const listOrdersCt = data
        .map((order: IOrderCtResponseList) => ({
          idPedido: order.idPedido,
          almacen: order.almacen,
          tipoPago: order.tipoPago,
          guiaConnect: order.guiaConnect,
          envio: order.envio,
          producto: order.producto,
          respuestaCT: order.respuestaCT
        }))
        .sort((a: IOrderCtResponseList, b: IOrderCtResponseList) => {
          const fechaA = a.respuestaCT && a.respuestaCT.length > 0 ? new Date(a.respuestaCT[0].fecha) : null;
          const fechaB = b.respuestaCT && b.respuestaCT.length > 0 ? new Date(b.respuestaCT[0].fecha) : null;
          return (fechaA?.getTime() ?? 0) - (fechaB?.getTime() ?? 0);
        });

      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        listOrdersCt
      };
    }

    return {
      status: false,
      message: 'Error en el servicio. ' + JSON.stringify(data),
      listOrdersCt: null
    };
  }

  async getStatusOrderCt(variables: IVariables) {
    const { folio } = variables;
    const token = await this.getTokenCt();
    if (token && !token.status) {
      return {
        status: token.status,
        message: token.message,
        statusOrdersCt: null,
      };
    }
    const options = {
      method: 'GET',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      }
    };

    const url = `http://connect.ctonline.mx:3001/pedido/estatus/${folio}`;
    const response = await fetch(url, options);
    const data = await response.json();
    logger.info(`getStatusOrderCt.response.data: \n ${JSON.stringify(data)} \n`);

    const status = response.ok;
    const message = status ? 'La información que hemos pedido se ha cargado correctamente' : `Error en el servicio. ${JSON.stringify(data)}`;

    return {
      status,
      message,
      statusOrdersCt: status ? {
        status: data.status ? data.status : '',
        folio: data.folio ? data.folio : '',
        guias: data.guias ? data.guias : [],
        producto: data.producto ? data.producto : []
      } : null
    };
  }

  async getDetailOrderCt(variables: IVariables) {
    const { folio } = variables;
    const token = await this.getTokenCt();
    if (token && !token.status) {
      return {
        status: token.status,
        message: token.message,
        detailOrdersCt: null,
      };
    }
    const options = {
      method: 'GET',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      }
    };

    const url = `http://connect.ctonline.mx:3001/pedido/detalle/${folio}`;
    const response = await fetch(url, options);
    logger.info(`getDetailOrderCt.response: \n ${JSON.stringify(response)} \n`);
    const data = await response.json();

    const status = response.ok;
    const message = status ? 'La información que hemos pedido se ha cargado correctamente' : `Error en el servicio. ${JSON.stringify(data)}`;

    return {
      status,
      message,
      detailOrdersCt: status ? {
        idPedido: data[0].idPedido,
        almacen: data[0].almacen,
        tipoPago: data[0].tipoPago,
        guiaConnect: data[0].guiaConnect,
        envio: data[0].envio,
        productoCt: data[0].producto,
        respuestaCT: data[0].respuestaCT
      } : null
    };
  }

  async getVolProductCt(variables: IVariables) {
    const { codigo } = variables;
    const token = await this.getTokenCt();
    if (token && !token.status) {
      return {
        status: token.status,
        message: token.message,
        volProductCt: null,
      };
    }
    const options = {
      method: 'GET',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      }
    };

    const url = `http://connect.ctonline.mx:3001/paqueteria/volumetria/${codigo}`;
    const response = await fetch(url, options);
    logger.info(`getVolProductCt.response: \n ${JSON.stringify(response)} \n`);
    const data = await response.json();

    const status = response.ok;
    const message = status ? 'La información que hemos pedido se ha cargado correctamente' : `Error en el servicio. ${JSON.stringify(data)}`;

    return {
      status,
      message,
      volProductCt: status ? {
        peso: data[0].peso,
        largo: data[0].largo,
        alto: data[0].alto,
        ancho: data[0].ancho,
        UPC: data[0].UPC,
        EAN: data[0].EAN
      } : null
    };
  }

  async downloadFileFromFTP() {
    const client = new Client();
    client.ftp.verbose = true; // Activa para ver información detallada en la consola
    try {
      const accessOptions: AccessOptions = {
        host: '216.70.82.104',
        user: 'VHA0990',
        password: 'PtZ9hAXJnkJInZXReEwN',
      };
      client.ftp.socket.setTimeout(30000);
      await client.access(accessOptions);
      const remoteFilePath = '/catalogo_xml/productos.xml';
      const localFilePath = './uploads/files/productos.xml';
      await client.downloadTo(localFilePath, remoteFilePath);
      // Leer y enviar el xml.
      const fileContent = fs.readFileSync(localFilePath, 'utf-8');
      const data = await this.parseXmlToJson(fileContent, 'productos_especiales_VHA2391.xml');
      const products: IResponseCtsJsonProducts[] = [];
      let i = 0;
      for (const prod of data) {
        i += 1;
        const newEspecificaciones: IEspecificacion[] = [];
        // Verifica si 'especificacion' existe y no es nulo
        if (prod.especificacion && typeof prod.especificacion === 'object') {
          // Convierte las propiedades del objeto en un array de [clave, valor]
          const especificacionArray = Object.entries(prod.especificacion);
          // Itera sobre el array resultante
          for (const [clave, valor] of especificacionArray) {
            if (newEspecificaciones.length < 5) {
              // Comprobación de tipo (type assertion) para 'valor'
              const valorEspecifico = valor as { tipo: string; valor: string };
              // Crea una nueva especificación
              const newEspecificacion: IEspecificacion = {
                tipo: valorEspecifico.tipo,
                valor: valorEspecifico.valor
              };
              // Agrega la nueva especificación al array
              newEspecificaciones.push(newEspecificacion);
            } else {
              // Si ya hay 5 especificaciones, sal del bucle
              break;
            }
          }
          // } else {
          //   console.error("La propiedad 'especificacion' no es un objeto iterable.");
          //   console.log('prod: ', prod);
        }
        const newProduct: IResponseCtsJsonProducts = {
          idProducto: i,
          clave: prod.clave,
          numParte: prod.no_parte,
          nombre: prod.descripcion_corta,
          modelo: prod.modelo,
          idMarca: prod.idMarca,
          marca: prod.marca,
          idSubCategoria: prod.idSubCategoria,
          subcategoria: prod.subcategoria,
          idCategoria: prod.idCategoria,
          categoria: prod.categoria,
          descripcion_corta: '(' + prod.nombre + ') - ' + prod.descripcion_corta,
          ean: prod.ean,
          upc: prod.upc,
          sustituto: prod.sustituto,
          activo: prod.estatus === 'Activo' ? 1 : 0,
          protegido: 0,
          existencia: prod.existencia,
          precio: prod.precio,
          moneda: prod.moneda,
          tipoCambio: prod.tipoCambio,
          especificaciones: newEspecificaciones,
          promociones: prod.promociones,
          imagen: prod.imagen,
        };
        products.push(newProduct);
      }
      return await {
        status: true,
        mesage: 'Se ha descargado correctamente el xml.',
        data: products
      };
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      return await {
        status: false,
        mesage: `Error al descargar el archivo: ${error}`,
        data: null
      };
    } finally {
      client.close();
    }
  }

  async downloadHPFileFromFTP() {
    const client = new Client();
    client.ftp.verbose = true; // Activa para ver información detallada en la consola
    try {
      const accessOptions: AccessOptions = {
        host: '216.70.82.104',
        user: 'VHA2391_promos',
        password: 'AQF97wMYMoRBntp7ES0i',
      };
      client.ftp.socket.setTimeout(30000);
      await client.access(accessOptions);
      const remoteFilePath = '/catalogo_xml/productos_especiales_VHA2391.xml';
      const localFilePath = './uploads/files/productos_especiales_VHA2391.xml';
      await client.downloadTo(localFilePath, remoteFilePath);
      // Leer y enviar el xml.
      const fileContent = fs.readFileSync(localFilePath, 'utf-8');
      const data = await this.parseXmlToJson(fileContent, 'productos_especiales_VHA2391.xml');
      const products: IResponseCtsJsonProducts[] = [];
      let i = 0;
      for (const prod of data) {
        i += 1;
        const newEspecificaciones: IEspecificacion[] = [];
        // Verifica si 'especificacion' existe y no es nulo
        if (prod.especificacion && typeof prod.especificacion === 'object') {
          // Convierte las propiedades del objeto en un array de [clave, valor]
          const especificacionArray = Object.entries(prod.especificacion);
          // Itera sobre el array resultante
          for (const [clave, valor] of especificacionArray) {
            if (newEspecificaciones.length < 5) {
              // Comprobación de tipo (type assertion) para 'valor'
              const valorEspecifico = valor as { tipo: string; valor: string };
              // Crea una nueva especificación
              const newEspecificacion: IEspecificacion = {
                tipo: valorEspecifico.tipo,
                valor: valorEspecifico.valor
              };
              // Agrega la nueva especificación al array
              newEspecificaciones.push(newEspecificacion);
            } else {
              // Si ya hay 5 especificaciones, sal del bucle
              break;
            }
          }
          // } else {
          //   console.error("La propiedad 'especificacion' no es un objeto iterable.");
          //   console.log('prod: ', prod);
        }
        const newProduct: IResponseCtsJsonProducts = {
          idProducto: i,
          clave: prod.clave,
          numParte: prod.no_parte,
          nombre: prod.descripcion_corta,
          modelo: prod.modelo,
          idMarca: prod.idMarca,
          marca: prod.marca,
          idSubCategoria: prod.idSubCategoria,
          subcategoria: prod.subcategoria,
          idCategoria: prod.idCategoria,
          categoria: prod.categoria,
          descripcion_corta: '(' + prod.nombre + ') - ' + prod.descripcion_corta,
          ean: prod.ean,
          upc: prod.upc,
          sustituto: prod.sustituto,
          activo: prod.estatus === 'Activo' ? 1 : 0,
          protegido: 0,
          existencia: prod.existencia,
          precio: prod.precio,
          moneda: prod.moneda,
          tipoCambio: prod.tipoCambio,
          especificaciones: newEspecificaciones,
          promociones: prod.promociones,
          imagen: prod.imagen,
        };
        products.push(newProduct);
      }
      return await {
        status: true,
        mesage: 'Se ha descargado correctamente el xml.',
        data: products
      };
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      return await {
        status: false,
        mesage: `Error al descargar el archivo: ${error}`,
        data: null
      };
    } finally {
      client.close();
    }
  }

  async parseXmlToJson(xml: string, catalog: string): Promise<any> {
    try {
      const result = await xml2js.parseStringPromise(xml, { explicitArray: false });
      switch (catalog) {
        case 'productos_especiales_VHA2391.xml':
          return result.Articulo.Producto;
        default:
          throw new Error('Catálogo no válido');
      }
    } catch (error) {
      throw new Error('El contenido XML no es válido');
    }
  }
}


export default ExternalCtsService;
