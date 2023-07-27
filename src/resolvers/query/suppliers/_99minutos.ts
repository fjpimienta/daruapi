import { IResolvers } from '@graphql-tools/utils';
import External99minutosService from '../../../services/external99minutos.service';

const resolvers99minutosQuery: IResolvers = {
  Query: {
    async token99(_, __, context) {
      return new External99minutosService(_, __, context).getToken99();
    },
    async coverage(_, variables, context) {
      return new External99minutosService(_, variables, context).getCoverage(variables);
    },
    async shippingRates(_, variables, context) {
      return new External99minutosService(_, variables, context).getShippingRates(variables);
    }
  },
};

export default resolvers99minutosQuery;