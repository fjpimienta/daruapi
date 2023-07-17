import { IResolvers } from '@graphql-tools/utils';
import ExternalCvasService from '../../../services/externalCvas.service';

const resolversCvasQuery: IResolvers = {
  Query: {
    async tokenCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getTokenCva();
    },
    async shippingCvaRates(_, variables, context) {
      console.log('shippingCvaRates/variables: ', variables);
      return new ExternalCvasService(_, variables, context).getShippingCvaRates(variables);
    },
    async orderCva(_, variables, context) {
      return new ExternalCvasService(_, variables, context).getOrderCva(variables);
    }
  },
};

export default resolversCvasQuery;