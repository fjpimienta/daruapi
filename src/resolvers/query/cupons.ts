import { IResolvers } from '@graphql-tools/utils';
import CuponsService from '../../services/cupon.service';

const resolversCuponsQuery: IResolvers = {
  Query: {
    async cupons(_, variables, context) {
      return new CuponsService(_, { pagination: variables }, context).items(variables);
    },
    async cupon(_, variables, context) {
      return new CuponsService(_, variables, context).details();
    },
    async cuponId(_, __, context) {
      return new CuponsService(_, __, context).next();
    }
  },
};

export default resolversCuponsQuery;