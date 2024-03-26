import { IResolvers } from '@graphql-tools/utils';
import DashboardsService from '../../services/dashboard.service';

const resolversDashboardsQuery: IResolvers = {
  Query: {
    async importBySupplier(_, variables, context) {
      return new DashboardsService(_, variables, context).getImportBySupplier();
    },
    async importBySupplierByMonth(_, variables, context) {
      return new DashboardsService(_, variables, context).getImportBySupplierByMonth();
    },
    async importBySupplierByWeek(_, variables, context) {
      return new DashboardsService(_, variables, context).getImportBySupplierByWeek();
    }
  },
};

export default resolversDashboardsQuery;