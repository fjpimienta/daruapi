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
    const data = await result.json();
    if (result.ok) {
      return {
        status: true,
        message: 'El token se ha generado correctamente. data:',
        tokenCt: data
      };
    }
    return {
      status: false,
      message: 'Error en el servicio. ' + JSON.stringify(data),
      tokenCt: null
    };
  }

}

export default ExternalCtsService;
