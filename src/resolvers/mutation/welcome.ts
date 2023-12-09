import { IResolvers } from '@graphql-tools/utils';
import WelcomesService from '../../services/welcomes.service';

const resolversWelcomeMutation: IResolvers = {
  Mutation: {
    async addWelcome(_, variables, context) {
      return new WelcomesService(_, variables, context).insert();
    },
    async updateWelcome(_, variables, context) {
      return new WelcomesService(_, variables, context).modify();
    },
    async deleteWelcome(_, variables, context) {
      return new WelcomesService(_, variables, context).delete();
    },
    async blockWelcome(_, { id, unblock, admin }, context) {
      return new WelcomesService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversWelcomeMutation;