import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import fetch, { Response } from 'node-fetch';
const xml2js = require('xml2js');
const decode = require('he');

class ExternalCvasService {

  constructor(private root: object, private variables: object, private context: IContextData) { }

  async getTokenCva() {
    const token = '7ee694a5bae5098487a5a8b9d8392666';

    return {
      status: true,
      message: 'El token se ha generado correctamente.',
      tokenCva: { token }
    };
  }

  async setOrderCva(variables: IVariables) {
    const { pedidoCva } = variables;
    const wsdl = 'PedidoWeb';
    let soapProducts = '';
    pedidoCva?.productos?.forEach(product => {
      soapProducts += `&lt;productos&gt;
      &lt;producto&gt;
        &lt;clave&gt;${product.clave}&lt;/clave&gt;
        &lt;cantidad&gt;${product.cantidad}&lt;/cantidad&gt;
    &lt;/producto&gt;
    &lt;/productos&gt;`;
    });
    const soapDetail = `<XMLOC xsi:type="xsd:string">
        &lt;PEDIDO&gt;
        &lt;NumOC&gt;${pedidoCva?.NumOC}&lt;/NumOC&gt;
        &lt;Paqueteria&gt;${pedidoCva?.Paqueteria}&lt;/Paqueteria&gt;
        &lt;CodigoSucursal&gt;${pedidoCva?.CodigoSucursal}&lt;/CodigoSucursal&gt;
        &lt;PedidoBO&gt;${pedidoCva?.PedidoBO}&lt;/PedidoBO&gt;
        &lt;Observaciones&gt;${pedidoCva?.Observaciones}&lt;/Observaciones&gt;
        ${soapProducts}
        &lt;TipoFlete&gt;${pedidoCva?.TipoFlete}&lt;/TipoFlete&gt;
        &lt;Calle&gt;${pedidoCva?.Calle}&lt;/Calle&gt;
        &lt;Numero&gt;${pedidoCva?.Numero}&lt;/Numero&gt;
        &lt;NumeroInt&gt;${pedidoCva?.NumeroInt}&lt;/NumeroInt&gt;
        &lt;CP&gt;${pedidoCva?.CP}&lt;/CP&gt;
        &lt;Colonia&gt;${pedidoCva?.Colonia}&lt;/Colonia&gt;
        &lt;Estado&gt;${pedidoCva?.Estado}&lt;/Estado&gt;
        &lt;Ciudad&gt;${pedidoCva?.Ciudad}&lt;/Ciudad&gt;
        &lt;Atencion&gt;${pedidoCva?.Atencion}&lt;/Atencion&gt;
        &lt;/PEDIDO&gt;
    </XMLOC>`;

    const token = await this.getTokenCva();

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
          <${wsdl} xmlns="urn:PedidoWebwsdl#PedidoWeb">
            <Usuario>admin73766</Usuario>
            <PWD>VCTRNZ1EFOmR</PWD>
            ${soapDetail}
          </${wsdl}>
        </soap:Body>
      </soap:Envelope>`
    };

    const url = 'https://www.grupocva.com/pedidos_web/pedidos_ws_cva.php';
    const response = await fetch(url, options);
    const content = await response.text();
    const data = await this.parseXmlToJson(content, wsdl);
    console.log('data: ', data);

    if (response.ok) {
      return {
        status: true,
        message: 'La información que hemos enviado se ha cargado correctamente',
        orderCva: {
          error: data.error,
          estado: data.estado,
          pedido: data.pedido,
          total: data.total,
          agentemail: data.agentemail,
          almacenmail: data.almacenmail
        }
      }
    }

    return {
      status: false,
      message: 'Error en el servicio. options: ' + JSON.stringify(options) + ', data: ' + JSON.stringify(data),
      orderCva: null
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
    const response = await fetch('https://www.grupocva.com/api/paqueteria/', options);
    const data = await response.json();
    if (response.ok) {
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

  async getConsultaOrderCva(variables: IVariables) {
    const { pedido } = variables;
    const wsdl = 'ConsultaPedido';
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
              <PEDIDO>${pedido}</PEDIDO>
            </${wsdl}>
          </soap:Body>
        </soap:Envelope>`
    };
    const response = await fetch('https://www.grupocva.com/pedidos_web/pedidos_ws_cva.php', options);
    const content = await response.text();
    const data = await this.parseXmlToJson(content, wsdl);
    const pedidos = data;
    if (response.ok) {
      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        consultaOrderCva: {
          Estatus: pedidos.Estatus,
          Factura: pedidos.Factura,
          Total: pedidos.Total,
          Moneda: pedidos.Moneda,
          FechaPedido: pedidos.FechaPedido,
          NumOC: pedidos.NumOC,
          Almacen: pedidos.Almacen,
          Observaciones: pedidos.Observaciones,
          CalleEnvio: pedidos.CalleEnvio,
          NumeroEnvio: pedidos.NumeroEnvio,
          NumeroIntEnvio: pedidos.NumeroIntEnvio,
          ColoniaEnvio: pedidos.ColoniaEnvio,
          CPEnvio: pedidos.CPEnvio,
          EstadoEnvio: pedidos.EstadoEnvio,
          CiudadEnvio: pedidos.CiudadEnvio,
          Atencion: pedidos.Atencion,
          Flete: pedidos.Flete,
          TipoEnvio: pedidos.TipoEnvio,
          Paqueteria: pedidos.Paqueteria,
          Guia: pedidos.Guia,
          productos: pedidos.productos.producto
        }
      };
    }
    return {
      status: false,
      message: 'Error en el servicio.',
      consultaOrderCva: null
    };
  }

  async parseXmlToJson(xml: string, catalog: string): Promise<any> {
    try {
      console.log('xml: ', xml);
      let result;
      let pedidosXml;
      let pedidosXmlContent;
      result = await xml2js.parseStringPromise(xml, { explicitArray: false });

      switch (catalog) {
        case 'ListaPedidos':
          pedidosXml = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:ListaPedidosResponse']['pedidos'];
          pedidosXmlContent = pedidosXml._;
          if (typeof pedidosXmlContent === 'string') {
            const pedidosResult = await xml2js.parseStringPromise(pedidosXmlContent, { explicitArray: false });
            return pedidosResult.PEDIDOS.pedido;
          } else {
            throw new Error('El contenido XML no es válido');
          }
        case 'ConsultaPedido':
          pedidosXml = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:ConsultaPedidoResponse']['pedido'];
          pedidosXmlContent = pedidosXml._;
          if (typeof pedidosXmlContent === 'string') {
            const pedidosResult = await xml2js.parseStringPromise(pedidosXmlContent, { explicitArray: false });
            return pedidosResult.PEDIDO;
          } else {
            throw new Error('El contenido XML no es válido');
          }
        case 'PedidoWeb':
          console.log('result: ', result);
          pedidosXmlContent = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:PedidoWebResponse'];
          console.log('pedidosXmlContent: ', pedidosXmlContent);

          const error = pedidosXmlContent['error']?._ || null;
          const estado = pedidosXmlContent['estado']?._ || null;
          const pedido = pedidosXmlContent['pedido']?._ || null;
          const total = pedidosXmlContent['total']?._ || null;
          const agentemail = pedidosXmlContent['agentemail']?._ || null;
          const almacenmail = pedidosXmlContent['almacenmail']?._ || null;


          return {
            error,
            estado,
            pedido,
            total,
            agentemail,
            almacenmail,
          };

        default:
          throw new Error('Catálogo no válido');
      }
    } catch (error) {
      throw new Error('El contenido XML no es válido');
    }
  }

}

export default ExternalCvasService;
