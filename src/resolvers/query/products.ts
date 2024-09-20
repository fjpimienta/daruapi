import { IResolvers } from '@graphql-tools/utils';
import ProductsService from '../../services/product.service';

const resolversProductsQuery: IResolvers = {
  Query: {
    async products(_, variables, context) {
      return new ProductsService(_, { pagination: variables }, context).items(variables);
    },
    async product(_, variables, context) {
      return new ProductsService(_, variables, context).details(variables, context);
    },
    async productId(_, __, context) {
      return new ProductsService(_, __, context).next();
    },
    async productField(_, variables, context) {
      return new ProductsService(_, variables, context).getProductField();
    },
    async getJson(_, variables, context) {
      return new ProductsService(_, variables, context).readJson();
    },
    async getImages(_, variables, context) {
      return new ProductsService(_, variables, context).readImages();
    }
  },
};

export default resolversProductsQuery;