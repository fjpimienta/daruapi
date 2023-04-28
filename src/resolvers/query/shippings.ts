import { IResolvers } from '@graphql-tools/utils';
import ShippingsService from '../../services/shipping.service';

const resolversShippingsQuery: IResolvers = {
  Query: {
    async shippings(_, variables, context) {
      return new ShippingsService(_, { pagination: variables }, context).items(variables);
    },
    async shipping(_, { id }, context) {
      return new ShippingsService(_, { id }, context).details();
    },
    async shippingId(_, __, context) {
      return new ShippingsService(_, __, context).next();
    }
  },
};

export default resolversShippingsQuery;