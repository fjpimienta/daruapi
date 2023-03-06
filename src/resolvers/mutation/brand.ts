import { IResolvers } from '@graphql-tools/utils';
import BrandsService from '../../services/brand.service';

const resolversBrandMutation: IResolvers = {
  Mutation: {
    async addBrand(_, variables, context) {
      return new BrandsService(_, variables, context).insert();
    },
    async addBrands(_, variables, context) {
      return new BrandsService(_, variables, context).insertMany();
    },
    async updateBrand(_, variables, context) {
      return new BrandsService(_, variables, context).modify();
    },
    async deleteBrand(_, variables, context) {
      return new BrandsService(_, variables, context).delete();
    },
    async blockBrand(_, { id, unblock, admin }, context) {
      return new BrandsService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversBrandMutation;