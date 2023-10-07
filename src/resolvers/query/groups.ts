import { IResolvers } from '@graphql-tools/utils';
import GroupsService from '../../services/group.service';

const resolversGroupsQuery: IResolvers = {
  Query: {
    async groups(_, variables, context) {
      return new GroupsService(_, { pagination: variables }, context).items(variables);
    },
    async group(_, { id }, context) {
      return new GroupsService(_, { id }, context).details();
    },
    async groupId(_, __, context) {
      return new GroupsService(_, __, context).next();
    },
    async subGroup(_, variables, context) {
      return new GroupsService(_, variables, context).subGroup(variables);
    }
  },
};

export default resolversGroupsQuery;