import { IResolvers } from '@graphql-tools/utils';
import DeliverysService from '../../services/deliverys.service';

const resolversDeliveryMutation: IResolvers = {
  Mutation: {
    async addDelivery(_, variables, context) {
      return new DeliverysService(_, variables, context).insert();
    },
    async updateDelivery(_, variables, context) {
      return new DeliverysService(_, variables, context).modify();
    },
    async deleteDelivery(_, variables, context) {
      return new DeliverysService(_, variables, context).delete();
    },
    async blockDelivery(_, { id, unblock, admin }, context) {
      return new DeliverysService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversDeliveryMutation;