import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import fetch from 'node-fetch';

class ExternalIcommktsService extends ResolversOperationsService {
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  async getIcommktContacts() {
    try {
      const ProfileKey = 'ODkzMjQ20';
      const Authorization = 'MjU0NC04MzQxLWRhcnVteF91c3I1';
      const apiUrl = 'https://api.icommarketing.com/Contacts/ListFull.Json/';
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': Authorization
        },
        body: JSON.stringify({
          "ProfileKey": ProfileKey,
          "Filters": {}
        })
      };
      const result = await fetch(apiUrl, options);
      const data = await result.json();
      if (result.ok) {
        return {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          icommktContacts: data.ListContactsFullJsonResult
        };
      }
      return {
        status: false,
        message: 'Error en el servicio. ' + data.code + ': ' + data.message,
        coverage: null
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        icecatProduct: null,
      };
    }
  }

  async getIcommktContact(variables: IVariables) {
    try {
      const Email = variables.email;
      const ProfileKey = 'ODkzMjQ20';
      const Authorization = 'MjU0NC04MzQxLWRhcnVteF91c3I1';
      const apiUrl = 'https://api.icommarketing.com/Contacts/ListFull.Json/';
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': Authorization
        },
        body: JSON.stringify({
          "ProfileKey": ProfileKey,
          "Filters": {
            "Email": Email
          }
        })
      };
      const result = await fetch(apiUrl, options);
      const data = await result.json();
      if (result.ok) {
        return {
          status: true,
          message: 'La información que hemos pedido se ha cargado correctamente',
          icommktContact: data.ListContactsFullJsonResult[0]
        };
      }
      return {
        status: false,
        message: 'Error en el servicio. ' + data.code + ': ' + data.message,
        coverage: null
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        icecatProduct: null,
      };
    }
  }

}

export default ExternalIcommktsService;