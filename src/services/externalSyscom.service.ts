import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

import logger from '../utils/logger';
import fetch from 'node-fetch';
import { COLLECTIONS } from '../config/constants';
import { Db } from 'mongodb';

class ExternalSyscomService extends ResolversOperationsService {
  collection = COLLECTIONS.INGRAM_PRODUCTS;
  catalogName = 'Productos Ingram';
  private db: Db;
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
    this.db = context.db!;
  }

  async getTokenSyscom() {
    try {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: 'EI20OXsIzHJUkJdWK1ekemWqc3rCtqNX',
          client_secret: '5wwq695ERsumcKdazCR04LhTxQVsPE8NlcZSvg78',
          grant_type: 'client_credentials'
        })
      };
      const url = 'https://developers.syscom.mx/oauth/token';
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getTokenSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.error && data.error !== '') {
        return {
          status: false,
          message: data.message || data.detail,
          tokenSyscom: null
        };
      }
      return {
        status: true,
        message: 'El token se ha generado correctamente.',
        tokenSyscom: data
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.message || JSON.stringify(error)),
        tokenSyscom: null,
      };
    }
  }

  async getListProductsSyscomByBrand() {
    try {
      const brandName = this.getVariables().brandName;
      if (!brandName || brandName === '') {
        return {
          status: false,
          message: 'Se requiere especificar la marca',
          listProductsSyscomByBrand: null,
        };
      }
      const token = await this.getTokenSyscom();
      if (token && !token.status) {
        return {
          status: token.status,
          message: token.message,
          listProductsSyscomByBrand: null,
        };
      }
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token.tokenSyscom.access_token
        }
      };
      const url = 'https://developers.syscom.mx/api/v1/productos/?marca=' + brandName;
      const response = await fetch(url, options);
      const data = await response.json();
      process.env.PRODUCTION === 'true' && logger.info(`getTokenSyscom.data: \n ${JSON.stringify(data)} \n`);
      if (data && data.status && (data.status < 200 || data.status >= 300)) {
        return {
          status: false,
          message: data.message || data.detail,
          listProductsSyscomByBrand: null
        };
      }
      return {
        status: true,
        message: 'La lista de productos se ha generado correctamente',
        listProductsSyscomByBrand: data.productos
      };
    } catch (error: any) {
      return {
        status: false,
        message: 'Error en el servicio. ' + (error.detail || JSON.stringify(error)),
        listProductsSyscomByBrand: null,
      };
    }
  }
}

export default ExternalSyscomService;