import { IResolvers } from '@graphql-tools/utils';
import InvoiceConfigService from '../../services/invoiceconfig.service';

const resolversInvoiceConfigsQuery: IResolvers = {
  Query: {
    async invoiceconfig(_, variables, context) {
      return new InvoiceConfigService(_, variables, context).details();
    }
  },
};

export default resolversInvoiceConfigsQuery;