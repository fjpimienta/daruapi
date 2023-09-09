import { IResolvers } from '@graphql-tools/utils';
import CuponsService from '../../services/cupon.service';

const resolversCuponMutation: IResolvers = {
  Mutation: {
    async addCupon(_, variables, context) {
      return new CuponsService(_, variables, context).insert();
    },
    async updateCupon(_, variables, context) {
      return new CuponsService(_, variables, context).modify();
    },
    async deleteCupon(_, variables, context) {
      return new CuponsService(_, variables, context).delete();
    },
    async blockCupon(_, { id, unblock, admin }, context) {
      return new CuponsService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversCuponMutation;