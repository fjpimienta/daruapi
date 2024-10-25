import { IResolvers } from '@graphql-tools/utils';
import DictionarysService from '../../services/dictionary.service';

const resolversDictionarysQuery: IResolvers = {
  Query: {
    async dictionarys(_, variables, context) {
      return new DictionarysService(_, { pagination: variables }, context).items(variables);
    },
    async dictionary(_, { id }, context) {
      return new DictionarysService(_, { id }, context).details();
    },
    async dictionaryId(_, __, context) {
      return new DictionarysService(_, __, context).next();
    }
  },
};

export default resolversDictionarysQuery;