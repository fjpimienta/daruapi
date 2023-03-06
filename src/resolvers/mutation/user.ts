import { IResolvers } from '@graphql-tools/utils';
import UsersService from '../../services/users.service';

const resolversUserMutation: IResolvers = {
  Mutation: {
    async register(_, variables, context) {
      return new UsersService(_, variables, context).register();
    },
    async updateUser(_, variables, context) {
      return new UsersService(_, variables, context).modify();
    },
    async deleteUser(_, variables, context) {
      return new UsersService(_, variables, context).delete();
    },
    async blockUser(_, { id, unblock, admin }, context) {
      return new UsersService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversUserMutation;