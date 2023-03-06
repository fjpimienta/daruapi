import { IResolvers } from '@graphql-tools/utils';
import SubcategoriesService from '../../services/subcategorie.service';

const resolversSubcategoriesQuery: IResolvers = {
  Query: {
    async subcategories(_, variables, context) {
      return new SubcategoriesService(_, { pagination: variables }, context).items(variables);
    },
    async subcategorie(_, { id }, context) {
      return new SubcategoriesService(_, { id }, context).details();
    },
    async subcategorieId(_, __, context) {
      return new SubcategoriesService(_, __, context).next();
    }
  },
};

export default resolversSubcategoriesQuery;