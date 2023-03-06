import { IResolvers } from '@graphql-tools/utils';
import OrdersService from '../../services/order.service';

const resolversOrdersQuery: IResolvers = {
  Query: {
    async orders(_, variables, context) {
      return new OrdersService(_, { pagination: variables }, context).items(variables);
    },
    async order(_, variables, context) {
      return new OrdersService(_, variables, context).details();
    },
    async orderId(_, __, context) {
      return new OrdersService(_, __, context).next();
    }
  },
};

export default resolversOrdersQuery;