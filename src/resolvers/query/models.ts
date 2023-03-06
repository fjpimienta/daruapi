import { IResolvers } from '@graphql-tools/utils';
import ModelsService from '../../services/model.service';

const resolversModelsQuery: IResolvers = {
  Query: {
    async models(_, variables, context) {
      return new ModelsService(_, { pagination: variables }, context).items(variables);
    },
    async model(_, { id }, context) {
      return new ModelsService(_, { id }, context).details();
    },
    async modelId(_, __, context) {
      return new ModelsService(_, __, context).next();
    }
  },
};

export default resolversModelsQuery;