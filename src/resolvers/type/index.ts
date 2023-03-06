import GMR from 'graphql-merge-resolvers';
import typeStripeResolvers from './stripe';

const typeResolvers = GMR.merge([
   // Stripe
   typeStripeResolvers
]);

export default typeResolvers;