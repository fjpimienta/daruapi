import GMR from 'graphql-merge-resolvers';
import resolversStripeChargeStripeType from './charge';

const typeStripeResolvers = GMR.merge([
   resolversStripeChargeStripeType
]);

export default typeStripeResolvers;