import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import fetch from 'node-fetch';

class ExternalCvasService extends ResolversOperationsService {

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  /**
   * 
   * @returns TokenCva: Objeto enviado por Cva minutos.
   */
  async getTokenCva() {
    // El token inicialmente es fijo enviado por CVA.
    return {
      status: true,
      message: 'El token se ha generado correctamente.',
      tokenCva: { token: '7ee694a5bae5098487a5a8b9d8392666' }
    };
  }

  /**
  * 
  * @param variables 
  * @returns ResponseCvas: Objeto de respuesta de la covertura.
  */
  async getShippingCvaRates(variables: IVariables) {
    const paqueteria = variables.paqueteria;
    const cp = variables.cp;
    const cp_sucursal = variables.cp_sucursal;
    const productos = variables.productosCva;
    const token = await this.getTokenCva();
    const options = {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.tokenCva.token
      },
      body: JSON.stringify({
        'paqueteria': paqueteria,
        'cp': cp,
        'cp_sucursal': cp_sucursal,
        'productos': productos
      })
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
      }
    };
    return {
      status: false,
      message: 'Error en el servicio. ' + JSON.stringify(data),
      shippingCvaRates: null
    };
  }

  async getOrderCva(variables: IVariables) {
    if (true) {
      return {
        status: false,
        message: 'Error en el servicio.',
        orderCva: null
      };
    }
  }
}

export default ExternalCvasService;
