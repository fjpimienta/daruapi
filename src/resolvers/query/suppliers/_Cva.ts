import { IResolvers } from '@graphql-tools/utils';
import ExternalCvasService from '../../../services/externalCvas.service';

const resolversCvasQuery: IResolvers = {
  Query: {
    async tokenCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getTokenCva();
    },
    async shippingCvaRates(_, variables, context) {
      return new ExternalCvasService(_, variables, context).getShippingCvaRates(variables);
    },
    async listOrdersCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getListOrdersCva();
    }
  },
};

export default resolversCvasQuery;