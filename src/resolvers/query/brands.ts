import { IResolvers } from '@graphql-tools/utils';
import BrandsService from '../../services/brand.service';

const resolversBrandsQuery: IResolvers = {
  Query: {
    async brands(_, variables, context) {
      return new BrandsService(_, { pagination: variables }, context).items(variables);
    },
    async brand(_, { id }, context) {
      return new BrandsService(_, { id }, context).details();
    },
    async brandId(_, __, context) {
      return new BrandsService(_, __, context).next();
    }
  },
};

export default resolversBrandsQuery;