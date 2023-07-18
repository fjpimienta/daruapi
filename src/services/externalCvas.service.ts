import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import fetch, { Response } from 'node-fetch';
const xml2js = require('xml2js');

class ExternalCvasService {

  constructor(private root: object, private variables: object, private context: IContextData) {}

  async getTokenCva() {
    return {
      status: true,
      message: 'El token se ha generado correctamente.',
      tokenCva: { token: '7ee694a5bae5098487a5a8b9d8392666' }
    };
  }

  async getShippingCvaRates(variables: IVariables) {
    const { paqueteria, cp, cp_sucursal, productosCva } = variables;
    const token = await this.getTokenCva();
    const options = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.tokenCva.token}`
      },
      body: JSON.stringify({ paqueteria, cp, cp_sucursal, productos: productosCva })
    };
    const result = await fetch('https://www.grupocva.com/api/paqueteria/', options);
    const data = await result.json();
    if (result.ok) {
      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        shippingCvaRates: {
          result: data.result,
          cotizacion: data.cotizacion
        }
      };
    }
    return {
      status: false,
      message: `Error en el servicio. ${JSON.stringify(data)}`,
      shippingCvaRates: null
    };
  }

  async getListOrdersCva() {
    const wsdl = 'ListaPedidos';
    const options = {
      method: 'POST',
      headers: {
        'Accept-Charset': 'UTF-8',
        'Content-Type': 'text/xml; charset=utf-8'
      },
      params: {
        "wsdl": wsdl
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
          <soap:Body>
            <${wsdl} xmlns="https://www.grupocva.com/pedidos_web/">
              <Usuario>admin73766</Usuario>
              <PWD>VCTRNZ1EFOmR</PWD>
            </${wsdl}>
          </soap:Body>
        </soap:Envelope>`
    };
    const result = await fetch('https://www.grupocva.com/pedidos_web/pedidos_ws_cva.php', options);
    const content = await result.text();
    const data = await this.parseXmlToJson(content, wsdl);
    const pedidos = data;
    if (result.ok) {
      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        listOrdersCva: pedidos
      };
    }
    return {
      status: false,
      message: 'Error en el servicio.',
      listOrdersCva: null
    };
  }

  async parseXmlToJson(xml: string, catalog: string): Promise<any> {
    try {
      const result = await xml2js.parseStringPromise(xml, { explicitArray: false });
      const pedidosXml = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:ListaPedidosResponse']['pedidos'];
      const pedidosXmlContent = pedidosXml._;
      if (typeof pedidosXmlContent === 'string') {
        const pedidosResult = await xml2js.parseStringPromise(pedidosXmlContent, { explicitArray: false });
        const listOrdersCva = pedidosResult.PEDIDOS.pedido;
        return listOrdersCva;
      } else {
        throw new Error('El contenido XML no es válido');
      }
    } catch (error) {
      throw new Error('El contenido XML no es válido');
    }
  }

}

export default ExternalCvasService;
