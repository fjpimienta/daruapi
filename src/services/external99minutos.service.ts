import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import fetch from 'node-fetch';

class External99minutosService extends ResolversOperationsService {

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

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
      const data = await result.json(); // Obtener el cuerpo de la respuesta como JSON
      return {
        status: true,
        message: 'La información que hemos pedido se ha cargado correctamente',
        token99: data
      };
    } else {
      return {
        status: false,
        message: 'La información que hemos pedido no se ha obtenido tal y como se esperaba',
        token99: []
      };
    }
  }
}

export default External99minutosService;
