import { IResolvers } from '@graphql-tools/utils';
import StripeCustomerService from '../../../services/stripe/customer.service';

const resolversStripeCustomerQuery: IResolvers = {
  Query: {
    async customer(_, { id }) {
      return new StripeCustomerService().get(id);
    },
    async customerByEmail(_, { email }) {
      return new StripeCustomerService().existeCustomer(email);
    },
    async customers(_, { limit, startingAfter, endingBefore }) {
      return new StripeCustomerService().list(limit, startingAfter, endingBefore);
    }
  },
};

export default resolversStripeCustomerQuery;