import { IResolvers } from '@graphql-tools/utils';
import TagsService from '../../services/tag.service';

const resolversTagsQuery: IResolvers = {
  Query: {
    async tags(_, variables, context) {
      return new TagsService(_, { pagination: variables }, context).items(variables);
    },
    async tag(_, { id }, context) {
      return new TagsService(_, { id }, context).details();
    },
    async tagId(_, __, context) {
      return new TagsService(_, __, context).next();
    }
  },
};

export default resolversTagsQuery;