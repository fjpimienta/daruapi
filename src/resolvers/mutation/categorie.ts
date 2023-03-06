import { IResolvers } from '@graphql-tools/utils';
import CategoriesService from '../../services/categorie.service';

const resolversCategorieMutation: IResolvers = {
  Mutation: {
    async addCategorie(_, variables, context) {
      return new CategoriesService(_, variables, context).insert();
    },
    async addCategories(_, variables, context) {
      return new CategoriesService(_, variables, context).insertMany();
    },
    async updateCategorie(_, variables, context) {
      return new CategoriesService(_, variables, context).modify();
    },
    async deleteCategorie(_, variables, context) {
      return new CategoriesService(_, variables, context).delete();
    },
    async blockCategorie(_, { id, unblock, admin }, context) {
      return new CategoriesService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversCategorieMutation;