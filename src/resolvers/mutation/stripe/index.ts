import GMR from 'graphql-merge-resolvers'; // Import module
import resolversStripeCardMutation from './card';
import resolversStripeChargeMutation from './charge';
import resolversStripeCustomerMutation from './customer';

const mutationStripeResolvers = GMR.merge([
  resolversStripeCustomerMutation,
  resolversStripeCardMutation,
  resolversStripeChargeMutation
]);

export default mutationStripeResolvers;