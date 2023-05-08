import { IResolvers } from '@graphql-tools/utils';
import OrdersCvaService from '../../../services/suppliers/ordercva.service';

const resolversOrderCvasMutation: IResolvers = {
  Mutation: {
    async addOrderCva(_, variables, context) {
      return new OrdersCvaService(_, variables, context).insert();
    }
  },
};

export default resolversOrderCvasMutation;