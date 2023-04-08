import { IResolvers } from '@graphql-tools/utils';
import ShippingsService from '../../services/shipping.service';

const resolversShippingMutation: IResolvers = {
  Mutation: {
    async addShipping(_, variables, context) {
      return new ShippingsService(_, variables, context).insert();
    },
    async updateShipping(_, variables, context) {
      return new ShippingsService(_, variables, context).modify();
    },
    async deleteShipping(_, variables, context) {
      return new ShippingsService(_, variables, context).delete();
    },
    async blockShipping(_, { id, unblock, admin }, context) {
      return new ShippingsService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversShippingMutation;