import { IResolvers } from '@graphql-tools/utils';
import ExternalIngramService from '../../../services/externalIngram.service';

const resolversIngramQuery: IResolvers = {
  Query: {
    async tokenIngram(_, __, context) {
      return new ExternalIngramService(_, __, context).getTokenIngram();
    },
    async ingramProduct(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getIngramProduct();
    },
    async ingramProducts(_, variables, context) {
      return new ExternalIngramService(_, variables, context).getIngramProducts();
    }
  }
};

export default resolversIngramQuery;