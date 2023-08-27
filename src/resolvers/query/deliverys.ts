import { IResolvers } from '@graphql-tools/utils';
import DeliverysService from '../../services/deliverys.service';

const resolversDeliverysQuery: IResolvers = {
  Query: {
    async deliverys(_, variables, context) {
      return new DeliverysService(_, { pagination: variables }, context).items(variables);
    },
    async delivery(_, variables, context) {
      return new DeliverysService(_, variables, context).details();
    },
    async deliveryId(_, __, context) {
      return new DeliverysService(_, __, context).next();
    }
  },
};

export default resolversDeliverysQuery;