import { IResolvers } from '@graphql-tools/utils';
import SubcategoriesService from '../../services/subcategorie.service';

const resolversSubcategorieMutation: IResolvers = {
  Mutation: {
    async addSubcategorie(_, variables, context) {
      return new SubcategoriesService(_, variables, context).insert();
    },
    async updateSubcategorie(_, variables, context) {
      return new SubcategoriesService(_, variables, context).modify();
    },
    async deleteSubcategorie(_, variables, context) {
      return new SubcategoriesService(_, variables, context).delete();
    },
    async blockSubcategorie(_, { id, unblock, admin }, context) {
      return new SubcategoriesService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversSubcategorieMutation;