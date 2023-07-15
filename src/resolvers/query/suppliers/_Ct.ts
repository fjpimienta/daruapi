import { IResolvers } from '@graphql-tools/utils';
import ExternalCtsService from '../../../services/externalCts.service';

const resolversCtsQuery: IResolvers = {
  Query: {
    async tokenCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getTokenCt();
    // },
    // async coverage(_, variables, context) {
    //   return new ExternalCtsService(_, variables, context).getCoverage(variables);
    // },
    // async shippingRates(_, variables, context) {
    //   return new ExternalCtsService(_, variables, context).getShippingRates(variables);
    }
  },
};

export default resolversCtsQuery;