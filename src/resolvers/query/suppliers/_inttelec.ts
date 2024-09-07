import { IResolvers } from '@graphql-tools/utils';
import ExternalInttelecService from '../../../services/externalInttelec.service';

const resolversInttelecQuery: IResolvers = {
  Query: {
    async tokenInttelec(_, __, context) {
      return new ExternalInttelecService(_, __, context).getTokenInttelec();
    },
    async productsInttelec(_, __, context) {
      return new ExternalInttelecService(_, __, context).getProductsInttelec();
    },
    async listProductsInttelec(_, __, context) {
      return new ExternalInttelecService(_, __, context).getListProductsInttelec();
    },
    async existenciaProductoInttelec(_, __, context) {
      return new ExternalInttelecService(_, __, context).getExistenciaProductoInttelec();
    },
    async addOrderInttelec(_, __, context) {
      return new ExternalInttelecService(_, __, context).setOrderInttelec();
    }
  }
};

export default resolversInttelecQuery;