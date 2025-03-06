import fetch from 'node-fetch';
import ResolversOperationsService from './resolvers-operaciones.service';
import { IContextData } from '../interfaces/context-data.interface';

class FedExService extends ResolversOperationsService {
  baseURL = 'https://apis-sandbox.fedex.com/ship/v1/'; // Or production URL

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  async getTokenFedex() {
    const clientId = 'l709eb7a71dff94426bb68be49875c2853';
    const clientSecret = '34034947fa184b07bcc5c6a0e2a8f96c';

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
    };
    const result = await fetch('https://apis-sandbox.fedex.com/oauth/token', options);
    if (result.ok) {
      const data = await result.json();
      return {
        status: true,
        message: 'El token se ha generado correctamente.',
        tokenFedex: data
      };
    } else {
      const errorText = await result.text();
      return {
        status: false,
        message: `Error en el servicio. Status: ${result.status}, Text: ${errorText}`,
        tokenFedex: null
      };
    }
  }

}

export default FedExService;
