import { IResolvers } from '@graphql-tools/utils';
import OrdersCvaService from '../../../services/suppliers/ordercva.service';

const resolversOrderCvasQuery: IResolvers = {
  Query: {
    async ordersCva(_, variables, context) {
      return new OrdersCvaService(_, { pagination: variables }, context).items(variables);
    },
    async orderCvaX(_, variables, context) {
      return new OrdersCvaService(_, variables, context).details();
    },
    async orderCvaId(_, __, context) {
      return new OrdersCvaService(_, __, context).next();
    }
  },
};

export default resolversOrderCvasQuery;