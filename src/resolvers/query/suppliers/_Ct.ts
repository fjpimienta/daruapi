import { IResolvers } from '@graphql-tools/utils';
import ExternalCtsService from '../../../services/externalCts.service';

const resolversCtsQuery: IResolvers = {
  Query: {
    async tokenCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getTokenCt();
    },
    async shippingCtRates(_, variables, context) {
      return new ExternalCtsService(_, variables, context).getShippingCtRates(variables);
    },
    async orderCt(_, variables, context) {
      return new ExternalCtsService(_, variables, context).getOrderCt(variables);
    }
  },
};

export default resolversCtsQuery;