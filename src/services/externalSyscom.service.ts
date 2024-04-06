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
    logger.info(`getTokenSyscom.response: \n ${JSON.stringify(response)} \n`);
    const data = await response.json();
    logger.info(`getTokenSyscom.data: \n ${JSON.stringify(data)} \n`);
    process.env.PRODUCTION !== 'true' && logger.info(`getTokenSyscom.data: \n ${JSON.stringify(data)} \n`);
    if (!data) {
      return {
        status: false,
        message: data.message,
        tokenSyscom: null
      };
    }
    const status = response.ok;
    const message = status ? 'El token se ha generado correctamente.' : 'Error en el servicio. ' + JSON.stringify(data.message);

    return {
      status,
      message,
      tokenSyscom: status ? data : null
    };
  }
}

export default ExternalSyscomService;