import { IResolvers } from '@graphql-tools/utils';
import CategoryGroupsService from '../../services/categorysgroup.service';

const resolversCategorysGroupsQuery: IResolvers = {
  Query: {
    async categorysgroups(_, __, context) {
      return new CategoryGroupsService(_, __, context).items();
    },
  },
};

export default resolversCategorysGroupsQuery;