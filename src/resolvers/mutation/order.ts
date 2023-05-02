import { IResolvers } from '@graphql-tools/utils';
import OrdersService from '../../services/order.service';

const resolversOrdersMutation: IResolvers = {
  Mutation: {
    async addOrder(_, variables, context) {
      return new OrdersService(_, variables, context).insert();
    }
  },
};

export default resolversOrdersMutation;