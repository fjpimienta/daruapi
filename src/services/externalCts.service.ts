import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
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
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'david.silva@daru.mx',
        cliente: 'VHA2391',
        rfc: 'DIN2206222D3'
      })
    };
    const result = await fetch('http://connect.ctonline.mx:3001/cliente/token', options);
    if (result.ok) {
      return {
        status: true,
        message: 'El token se ha generado correctamente.',
        tokenCt: JSON.stringify(result)
      };
    }
    const data = await result.json();
    console.log('data: ', data);
    console.log('result: ', result);
    return {
      status: false,
      message: 'Error en el servicio. ' + JSON.stringify(data),
      tokenCt: null
    };
  }

  // /**
  //  * 
  //  * @returns ResponseCts: Objeto de respuesta de la covertura.
  //  */
  // async getCoverage(variables: IVariables) {
  //   const origin = variables.origin;
  //   const destination = variables.destination;
  //   const deliveryType = variables.deliveryType;
  //   const token = await this.getToken99();
  //   const options = {
  //     method: 'POST',
  //     headers: {
  //       accept: 'application/json',
  //       'Content-Type': 'application/json',
  //       'Authorization': 'Bearer ' + token.tokenCt.access_token
  //     },
  //     body: JSON.stringify({
  //       "origin": { "zipcode": origin },
  //       "destination": { "zipcode": destination },
  //       "deliveryType": deliveryType
  //     })
  //   };
  //   const result = await fetch('https://sandbox.Cts.com/api/v3/coverage/zipcode', options);
  //   const data = await result.json();
  //   if (result.ok) {
  //     return {
  //       status: true,
  //       message: 'La información que hemos pedido se ha cargado correctamente',
  //       coverage: {
  //         traceId: data.traceId,
  //         message: data.message,
  //         data: data.data,
  //         errors: data.errors ? [JSON.stringify(data.errors)] : []
  //       }
  //     };
  //   }
  //   return {
  //     status: false,
  //     message: 'Error en el servicio. ' + data.code + ': ' + data.message,
  //     coverage: null
  //   };
  // }

  // /**
  //  * 
  //  * @param variables 
  //  * @returns ResponseCts: Objeto de respuesta de la covertura.
  //  */
  // async getShippingRates(variables: IVariables) {
  //   const size = variables.size;
  //   const originZipcode = variables.originZipcode;
  //   const originCountry = variables.originCountry;
  //   const destinationZipcode = variables.destinationZipcode;
  //   const destinationCountry = variables.destinationCountry;
  //   const deliveryType = variables.deliveryType;
  //   const token = await this.getToken99();
  //   const options = {
  //     method: 'GET',
  //     headers: {
  //       accept: 'application/json',
  //       'Content-Type': 'application/json',
  //       'Authorization': 'Bearer ' + token.tokenCt.access_token
  //     },
  //     params: {
  //       "deliveryType": deliveryType,
  //       "size": size,
  //     }
  //   };
  //   const urlPost = originCountry + '/' + originZipcode + '/' + destinationCountry + '/' + destinationZipcode;
  //   const result = await fetch('https://sandbox.Cts.com/api/v3/shipping/rates/zipcodes/' + urlPost, options);
  //   const data = await result.json();
  //   if (result.ok) {
  //     return {
  //       status: true,
  //       message: 'La información que hemos pedido se ha cargado correctamente',
  //       shippingRates: {
  //         traceId: data.traceId,
  //         message: data.message,
  //         data: data.data,
  //         errors: data.errors ? [JSON.stringify(data.errors)] : []
  //       }
  //     };
  //   }
  //   return {
  //     status: false,
  //     message: 'Error en el servicio. ' + data.code + ': ' + data.message,
  //     coverage: null
  //   };
  // }
}

export default ExternalCtsService;
