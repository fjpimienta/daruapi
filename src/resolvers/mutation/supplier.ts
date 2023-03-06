import { IResolvers } from '@graphql-tools/utils';
import SuppliersService from '../../services/supplier.service';

const resolversSupplierMutation: IResolvers = {
  Mutation: {
    async addSupplier(_, variables, context) {
      return new SuppliersService(_, variables, context).insert();
    },
    async updateSupplier(_, variables, context) {
      return new SuppliersService(_, variables, context).modify();
    },
    async deleteSupplier(_, variables, context) {
      return new SuppliersService(_, variables, context).delete();
    },
    async blockSupplier(_, { id, unblock, admin }, context) {
      return new SuppliersService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversSupplierMutation;