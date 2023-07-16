import { IResolvers } from '@graphql-tools/utils';
import ExternalCtsService from '../../../services/externalCts.service';

const resolversCtsQuery: IResolvers = {
  Query: {
    async tokenCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getTokenCt();
    }
  },
};

export default resolversCtsQuery;