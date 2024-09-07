import { IResolvers } from '@graphql-tools/utils';
import SlidersService from '../../services/sliders.service';

const resolversSlidersQuery: IResolvers = {
  Query: {
    async sliders(_, variables, context) {
      return new SlidersService(_, variables, context).items(variables);
    }
  },
};

export default resolversSlidersQuery;