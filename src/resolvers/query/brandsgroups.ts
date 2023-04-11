import { IResolvers } from '@graphql-tools/utils';
import BrandGroupsService from '../../services/brandsgroup.service';

const resolversBrandsGroupsQuery: IResolvers = {
  Query: {
    async brandsgroups(_, __, context) {
      return new BrandGroupsService(_, __, context).items();
    },
  },
};

export default resolversBrandsGroupsQuery;