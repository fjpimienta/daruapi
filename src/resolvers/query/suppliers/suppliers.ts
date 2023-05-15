import { IResolvers } from '@graphql-tools/utils';
import SuppliersService from '../../../services/suppliers/supplier.service';

const resolversSuppliersQuery: IResolvers = {
  Query: {
    async suppliers(_, variables, context) {
      return new SuppliersService(_, { pagination: variables }, context).items(variables);
    },
    async supplier(_, { id }, context) {
      return new SuppliersService(_, { id }, context).details();
    },
    async supplierId(_, __, context) {
      return new SuppliersService(_, __, context).next();
    },
    async apiSupplier(_, variables, context) {
      return new SuppliersService(_, variables, context).api();
    }
  },
};

export default resolversSuppliersQuery;