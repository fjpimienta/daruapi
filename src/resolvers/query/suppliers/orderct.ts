import { IResolvers } from '@graphql-tools/utils';
import OrdersCtService from '../../../services/suppliers/orderct.service';

const resolversOrderCtsQuery: IResolvers = {
  Query: {
    async ordersCt(_, variables, context) {
      return new OrdersCtService(_, { pagination: variables }, context).items(variables);
    },
    async orderCt(_, variables, context) {
      return new OrdersCtService(_, variables, context).details();
    },
    async orderCtId(_, __, context) {
      return new OrdersCtService(_, __, context).next();
    }
  },
};

export default resolversOrderCtsQuery;