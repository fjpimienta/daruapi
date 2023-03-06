import { IResolvers } from '@graphql-tools/utils';
import ConfigsService from '../../services/config.service';

const resolversConfigsQuery: IResolvers = {
  Query: {
    async config(_, variables, context) {
      return new ConfigsService(_, variables, context).details();
    }
  },
};

export default resolversConfigsQuery;