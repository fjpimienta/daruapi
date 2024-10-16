import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import fetch from 'node-fetch';

class ExternalIcecatsService extends ResolversOperationsService {
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  async getICecatProductInt(variables: IVariables) {
    const { brandIcecat, productIcecat } = variables;
    try {
      const language = 'es';
      const userName = 'daru.admin';
      const apiUrl = 'https://live.icecat.biz/api';
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const url = `${apiUrl}?UserName=${userName}&Language=${language}&Brand=${brandIcecat}&ProductCode=${productIcecat}`;
      const response = await fetch(url, options);
      const responseJson = await response.json();
      if (response.statusText === 'OK') {
        return {
          status: true,
          message: `El producto ${productIcecat} de la marca ${brandIcecat} se ha encontrado.`,
          icecatProduct: responseJson.data,
        };
      } else {
        return {
          status: false,
          message: `No existe el producto ${productIcecat} de la marca ${brandIcecat}`,
          icecatProduct: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        icecatProduct: null,
      };
    }
  }

  async getICecatProduct(variables: IVariables) {
    try {
      const language = 'es';
      const userName = 'daru.admin';
      const apiUrl = 'https://live.icecat.biz/api';
      const { brandIcecat, productIcecat } = variables;
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      const url = `${apiUrl}?UserName=${userName}&Language=${language}&Brand=${brandIcecat}&ProductCode=${productIcecat}`;
      const response = await fetch(url, options);
      const responseJson = await response.json();
      if (response.statusText === 'OK') {
        return {
          status: true,
          message: `El producto ${productIcecat} de la marca ${brandIcecat} se ha encontrado.`,
          icecatProduct: responseJson.data,
        };
      } else {
        return {
          status: false,
          message: `No existe el producto ${productIcecat} de la marca ${brandIcecat}`,
          icecatProduct: null,
        };
      }
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        icecatProduct: null,
      };
    }
  }

  async getIcecatProductLocal() {
    const collection = COLLECTIONS.ICECAT_PRODUCTS;
    const result = await this.getByField(collection);
    return {
      status: result.status,
      message: result.message,
      icecatProductLocal: result.item
    };
  }

}

export default ExternalIcecatsService;