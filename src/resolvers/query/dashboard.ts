import { IResolvers } from '@graphql-tools/utils';
import DashboardsService from '../../services/dashboard.service';

const resolversDashboardsQuery: IResolvers = {
  Query: {
    async importBySupplier(_, variables, context) {
      return new DashboardsService(_, variables, context).getImportBySupplier();
    }
  },
};

export default resolversDashboardsQuery;