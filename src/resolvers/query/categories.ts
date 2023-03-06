import { IResolvers } from '@graphql-tools/utils';
import CategoriesService from '../../services/categorie.service';

const resolversCategoriesQuery: IResolvers = {
  Query: {
    async categories(_, variables, context) {
      return new CategoriesService(_, { pagination: variables }, context).items(variables);
    },
    async categorie(_, { id }, context) {
      return new CategoriesService(_, { id }, context).details();
    },
    async categorieId(_, __, context) {
      return new CategoriesService(_, __, context).next();
    }
  },
};

export default resolversCategoriesQuery;