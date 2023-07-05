import { IResolvers } from '@graphql-tools/utils';
import OrdersCtService from '../../../services/suppliers/orderct.service';

const resolversOrderCtsMutation: IResolvers = {
  Mutation: {
    async addOrderCt(_, variables, context) {
      return new OrdersCtService(_, variables, context).insert();
    }
  },
};

export default resolversOrderCtsMutation;