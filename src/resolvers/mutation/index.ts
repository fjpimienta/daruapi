import GMR from 'graphql-merge-resolvers'; // Import module
import resolversBrandMutation from './brand';
import resolversCategorieMutation from './categorie';
import resolversConfigMutation from './config';
import resolversMailMutation from './email';
import resolversGroupMutation from './group';
import resolversModelMutation from './model';
import resolversProductMutation from './product';
import resolversShippingMutation from './shipping';
import mutationStripeResolvers from './stripe';
import resolversSubcategorieMutation from './subcategorie';
import resolversSupplierMutation from './supplier';
import resolversTagMutation from './tag';
import resolversUserMutation from './user';

const mutationResolvers = GMR.merge([
  resolversUserMutation,
  resolversBrandMutation,
  resolversModelMutation,
  resolversCategorieMutation,
  resolversSubcategorieMutation,
  resolversTagMutation,
  resolversGroupMutation,
  resolversMailMutation,
  resolversSupplierMutation,
  resolversProductMutation,
  mutationStripeResolvers,
  resolversConfigMutation,
  resolversShippingMutation
]);

export default mutationResolvers;