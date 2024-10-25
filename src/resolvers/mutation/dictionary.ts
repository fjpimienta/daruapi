import { IResolvers } from '@graphql-tools/utils';
import DictionarysService from '../../services/dictionary.service';

const resolversDictionaryMutation: IResolvers = {
  Mutation: {
    async addDictionary(_, variables, context) {
      return new DictionarysService(_, variables, context).insert();
    },
    async updateDictionary(_, variables, context) {
      return new DictionarysService(_, variables, context).modify();
    },
    async deleteDictionary(_, variables, context) {
      return new DictionarysService(_, variables, context).delete();
    },
    async blockDictionary(_, { id, unblock, admin }, context) {
      return new DictionarysService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversDictionaryMutation;