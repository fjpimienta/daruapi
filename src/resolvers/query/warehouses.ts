import { IResolvers } from '@graphql-tools/utils';
import WarehousesService from '../../services/warehouses.service';

const resolversWarehousesQuery: IResolvers = {
  Query: {
    async warehouses(_, variables, context) {
      return new WarehousesService(_, { pagination: variables }, context).items(variables);
    },
    async warehouse(_, { id }, context) {
      return new WarehousesService(_, { id }, context).details();
    },
    async warehouseId(_, __, context) {
      return new WarehousesService(_, __, context).next();
    }
  },
};

export default resolversWarehousesQuery;