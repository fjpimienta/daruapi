import { IResolvers } from '@graphql-tools/utils';
import TagsService from '../../services/tag.service';

const resolversTagMutation: IResolvers = {
  Mutation: {
    async addTag(_, variables, context) {
      return new TagsService(_, variables, context).insert();
    },
    async updateTag(_, variables, context) {
      return new TagsService(_, variables, context).modify();
    },
    async deleteTag(_, variables, context) {
      return new TagsService(_, variables, context).delete();
    },
    async blockTag(_, { id, unblock, admin }, context) {
      return new TagsService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversTagMutation;