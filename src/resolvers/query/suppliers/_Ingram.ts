import { IResolvers } from '@graphql-tools/utils';
import ExternalIngramService from '../../../services/externalIngram.service';

const resolversIngramQuery: IResolvers = {
  Query: {
    async tokenIngram(_, __, context) {
      return new ExternalIngramService(_, __, context).getTokenIngram();
    },
    async ingramProduct(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getIngramProduct(variables);
    },
    async ingramProducts(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getIngramProducts();
    },
    async pricesIngram(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getPricesIngram(variables);
    },
    async catalogIngram(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getCatalogIngram(variables);
    },
    async catalogIngrams(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getCatalogIngrams();
    },
    async orderIngram(_, variables, context) {
      return new ExternalIngramService(_, variables, context).setOrderIngram(variables);
    }
  }
};

export default resolversIngramQuery;