import { IResolvers } from '@graphql-tools/utils';
import ExternalDaisytekService from '../../../services/externalDaisytek.service';

const resolversDaisytekQuery: IResolvers = {
  Query: {
    async tokenDaisytek(_, __, context) {
      return new ExternalDaisytekService(_, __, context).getTokenDaisytek();
    },
    async productsDaisytek(_, __, context) {
      return new ExternalDaisytekService(_, __, context).getProductsDaisytek();
    },
    async listProductsDaisytek(_, __, context) {
      return new ExternalDaisytekService(_, __, context).getListProductsDaisytek();
    },
    async existenciaProductoDaisytek(_, __, context) {
      return new ExternalDaisytekService(_, __, context).getExistenciaProductoDaisytek();
    }
  }
};

export default resolversDaisytekQuery;