import GMR from 'graphql-merge-resolvers'; // Import module
import resolversStripeCardQuery from './card';
import resolversStripeChargeQuery from './charge';
import resolversStripeCustomerQuery from './customer';

const queryStripeResolvers = GMR.merge([
  resolversStripeCustomerQuery,
  resolversStripeCardQuery,
  resolversStripeChargeQuery
]);

export default queryStripeResolvers;