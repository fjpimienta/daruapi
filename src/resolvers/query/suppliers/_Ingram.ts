import { IResolvers } from '@graphql-tools/utils';
import ExternalIngramService from '../../../services/externalIngram.service';

const resolversIngramQuery: IResolvers = {
  Query: {
    async tokenIngram(_, __, context) {
      return new ExternalIngramService(_, __, context).getTokenIngram();
    },
    async listProductsIngram(_, __, context) {
      return new ExternalIngramService(_, __, context).getListProductsIngram();
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
    async existenciaProductoIngram(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getExistenciaProductoIngram(variables);
    },
    async catalogIngram(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getCatalogIngram(variables);
    },
    async catalogIngrams(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getCatalogIngrams();
    },
    async orderIngram(_, variables, context) {
      return new ExternalIngramService(_, variables, context).setOrderIngram(variables);
    },
    async orderOneIngram(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getOrderIngram(variables);
    }
  }
};

export default resolversIngramQuery;