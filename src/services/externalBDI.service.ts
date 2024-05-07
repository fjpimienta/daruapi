import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import fetch from 'node-fetch';
import { COLLECTIONS } from '../config/constants';
import { Db } from 'mongodb';
import logger from '../utils/logger';

class ExternalBDIService extends ResolversOperationsService {
  collection = COLLECTIONS.INGRAM_PRODUCTS;
  catalogName = 'Productos BDI';
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

  async getTokenBDI() {
    const username = 'bdimx@customer.com';
    const password = 'yIP9fj4I8g';
    const optionsBDI = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: username,
        password: password
      }),
      redirect: 'follow' as RequestRedirect
    };
    const tokenBDI = await fetch('https://admin.bdicentralapi.net/signin', optionsBDI)
      .then(response => response.json())
      .then(async response => {
        return await response;
      })
      .catch(err => console.error(err));
    const status = tokenBDI.token !== '' ? true : false;
    const message = tokenBDI.access_token !== '' ? 'El token se ha generado correctamente. data:' : 'Error en el servicio. ' + JSON.stringify(tokenBDI);
    return {
      status,
      message,
      tokenBDI
    };
  }

  async getBrandsBDI() {
    const token = await this.getTokenBDI();
    if (!token || !token.status) {
      return {
        status: token.status,
        message: token.message,
        brandsBDI: null,
      };
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token.tokenBDI.token
      }
    };
    const url = 'https://admin.bdicentralapi.net/api/manufacturer';
    const response = await fetch(url, options);
    if (response.status < 200 || response.status >= 300) {
      return {
        status: false,
        message: `Error en el servicio del proveedor (${response.status}::${response.statusText})`,
        listProductsSyscomByBrand: null
      };
    }
    const data = await response.json();
    process.env.PRODUCTION === 'true' && logger.info(`getBrandsBDI.data: \n ${JSON.stringify(data)} \n`);
    const brands = data.manufacturer;
    return {
      status: true,
      message: 'Esta es la lista de Marcas de BDI',
      brandsBDI: brands,
    };
  }
}

export default ExternalBDIService;