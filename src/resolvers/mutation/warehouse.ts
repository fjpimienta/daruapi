import { IResolvers } from '@graphql-tools/utils';
import WarehousesService from '../../services/warehouses.service';

const resolversWarehouseMutation: IResolvers = {
  Mutation: {
    async addWarehouse(_, variables, context) {
      return new WarehousesService(_, variables, context).insert();
    },
    // async addWarehouses(_, variables, context) {
    //   return new WarehousesService(_, variables, context).insertMany();
    // },
    async updateWarehouse(_, variables, context) {
      return new WarehousesService(_, variables, context).modify();
    },
    async deleteWarehouse(_, variables, context) {
      return new WarehousesService(_, variables, context).delete();
    },
    async blockWarehouse(_, { id, unblock, admin }, context) {
      return new WarehousesService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversWarehouseMutation;