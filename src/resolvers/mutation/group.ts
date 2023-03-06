import { IResolvers } from '@graphql-tools/utils';
import GroupsService from '../../services/group.service';

const resolversGroupMutation: IResolvers = {
  Mutation: {
    async addGroup(_, variables, context) {
      return new GroupsService(_, variables, context).insert();
    },
    async addGroups(_, variables, context) {
      return new GroupsService(_, variables, context).insertMany();
    },
    async updateGroup(_, variables, context) {
      return new GroupsService(_, variables, context).modify();
    },
    async deleteGroup(_, variables, context) {
      return new GroupsService(_, variables, context).delete();
    },
    async blockGroup(_, { id, unblock, admin }, context) {
      return new GroupsService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversGroupMutation;