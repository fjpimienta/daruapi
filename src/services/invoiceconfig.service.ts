import { COLLECTIONS } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import ResolversOperationsService from './resolvers-operaciones.service';

class InvoiceConfigService extends ResolversOperationsService {
  collection =  COLLECTIONS.INVOICE_CONFIG;
  catalogName = 'invoice_config';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  async details() {
    const result = await this.get(this.collection);
    return {
      status: result.status,
      message: result.message,
      invoiceconfig: result.item.invoice_config
    };
  }
}

export default InvoiceConfigService;