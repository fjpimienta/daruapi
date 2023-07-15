import { IResolvers } from '@graphql-tools/utils';
import External99minutosService from '../../../services/external99minutos.service';

const resolvers99minutosQuery: IResolvers = {
  Query: {
    async token99(_, __, context) {
      return new External99minutosService(_, __, context).getToken99();
    }
  },
};

export default resolvers99minutosQuery;