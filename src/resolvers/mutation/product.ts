import { IResolvers } from '@graphql-tools/utils';
import ProductsService from '../../services/product.service';

const resolversProductMutation: IResolvers = {
  Mutation: {
    async addProduct(_, variables, context) {
      return new ProductsService(_, variables, context).insert();
    },
    async addProducts(_, variables, context) {
      return new ProductsService(_, variables, context).insertMany(context);
    },
    async updateProduct(_, variables, context) {
      return new ProductsService(_, variables, context).modify();
    },
    async deleteProduct(_, variables, context) {
      return new ProductsService(_, variables, context).delete();
    },
    async blockProduct(_, { id, unblock, admin }, context) {
      return new ProductsService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversProductMutation;