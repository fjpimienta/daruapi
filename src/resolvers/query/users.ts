import { IResolvers } from '@graphql-tools/utils';
import UsersService from '../../services/users.service';

const resolversUserQuery: IResolvers = {
  Query: {
    async users(_, variables, context) {
      return new UsersService(_, { pagination: variables }, context).items(variables);
    },
    async login(_, { email, password }, context) {
      return new UsersService(
        _, { user: { email, password } }, context
      ).login();
    },
    async userId(_, __, context) {
      return new UsersService(_, __, context).next();
    },
    async me(_, __, { token }) {
      return new UsersService(_, __, { token }).auth();
    }
  }
};

export default resolversUserQuery;