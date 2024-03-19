import { Db } from 'mongodb';
import slugify from 'slugify';
import fetch from 'node-fetch';
import logger from '../utils/logger';
import ConfigsService from './config.service';
import ResolversOperationsService from './resolvers-operaciones.service';
import { IVariables } from '../interfaces/variable.interface';
import { IContextData } from '../interfaces/context-data.interface';
import { IBranchOffices } from '../interfaces/product.interface';
import { IResponseProductCva } from '../interfaces/suppliers/_CvasShippments.interface';
import { BranchOffices, Brands, Categorys, Descuentos, Especificacion, Picture, Product, Promociones, SupplierProd, UnidadDeMedida } from '../models/product.models';
const xml2js = require('xml2js');

class ExternalCvasService extends ResolversOperationsService {
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

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
    try {

      const wsdl = 'PedidoWeb';
      let soapProducts = '&lt;productos&gt;';
      pedidoCva?.productos?.forEach(product => {
        soapProducts += `&lt;producto&gt;
        &lt;clave&gt;${product.clave}&lt;/clave&gt;
        &lt;cantidad&gt;${product.cantidad}&lt;/cantidad&gt;
    &lt;/producto&gt;`;
      });
      soapProducts += '&lt;/productos&gt;';
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
      logger.info(`setOrderCva.data: \n ${JSON.stringify(response)} \n`);
      const content = await response.text();
      const data = await this.parseXmlToJson(content, wsdl);
      if (data) {
        if (data.estado === 'ERROR') {
          return {
            status: false,
            message: data.error,
            orderCva: null
          };
        }
        return {
          status: true,
          message: 'El pedido se ha creado de forma correcta.',
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
    } catch (error) {
      logger.info(`setOrderCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        orderCva: null
      };
    }
  }

  async getShippingCvaRates(variables: IVariables) {
    const { paqueteria, cp, cp_sucursal, productosCva } = variables;
    try {
      if (!paqueteria || !cp || !cp_sucursal || !productosCva) {
        return {
          status: false,
          message: `Verificar los valores requeridos de paqueteria, cp, cp_sucursal y productos.`,
          shippingCvaRates: {}
        }
      }
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
      logger.info(`getShippingCvaRates.data: \n ${JSON.stringify(response)} \n`);
      if (response.status < 200 || response.status >= 300) {
        return {
          status: false,
          message: `Error en la consulta con el proveedor. <<status: ${response.status}>>`,
          shippingCvaRates: {}
        }
      }
      const data = await response.json();
      if (!data) {
        return {
          status: false,
          message: `No es posible enviar a este CP: ${cp}.`,
          shippingCvaRates: {}
        }
      }
      if (data.result === 'failed') {
        let messageError = '';
        if ('mensaje' in data) {
          messageError = data.mensaje;
        } else if ('message' in data) {
          messageError = data.message;
        } else {
          messageError = 'Error desconocido';
        }
        return {
          status: false,
          message: messageError,
          shippingCvaRates: {}
        };
      }
      return {
        status: true,
        message: 'La cotizacion se ha generado correctamente',
        shippingCvaRates: {
          result: data.result,
          cotizacion: data.cotizacion
        }
      };
    } catch (error) {
      logger.info(`getListPaqueteriasCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        shippingCvaRates: null
      };
    }
  }

  async getListOrdersCva() {
    try {
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
      if (result.statusText === 'OK') {
        const content = await result.text();
        let data = await this.parseXmlToJson(content, wsdl);
        if (!data) {
          return {
            status: false,
            message: 'No hay pedidos vigentes en este periodo.',
            listOrdersCva: null
          };
        }
        const dataArray = Array.isArray(data) ? data : [data];
        const pedidos = dataArray.map(pedido => ({
          ...pedido,
          FechaAsignado: this.convertirFecha(pedido.FechaAsignado)
        }));
        pedidos.sort((a: any, b: any) => {
          const fechaA = a.FechaAsignado.split('/').reverse().join('');
          const fechaB = b.FechaAsignado.split('/').reverse().join('');
          return fechaB.localeCompare(fechaA);
        });
        if (pedidos && result.ok) {
          return {
            status: true,
            message: 'La información que hemos pedido se ha cargado correctamente',
            listOrdersCva: pedidos
          };
        }
      } else {
        return {
          status: false,
          message: 'Error en el servicio. Consultar con el Administrador.',
          listOrdersCva: null
        };
      }
    } catch (error) {
      logger.info(`getListPaqueteriasCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        listBrandsCva: null
      };
    }
  }

  convertirFecha(fecha: string): string {
    const partes = fecha.split('/');
    const fechaConvertida = `${partes[0].padStart(2, '0')}/${partes[1].padStart(2, '0')}/${partes[2]}`;
    return fechaConvertida;
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
    logger.info(`getConsultaOrderCva.data: \n ${JSON.stringify(response)} \n`);
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
      message: 'Error en el servicio. Consultar con el Administrador.',
      consultaOrderCva: null
    };
  }

  async getListBrandsCva() {
    try {
      const url = 'https://www.grupocva.com/catalogo_clientes_xml/marcas2.xml';
      const response = await fetch(url);
      const xml = await response.text();

      return response.ok
        ? {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          listBrandsCva: await this.parseXmlToJson(xml, 'marcas2.xml')
        }
        : {
          status: false,
          message: 'Error en el servicio. Consultar con el Administrador.',
          listBrandsCva: null
        };
    } catch (error) {
      logger.info(`getListBrandsCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        listBrandsCva: null
      };
    }
  }

  async getListGroupsCva() {
    try {
      const url = 'http://www.grupocva.com/catalogo_clientes_xml/grupos.xml';
      const response = await fetch(url);
      const xml = await response.text();

      return response.ok
        ? {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          listGroupsCva: await this.parseXmlToJson(xml, 'grupos.xml')
        }
        : {
          status: false,
          message: 'Error en el servicio. Consultar con el Administrador.',
          listGroupsCva: null
        };
    } catch (error) {
      logger.info(`getListGroupsCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        listGroupsCva: null
      };
    }
  }

  async getListSolucionesCva() {
    try {
      const url = 'https://www.grupocva.com/catalogo_clientes_xml/soluciones.xml';
      const response = await fetch(url);
      const xml = await response.text();

      return response.ok
        ? {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          listSolucionesCva: await this.parseXmlToJson(xml, 'soluciones.xml')
        }
        : {
          status: false,
          message: 'Error en el servicio. Consultar con el Administrador.',
          listSolucionesCva: null
        };
    } catch (error) {
      logger.info(`getListSolucionesCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        listSolucionesCva: null
      };
    }
  }

  async getListSucursalesCva() {
    try {
      const url = 'https://www.grupocva.com/catalogo_clientes_xml/sucursales.xml';
      const response = await fetch(url);
      const xml = await response.text();

      return response.ok
        ? {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          listSucursalesCva: await this.parseXmlToJson(xml, 'sucursales.xml')
        }
        : {
          status: false,
          message: 'Error en el servicio. Consultar con el Administrador.',
          listSucursalesCva: null
        };
    } catch (error) {
      logger.info(`getListSucursalesCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        listSucursalesCva: null
      };
    }
  }

  async getListPaqueteriasCva() {
    try {
      const url = 'https://www.grupocva.com/catalogo_clientes_xml/paqueteria.xml';
      const response = await fetch(url);
      const xml = await response.text();

      return response.ok
        ? {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          listPaqueteriasCva: await this.parseXmlToJson(xml, 'paqueteria.xml')
        }
        : {
          status: false,
          message: 'Error en el servicio. Consultar con el Administrador.',
          listPaqueteriasCva: null
        };
    } catch (error) {
      logger.info(`getListPaqueteriasCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        listPaqueteriasCva: null
      };
    }
  }

  async getExistenciaProductoCva(variables: IVariables) {
    const cliente = '73766';
    const { existenciaProducto } = variables;
    if (!existenciaProducto) {
      return {
        status: true,
        message: 'No hubo cambio en los almacenes. Verificar API.',
        existenciaProductoCva: existenciaProducto,
      };
    }
    const codigoCva = existenciaProducto?.codigo;
    try {
      let url = '';
      if (codigoCva) {
        url = `http://www.grupocva.com/catalogo_clientes_xml/lista_precios.xml?cliente=${cliente}&codigo=${codigoCva}&promos=1&porcentajes=1&sucursales=1&TotalSuc=1&MonedaPesos=1&tc=1&upc=1&dimen=1`;
      }
      const response = await fetch(url);
      logger.info(`getExistenciaProductoCva.response: \n ${JSON.stringify(response)} \n`);
      const xml = await response.text();
      let data = await this.parseXmlToJson(xml, 'lista_precios.xml')
      if (data) {
        let branchOffices: IBranchOffices[] = [];
        branchOffices = await this.setCvaAlmacenes(data, 1);
        existenciaProducto.branchOffices = branchOffices;
      }
      return data
        ? {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          existenciaProductoCva: existenciaProducto
        }
        : {
          status: false,
          message: 'Producto no localizado en la lista de productos.',
          existenciaProductoCva: null
        };
    } catch (error) {
      logger.info(`getExistenciaProductoCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        existenciaProductoCva: null
      };
    }
  }

  async getPricesCvaProduct(variables: IVariables) {
    const cliente = '73766';
    const { codigoCva } = variables;
    try {
      let url = '';
      if (codigoCva) {
        url = `http://www.grupocva.com/catalogo_clientes_xml/lista_precios.xml?cliente=${cliente}&codigo=${codigoCva}&promos=1&porcentajes=1&sucursales=1&TotalSuc=1&MonedaPesos=1&tc=1&upc=1&dimen=1`;
      }
      const response = await fetch(url);
      logger.info(`getPricesCvaProduct.data: \n ${JSON.stringify(response)} \n`);
      const xml = await response.text();
      let data = await this.parseXmlToJson(xml, 'lista_precios.xml')
      return data
        ? {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          existenciaProductoCva: data
        }
        : {
          status: false,
          message: 'Producto no localizado en la lista de productos.',
          existenciaProductoCva: null
        };
    } catch (error) {
      logger.info(`getPricesCvaProduct.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        existenciaProductoCva: null
      };
    }
  }

  async getListPricesCva(variables: IVariables) {
    const cliente = '73766';
    const { groupName } = variables;
    try {
      if (!groupName) {
        return {
          status: false,
          message: `No se ha especificado el valor de consulta.`,
          listPricesCva: []
        }
      }
      let url = '';
      url = `http://www.grupocva.com/catalogo_clientes_xml/lista_precios.xml?cliente=${cliente}&grupo=${groupName}&promos=1&porcentajes=1&sucursales=1&TotalSuc=1&MonedaPesos=1&tc=1&upc=1&dimen=1&subgpo=1`;
      const response = await fetch(url);
      logger.info(`getListPricesCva.data: \n ${JSON.stringify(response)} \n`);
      if (response.status < 200 || response.status >= 300) {
        return {
          status: false,
          message: `Error en la consulta con el proveedor. <<status: ${response.status}>>`,
          listPricesCva: []
        }
      }
      const xml = await response.text();
      let data = await this.parseXmlToJson(xml, 'lista_precios.xml')
      if (!data) {
        return {
          status: false,
          message: `No se encontraron datos de ${groupName}.`,
          listPricesCva: []
        }
      }
      const dataArray = [];
      if (data && data.clave) {
        dataArray.push(data);
        data = dataArray;
      }
      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        listPricesCva: data
      }
    } catch (error) {
      logger.info(`getListPricesCva.error: \n ${JSON.stringify(error)} \n`);
      return {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        listPricesCva: []
      };
    }
  }

  async getListProductsCva(): Promise<{
    status: boolean;
    message: string;
    listProductsCva: Product[] | [];
  }> {
    const db = this.db;
    const products: Product[] = [];
    const productos: Product[] = [];
    const config = await new ConfigsService({}, { id: '1' }, { db }).details();
    const stockMinimo = config.config.minimum_offer;
    const exchangeRate = config.config.exchange_rate;
    const groups = (await this.getListGroupsCva()).listGroupsCva;
    const almacenes = (await this.getListSucursalesCva()).listSucursalesCva;
    function excludeGroups(groupsToExclude: string[], allGroups: { grupo: string }[]): { grupo: string }[] {
      const filteredGroups = allGroups.filter(groupObj => !groupsToExclude.includes(groupObj.grupo));
      return filteredGroups;
    }
    // Grupos para excluir
    const groupsToExclude = [
      "ACCESO VIDEOCONFERENCIA",
      "AIRE ACONDICIONADO",
      "ALARMAS",
      "ASPIRADORAS",
      "BASCULA",
      "CAFETERA",
      "CALCULADORA",
      "CABLEADO ESTRUCTURADO",
      "CONCENTRADOR DE OXIGENO",
      "CONTADOR DE BILLETES",
      "CONSOLAS",
      "CONTROLES",
      "COPIADORA",
      "CURSO",
      "DIGITALIZADOR",
      "DRONES",
      "EMPAQUES",
      "FREIDORA DE AIRE",
      "FAX",
      "FUNDAS",
      "HANDHELD",
      "HIDROLAVADORAS",
      "INSUMOS",
      "INSUMOS GHIA",
      "INTERFON",
      "JUGUETES",
      "KIOSKO",
      "LICUADORA",
      "LINEA BLANCA",
      "MAQUINA PARA CORTAR CABELLO",
      "MAQUINAS DE COSER",
      "MAQUINAS DE ESCRIBIR",
      "MATERIALES PARA PRODUCCION GHIA",
      "MUEBLES PARA OFICINA",
      "PCS",
      "PASE",
      "PARTES",
      "PIZARRON",
      "PORTA RETRATO DIGITAL",
      "POLIZAS DE GARANTIA",
      "PRODUCTOS DE LIMPIEZA",
      "PROMOCIONALES",
      "RADIO RELOJ",
      "RASURADORA",
      "REFACCIONES",
      "EFACCIONES GHIA / HAIER",
      "REFACCIONES PARA UPS",
      "REFACCIONES GHIA / HAIER",
      "REPRODUCTORES",
      "SERVICIOS CLOUD CVA",
      "SERVICIOS METROCARRIER",
      "SERVICIOS VIDEOCONFERENCIA",
      "SINTONIZADOR",
      "SOLUCION INTERWRITE",
      "SOLUCIONES GSM",
      "VENTILADORES",
      "TRITURADORA DE DOCUMENTOS",
      "VENTILADORES",
      "TERMOMETRO",
      "TIPO DE CONECTIVIDAD",
      "PIZARRON",
      "CAMARAS"
    ];
    // Obtener la lista de grupos excluyendo los especificados
    for (const group of groups) {
      const prodByBrand = await this.getListPricesCva({ groupName: group.grupo });
      if (prodByBrand && prodByBrand.listPricesCva && Array.isArray(prodByBrand.listPricesCva)) {
        products.push(...prodByBrand.listPricesCva);
      }
    }

    if (products.length > 0) {
      let i = 1;
      for (const product of products) {
        let itemData = new Product();
        product.id = i.toString();
        itemData = await this.setProduct('cva', product, null, null, almacenes, stockMinimo, exchangeRate);
        if (itemData.id !== undefined) {
          productos.push(itemData);
        }
        i += 1;
      }
      return await {
        status: true,
        message: 'Productos listos para agregar.',
        listProductsCva: productos
      }
    } else {
      return await {
        status: false,
        message: 'No se encontraron productos para ingresar.',
        listProductsCva: []
      }
    }
  }

  async setProduct(proveedor: string, item: any, productJson: any = null, imagenes: any = null, almacenes: any[], stockMinimo: number, exchangeRate: number) {
    const utilidad: number = 1.08;
    const iva: number = 1.16;
    const itemData = new Product();
    const unidad = new UnidadDeMedida();
    const b = new Brands();
    const s = new SupplierProd();
    const i = new Picture();
    const is = new Picture();
    const desc = new Descuentos();
    const promo = new Promociones();
    let disponible = 0;
    let salePrice = 0;
    salePrice = 0;
    disponible = 0;
    itemData.id = undefined;
    let branchOffices: BranchOffices[] = [];
    if (item.ExsTotal >= stockMinimo) {                  // Si existencias totales.
      let featured = false;
      branchOffices = this.getCvaAlmacenes(item, almacenes, stockMinimo);
      if (branchOffices.length > 0) {
        for (const branchOffice of branchOffices) {
          disponible += branchOffice.cantidad;
        }
        itemData.id = item.id;
        itemData.name = item.descripcion;
        itemData.slug = slugify(item.descripcion, { lower: true });
        itemData.short_desc = item.clave + '. Grupo: ' + item.grupo;
        itemData.price = item.precio === '' || isNaN(parseFloat(item.precio)) ? 0 : parseFloat(item.precio);
        itemData.review = 0;
        itemData.ratings = 0;
        itemData.until = this.getFechas(new Date());
        itemData.top = false;
        if (item.PrecioDescuento !== 'Sin Descuento') {
          desc.total_descuento = item.TotalDescuento === '' || isNaN(parseFloat(item.TotalDescuento)) ? 0 : parseFloat(item.TotalDescuento) * utilidad * iva;
          desc.moneda_descuento = item.MonedaDescuento;
          desc.precio_descuento = item.PrecioDescuento === '' || isNaN(parseFloat(item.PrecioDescuento)) ? 0 : parseFloat(item.PrecioDescuento) * utilidad * iva;
          salePrice = desc.precio_descuento;
        }
        itemData.descuentos = desc;
        if (item.DisponibleEnPromocion !== 'Sin Descuento') {
          promo.clave_promocion = item.ClavePromocion;
          promo.descripcion_promocion = item.DescripcionPromocion;
          promo.vencimiento_promocion = item.VencimientoPromocion;
          promo.disponible_en_promocion = item.DisponibleEnPromocion === '' || isNaN(parseFloat(item.DisponibleEnPromocion)) ? 0 : parseFloat(item.DisponibleEnPromocion) * utilidad * iva;
          promo.porciento = 0;
        }
        itemData.sale_price = salePrice;
        featured = (item.PrecioDescuento > 0 && item.PrecioDescuento < item.precio) ? true : false;
        itemData.featured = featured;
        itemData.exchangeRate = item.tipocambio > 0 ? item.tipocambio : exchangeRate;
        itemData.promociones = promo;
        itemData.new = false;
        itemData.sold = '';
        itemData.stock = disponible;
        itemData.sku = item.clave;
        itemData.partnumber = item.codigo_fabricante;
        itemData.upc = item.clave;
        unidad.id = 'PZ';
        unidad.name = 'Pieza';
        unidad.slug = 'pieza';
        itemData.unidadDeMedida = unidad;
        // Categorias
        itemData.category = [];
        if (item.solucion) {
          const c = new Categorys();
          c.name = item.solucion;
          c.slug = slugify(item.solucion, { lower: true });
          itemData.category.push(c);
        } else {
          const c = new Categorys();
          c.name = '';
          c.slug = '';
          itemData.category.push(c);
        }
        // SubCategorias
        itemData.subCategory = [];
        if (item.grupo) {
          const c1 = new Categorys();
          c1.name = item.grupo;
          c1.slug = slugify(item.grupo, { lower: true });
          itemData.subCategory.push(c1);
        } else {
          const c1 = new Categorys();
          c1.name = '';
          c1.slug = '';
          itemData.subCategory.push(c1);
        }
        // Marcas
        itemData.brand = item.marca.toLowerCase();
        itemData.brands = [];
        b.name = item.marca;
        b.slug = slugify(item.marca, { lower: true });
        itemData.brands.push(b);
        // SupplierProd
        s.idProveedor = proveedor;
        s.codigo = item.codigo_fabricante;
        s.price = item.precio;
        s.cantidad = stockMinimo;
        s.sale_price = item.PrecioDescuento === '' || isNaN(parseFloat(item.PrecioDescuento)) ? 0 : parseFloat(item.PrecioDescuento);
        s.moneda = item.moneda === 'Pesos' ? 'MXN' : 'USD';
        s.branchOffices = branchOffices;
        s.category = new Categorys();
        s.subCategory = new Categorys();
        if (item.solucion) {
          s.category.slug = slugify(item.solucion, { lower: true });;
          s.category.name = item.solucion;
        }
        if (item.grupo) {
          s.subCategory.slug = slugify(item.grupo, { lower: true });;
          s.subCategory.name = item.grupo;
        }
        itemData.suppliersProd = s;
        // Imagenes
        itemData.pictures = [];
        // const i = new Picture();
        i.width = '600';
        i.height = '600';
        i.url = item.imagen;
        itemData.pictures.push(i);
        // Imagenes pequeñas
        itemData.sm_pictures = [];
        // const is = new Picture();
        is.width = '300';
        is.height = '300';
        is.url = item.imagen;
        itemData.variants = [];
        itemData.sm_pictures.push(is);
        itemData.especificaciones = [];
        if (item.dimensiones) {
          const especD: Especificacion = new Especificacion();
          especD.tipo = 'Dimensiones';
          especD.valor = item.dimensiones;
          itemData.especificaciones.push(especD);
          const dimensionesArray = item.dimensiones.split(',').map(Number);
          if (dimensionesArray.length === 3) {
            const [longitud, ancho, altura] = dimensionesArray;
            itemData.especificaciones.push({ tipo: 'Longitud', valor: longitud });
            itemData.especificaciones.push({ tipo: 'Ancho', valor: ancho });
            itemData.especificaciones.push({ tipo: 'Altura', valor: altura });
          }
        }
        if (item.peso) {
          const especP: Especificacion = new Especificacion();
          especP.tipo = 'Peso';
          especP.valor = item.peso;
          itemData.especificaciones.push(especP);
        }
      }
    }
    return itemData;
  }

  getCvaAlmacenes(item: any, cvaAlmacenes: any[], stockMinimo: number = 1): BranchOffices[] {
    const branchOffices: BranchOffices[] = [];
    if (cvaAlmacenes.length > 0) {
      cvaAlmacenes.forEach(almacen => {
        let cantidad = 0;
        const branchOffice = new BranchOffices();
        branchOffice.id = almacen.clave;
        branchOffice.name = almacen.nombre;
        branchOffice.estado = almacen.nombre;
        branchOffice.cp = almacen.cp;
        branchOffice.latitud = '';
        branchOffice.longitud = '';
        branchOffice.cantidad = cantidad;
        switch (almacen.clave) {
          case '1':
            cantidad = parseInt(item.VENTAS_GUADALAJARA, 10);
            break;
          case '3':
            cantidad = parseInt(item.VENTAS_MORELIA, 10);
            break;
          case '4':
            cantidad = parseInt(item.VENTAS_LEON, 10);
            break;
          case '5':
            cantidad = parseInt(item.VENTAS_CULIACAN, 10);
            break;
          case '6':
            cantidad = parseInt(item.VENTAS_QUERETARO, 10);
            break;
          case '7':
            cantidad = parseInt(item.VENTAS_TORREON, 10);
            break;
          case '8':
            cantidad = parseInt(item.VENTAS_TEPIC, 10);
            break;
          case '9':
            cantidad = parseInt(item.VENTAS_MONTERREY, 10);
            break;
          case '10':
            cantidad = parseInt(item.VENTAS_PUEBLA, 10);
            break;
          case '11':
            cantidad = parseInt(item.VENTAS_VERACRUZ, 10);
            break;
          case '12':
            cantidad = parseInt(item.disponible, 10);
            break;
          case '13':
            cantidad = parseInt(item.VENTAS_TUXTLA, 10);
            break;
          case '14':
            cantidad = parseInt(item.VENTAS_HERMOSILLO, 10);
            break;
          case '18':
            cantidad = parseInt(item.VENTAS_MERIDA, 10);
            break;
          case '19':
            cantidad = parseInt(item.VENTAS_CANCUN, 10);
            break;
          case '23':
            cantidad = parseInt(item.VENTAS_AGUASCALIENTES, 10);
            break;
          case '24':
            cantidad = parseInt(item.VENTAS_DF_TALLER, 10);
            break;
          case '26':
            cantidad = parseInt(item.VENTAS_SAN_LUIS_POTOSI, 10);
            break;
          case '27':
            cantidad = parseInt(item.VENTAS_CHIHUAHUA, 10);
            break;
          case '28':
            cantidad = parseInt(item.VENTAS_DURANGO, 10);
            break;
          case '29':
            cantidad = parseInt(item.VENTAS_TOLUCA, 10);
            break;
          case '31':
            cantidad = parseInt(item.VENTAS_OAXACA, 10);
            break;
          case '32':
            cantidad = parseInt(item.VENTAS_LAPAZ, 10);
            break;
          case '33':
            cantidad = parseInt(item.VENTAS_TIJUANA, 10);
            break;
          case '35':
            cantidad = parseInt(item.VENTAS_COLIMA, 10);
            break;
          case '36':
            cantidad = parseInt(item.VENTAS_ZACATECAS, 10);
            break;
          case '38':
            cantidad = parseInt(item.VENTAS_CAMPECHE, 10);
            break;
          case '39':
            cantidad = parseInt(item.VENTAS_TAMPICO, 10);
            break;
          case '40':
            cantidad = parseInt(item.VENTAS_PACHUCA, 10);
            break;
          case '43':
            cantidad = parseInt(item.VENTAS_ACAPULCO, 10);
            break;
          case '46':
            cantidad = parseInt(item.disponibleCD, 10);
            break;
          case '47':
            cantidad = parseInt(item.VENTAS_CUERNAVACA, 10);
            break;
          case '51':
            cantidad = parseInt(item.VENTAS_CEDISCDMX, 10);
            break;
          case '52':
            cantidad = parseInt(item.VENTAS_ASPHALT, 10);

            break;
        }
        if (cantidad >= stockMinimo) {
          branchOffice.cantidad = cantidad;
          branchOffices.push(branchOffice);
        }
      });
    }
    return branchOffices;
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

  async getListProductsCvaByGroup(): Promise<{
    status: boolean;
    message: string;
    listProductsCvaByGroup: IResponseProductCva[] | null;
  }> {
    const products: IResponseProductCva[] = [];
    const groups = (await this.getListGroupsCva()).listGroupsCva;

    function excludeGroups(groupsToExclude: string[], allGroups: { grupo: string }[]): { grupo: string }[] {
      const filteredGroups = allGroups.filter(groupObj => !groupsToExclude.includes(groupObj.grupo));
      return filteredGroups;
    }
    // Grupos para excluir
    const groupsToExclude = [
      "AIRE ACONDICIONADO",
      "ALARMAS",
      "ANTENAS",
      "ASPIRADORAS",
      "BASCULA",
      "CAFETERA",
      "CALCULADORA",
      "CONTADOR DE BILLETES",
      "EMPAQUES",
      "FREIDORA DE AIRE",
      "FUNDAS",
      "HIDROLAVADORAS",
      "JUGUETES",
      "KIOSKO",
      "LICUADORA",
      "LINEA BLANCA",
      "MAQUINA PARA CORTAR CABELLO",
      "MAQUINAS DE COSER",
      "MAQUINAS DE ESCRIBIR",
      "MICA",
      "PIZARRON",
      "PRODUCTOS DE LIMPIEZA",
      "RADIO RELOJ",
      "RASURADORA",
      "RELOJES",
      "VENTILADORES",
      "TRITURADORA DE DOCUMENTOS",
      "VENTILADORES",
      "TERMOMETRO",
      "PIZARRON",
    ];
    // Obtener la lista de grupos excluyendo los especificados
    const filteredGroups = excludeGroups(groupsToExclude, groups);

    for (const group of filteredGroups) {
      const groupName = { groupName: group.grupo };
      const prodByGroup = await this.getListPricesCva(groupName);
      if (prodByGroup && prodByGroup.listPricesCva && Array.isArray(prodByGroup.listPricesCva)) {
        products.push(...prodByGroup.listPricesCva);
      }
    }

    return products.length > 0
      ? {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        listProductsCvaByGroup: products
      }
      : {
        status: false,
        message: 'Error en el servicio. Consultar con el Administrador.',
        listProductsCvaByGroup: null
      };
  }

  async parseXmlToJson(xml: string, catalog: string): Promise<any> {
    try {
      let pedidosXml;
      let pedidosXmlContent;
      const result = await xml2js.parseStringPromise(xml, { explicitArray: false });
      switch (catalog) {
        case 'marcas2.xml':
          return result.marcas.marca;
        case 'grupos.xml':
          if (result && result.grupos && result.grupos.grupo) {
            const grupos = Array.isArray(result.grupos.grupo)
              ? result.grupos.grupo.map((item: any) => ({ grupo: item.trim() }))
              : [{ grupo: result.grupos.grupo.trim() }];
            return grupos;
          } else {
            return [];
          }
        case 'soluciones.xml':
          return result.soluciones.solucion;
        case 'sucursales.xml':
          return result.sucursales.sucursal;
        case 'paqueteria.xml':
          return result.paqueterias.paqueteria;
        case 'lista_precios.xml':
          return result.articulos.item;
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
          pedidosXmlContent = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns1:PedidoWebResponse'];
          const error = pedidosXmlContent['error']?._ || null;
          const estado = pedidosXmlContent['estado']?._ || null;
          const pedido = pedidosXmlContent['pedido']?._ || null;
          const total = pedidosXmlContent['total']?._ || null;
          const agentemail = pedidosXmlContent['agentemail']?._ || null;
          const almacenmail = pedidosXmlContent['almacenmail']?._ || null;
          return { error, estado, pedido, total, agentemail, almacenmail };

        default:
          throw new Error('Catálogo no válido');
      }
    } catch (error) {
      logger.info(`parseXmlToJson.error: \n ${JSON.stringify(error)} \n`);
      throw new Error('El contenido XML no es válido');
    }
  }

  async setCvaAlmacenes(item: any, qty: number): Promise<any> {
    const almacenes = await this.getListSucursalesCva();
    const cvaAlmacenes = almacenes.listSucursalesCva;
    const branchOffices: IBranchOffices[] = [];
    cvaAlmacenes.forEach((almacen: any) => {
      let cantidad = 0;
      const branchOffice: IBranchOffices = {
        id: almacen.clave,
        cantidad: qty,
        name: almacen.nombre,
        estado: almacen.nombre,
        cp: almacen.cp,
        latitud: '',
        longitud: ''
      };
      switch (almacen.clave) {
        case '1':
          cantidad = parseInt(item.VENTAS_GUADALAJARA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '3':
          cantidad = parseInt(item.VENTAS_MORELIA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '4':
          cantidad = parseInt(item.VENTAS_LEON, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '5':
          cantidad = parseInt(item.VENTAS_CULIACAN, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '6':
          cantidad = parseInt(item.VENTAS_QUERETARO, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '7':
          cantidad = parseInt(item.VENTAS_TORREON, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '8':
          cantidad = parseInt(item.VENTAS_TEPIC, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '9':
          cantidad = parseInt(item.VENTAS_MONTERREY, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '10':
          cantidad = parseInt(item.VENTAS_PUEBLA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '11':
          cantidad = parseInt(item.VENTAS_VERACRUZ, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '12':
          cantidad = parseInt(item.disponible, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '13':
          cantidad = parseInt(item.VENTAS_TUXTLA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '14':
          cantidad = parseInt(item.VENTAS_HERMOSILLO, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '18':
          cantidad = parseInt(item.VENTAS_MERIDA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '19':
          cantidad = parseInt(item.VENTAS_CANCUN, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '23':
          cantidad = parseInt(item.VENTAS_AGUASCALIENTES, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '24':
          cantidad = parseInt(item.VENTAS_DF_TALLER, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '26':
          cantidad = parseInt(item.VENTAS_SAN_LUIS_POTOSI, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '27':
          cantidad = parseInt(item.VENTAS_CHIHUAHUA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '28':
          cantidad = parseInt(item.VENTAS_DURANGO, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '29':
          cantidad = parseInt(item.VENTAS_TOLUCA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '31':
          cantidad = parseInt(item.VENTAS_OAXACA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '32':
          cantidad = parseInt(item.VENTAS_LAPAZ, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '33':
          cantidad = parseInt(item.VENTAS_TIJUANA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '35':
          cantidad = parseInt(item.VENTAS_COLIMA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '36':
          cantidad = parseInt(item.VENTAS_ZACATECAS, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '38':
          cantidad = parseInt(item.VENTAS_CAMPECHE, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '39':
          cantidad = parseInt(item.VENTAS_TAMPICO, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '40':
          cantidad = parseInt(item.VENTAS_PACHUCA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '43':
          cantidad = parseInt(item.VENTAS_ACAPULCO, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '46':
          cantidad = parseInt(item.disponibleCD, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '47':
          cantidad = parseInt(item.VENTAS_CUERNAVACA, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '51':
          cantidad = parseInt(item.VENTAS_CEDISCDMX, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }
          break;
        case '52':
          cantidad = parseInt(item.VENTAS_ASPHALT, 10);
          if (cantidad >= qty) {
            branchOffice.cantidad = cantidad;
            branchOffices.push(branchOffice);
          }

          break;
      }
    });
    return branchOffices;
  }

}

export default ExternalCvasService;
