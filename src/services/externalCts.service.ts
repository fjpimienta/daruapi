import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { IAlmacenes, IOrderCtResponse, IProductoCt, IAlmacenPromocion, IPromocion, IResponseCtsJsonProducts, IEspecificacion, IExistenciaAlmacenCT, IExistenciaAlmacen } from '../interfaces/suppliers/_CtsShippments.interface';
import { IBranchOffices, ISupplierProd } from '../interfaces/product.interface';

import logger from '../utils/logger';
import fetch from 'node-fetch';
import { Client, AccessOptions } from 'basic-ftp';
import fs from 'fs';
const xml2js = require('xml2js');
import ResolversOperationsService from './resolvers-operaciones.service';

import almacenesCt from './../../uploads/json/ct_almacenes.json';


class ExternalCtsService extends ResolversOperationsService {
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
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
    const data = await response.json();
    const dataString = JSON.stringify(data);
    logger.info(`GraphQL Response: ${dataString}`);
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
    const result = await fetch(url, options);
    const data = await result.json();
    const dataString = JSON.stringify(data);
    logger.info(`GraphQL Response: ${dataString}`);

    if (result.ok) {
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
      const result = await fetch(url, options);
      if (result.ok) {
        const data: IExistenciaAlmacenCT = await result.json();
        const dataString = JSON.stringify(data);
        logger.info(`GraphQL Response: ${dataString}`);
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
          message: 'Error en el servicio. url: ' + url + ', options: ' + options + ', result:' + result,
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

      const options = {
        method: 'GET',
        headers: {
          'x-auth': token.tokenCt.token,
          'Content-Type': 'application/json',
        },
      };

      const url = 'http://connect.ctonline.mx:3001/existencia/promociones';
      const result = await fetch(url, options);

      if (result.ok) {
        const data: IProductoCt[] = await result.json();
        const dataString = JSON.stringify(data);
        logger.info(`GraphQL Response: ${dataString}`);

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

  formatPromocion(promocion: IPromocion): string {
    return `Precio: ${promocion.precio}, Vigencia: ${promocion.vigente.ini} a ${promocion.vigente.fin}`;
  }

  async setOrderCt(variables: IVariables) {
    const { idPedido, almacen, tipoPago, guiaConnect, envio, productoCt, cfdi } = variables;
    const token = await this.getTokenCt();

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
        producto: productoCt,
        cfdi
      })
    };

    const url = 'http://connect.ctonline.mx:3001/pedido';
    const result = await fetch(url, options);
    const data = await result.json();
    const dataString = JSON.stringify(data);
    logger.info(`GraphQL Response: ${dataString}`);

    if (result.ok) {
      return {
        status: true,
        message: 'La información que hemos enviado se ha cargado correctamente',
        orderCt: {
          pedidoWeb: data[0].respuestaCT.pedidoWeb,
          fecha: data[0].respuestaCT.fecha,
          tipoDeCambio: data[0].respuestaCT.tipoDeCambio,
          estatus: data[0].respuestaCT.estatus,
          errores: data[0].respuestaCT.errores,
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
    const result = await fetch(url, options);
    const data = await result.json();
    const dataString = JSON.stringify(data);
    logger.info(`GraphQL Response: ${dataString}`);

    const status = result.ok;
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

    const options = {
      method: 'GET',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      }
    };

    const url = 'http://connect.ctonline.mx:3001/pedido/listar';
    const response = await fetch(url, options);
    const data = await response.json();
    const dataString = JSON.stringify(data);
    logger.info(`GraphQL Response: ${dataString}`);

    if (response.ok) {
      const listOrdersCt = data
        .map((order: IOrderCtResponse) => ({
          idPedido: order.idPedido,
          almacen: order.almacen,
          tipoPago: order.tipoPago,
          guiaConnect: order.guiaConnect,
          envio: order.envio,
          productoCt: order.productoCt,
          respuestaCT: order.respuestaCT
        }))
        .sort((a: IOrderCtResponse, b: IOrderCtResponse) => {
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

    const options = {
      method: 'GET',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      }
    };

    const url = `http://connect.ctonline.mx:3001/pedido/estatus/${folio}`;
    const result = await fetch(url, options);
    const data = await result.json();
    const dataString = JSON.stringify(data);
    logger.info(`GraphQL Response: ${dataString}`);

    const status = result.ok;
    const message = status ? 'La información que hemos pedido se ha cargado correctamente' : `Error en el servicio. ${JSON.stringify(data)}`;

    return {
      status,
      message,
      statusOrdersCt: status ? {
        status: data.status ? data.status : '',
        folio: data.folio ? data.folio : '',
        guias: data.guias ? data.guias : []
      } : null
    };
  }

  async getDetailOrderCt(variables: IVariables) {
    const { folio } = variables;
    const token = await this.getTokenCt();

    const options = {
      method: 'GET',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      }
    };

    const url = `http://connect.ctonline.mx:3001/pedido/detalle/${folio}`;
    const result = await fetch(url, options);
    const data = await result.json();
    const dataString = JSON.stringify(data);
    logger.info(`GraphQL Response: ${dataString}`);

    const status = result.ok;
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

    const options = {
      method: 'GET',
      headers: {
        'x-auth': token.tokenCt.token,
        'Content-Type': 'application/json'
      }
    };

    const url = `http://connect.ctonline.mx:3001/paqueteria/volumetria/${codigo}`;
    const result = await fetch(url, options);
    const data = await result.json();
    const dataString = JSON.stringify(data);
    logger.info(`GraphQL Response: ${dataString}`);

    const status = result.ok;
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
      await client.access(accessOptions);
      const remoteFilePath = '/catalogo_xml/productos.json';
      const localFilePath = './uploads/files/productos.json';
      await client.downloadTo(localFilePath, remoteFilePath);
      // Leer y enviar el json.
      const fileContent = fs.readFileSync(localFilePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      return await {
        status: true,
        mesage: 'Se ha descargado correctamente el json.',
        data: jsonData
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
      // Leer y enviar el json.
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
        } else {
          console.error("La propiedad 'especificacion' no es un objeto iterable.");
        }
        const newProduct: IResponseCtsJsonProducts = {
          idProducto: i,
          clave: prod.clave,
          numParte: prod.no_parte,
          nombre: prod.nombre,
          modelo: prod.modelo,
          idMarca: prod.idMarca,
          marca: prod.marca,
          idSubCategoria: prod.idSubCategoria,
          subcategoria: prod.subcategoria,
          idCategoria: prod.idCategoria,
          categoria: prod.categoria,
          descripcion_corta: prod.descripcion_corta,
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

      // console.log('products: ', products);

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
