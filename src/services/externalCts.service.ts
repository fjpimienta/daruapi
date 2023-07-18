import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import { IOrderCtResponse } from '../interfaces/suppliers/_CtsShippments.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import fetch from 'node-fetch';

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
    const status = response.ok;
    const message = status ? 'El token se ha generado correctamente. data:' : 'Error en el servicio. ' + JSON.stringify(data);

    return {
      status,
      message,
      tokenCt: status ? data : null
    };
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

    console.log('options: ', options);
    const url = 'http://connect.ctonline.mx:3001/paqueteria/cotizacion';
    const result = await fetch(url, options);
    const data = await result.json();

    if (result.ok) {
      return {
        status: true,
        message: 'La información que hemos enviado se ha cargado correctamente',
        orderCt: {
          codigo: data.codigo,
          mensaje: data.mensaje,
          referencia: data.referencia,
          respuesta: data.respuesta
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

    const status = result.ok;
    const message = status ? 'La información que hemos enviado se ha cargado correctamente' : `Error en el servicio. ${JSON.stringify(data)}`;

    console.log('data: ', data);
    console.log('options: ', options);
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

    if (response.ok) {
      const listOrdersCt = data
        .map((order: IOrderCtResponse) => ({
          idPedido: order.idPedido,
          almacen: order.almacen,
          tipoPago: order.tipoPago,
          guiaConnect: order.guiaConnect,
          envio: order.envio,
          producto: order.producto,
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

    const status = result.ok;
    const message = status ? 'La información que hemos pedido se ha cargado correctamente' : `Error en el servicio. ${JSON.stringify(data)}`;

    return {
      status,
      message,
      statusOrdersCt: status ? {
        status: data.status,
        folio: data.folio
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
        producto: data[0].producto,
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
}

export default ExternalCtsService;
