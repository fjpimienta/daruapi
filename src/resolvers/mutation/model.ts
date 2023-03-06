import { IResolvers } from '@graphql-tools/utils';
import ModelsService from '../../services/model.service';

const resolversModelMutation: IResolvers = {
  Mutation: {
    async addModel(_, variables, context) {
      return new ModelsService(_, variables, context).insert();
    },
    async updateModel(_, variables, context) {
      return new ModelsService(_, variables, context).modify();
    },
    async deleteModel(_, variables, context) {
      return new ModelsService(_, variables, context).delete();
    },
    async blockModel(_, { id, unblock, admin }, context) {
      return new ModelsService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversModelMutation;