import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import fetch from 'node-fetch';

class External99minutosService extends ResolversOperationsService {

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  /**
   * 
   * @returns Token99: Objeto enviado por 99 minutos.
   */
  async getToken99() {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: '18b99050-5cb7-4e67-928d-3f16d109b8c5',
        client_secret: 'gdKeiQVGBxRAY~ICpdnJ_7aKEd'
      })
    };
    const result = await fetch('https://sandbox.99minutos.com/api/v3/oauth/token', options);
    if (result.ok) {
      const data = await result.json();
      return {
        status: true,
        message: 'El token se ha generado correctamente.',
        token99: data
      };
    }
    const data = await result.json();
    return {
      status: false,
      message: 'Error en el servicio. ' + JSON.stringify(data),
      token99: null
    };
  }

  /**
   * 
   * @returns Response99minutos: Objeto de respuesta de la covertura.
   */
  async getCoverage(variables: IVariables) {
    const origin = variables.origin;
    const destination = variables.destination;
    const deliveryType = variables.deliveryType;
    const token = await this.getToken99();
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.token99.access_token
      },
      body: JSON.stringify({
        "origin": { "zipcode": origin },
        "destination": { "zipcode": destination },
        "deliveryType": deliveryType
      })
    };
    const result = await fetch('https://sandbox.99minutos.com/api/v3/coverage/zipcode', options);
    const data = await result.json();
    if (result.ok) {
      return {
        status: true,
        message: 'La información del promedio se ha cargado correctamente',
        coverage: {
          traceId: data.traceId,
          message: data.message,
          data: data.data,
          errors: data.errors ? [JSON.stringify(data.errors)] : []
        }
      };
    }
    return {
      status: false,
      message: 'Error en el servicio. ' + data.code + ': ' + data.message,
      coverage: null
    };
  }

  /**
   * 
   * @param variables 
   * @returns Response99minutos: Objeto de respuesta de la covertura.
   */
  async getShippingRates(variables: IVariables) {
    const size = variables.size;
    const originZipcode = variables.originZipcode;
    const originCountry = variables.originCountry;
    const destinationZipcode = variables.destinationZipcode;
    const destinationCountry = variables.destinationCountry;
    const deliveryType = variables.deliveryType;
    const token = await this.getToken99();
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.token99.access_token
      },
      params: {
        "deliveryType": deliveryType,
        "size": size,
      }
    };
    const urlPost = originCountry + '/' + originZipcode + '/' + destinationCountry + '/' + destinationZipcode;
    const result = await fetch('https://sandbox.99minutos.com/api/v3/shipping/rates/zipcodes/' + urlPost, options);
    const data = await result.json();
    if (result.ok) {
      return {
        status: true,
        message: 'La información del costo del envio se ha cargado correctamente',
        shippingRates: {
          traceId: data.traceId,
          message: data.message,
          data: data.data,
          errors: data.errors ? [JSON.stringify(data.errors)] : []
        }
      };
    }
    return {
      status: false,
      message: 'Error en el servicio. ' + data.code + ': ' + data.message,
      coverage: null
    };
  }
}

export default External99minutosService;
