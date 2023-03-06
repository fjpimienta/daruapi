import GMR from 'graphql-merge-resolvers'; // Import module
import resolversApiproveedoresQuery from './apiproveedores';
import resolversBrandsQuery from './brands';
import resolversCategoriesQuery from './categories';
import resolversCodigopostalsQuery from './codigopostals';
import resolversConfigsQuery from './configs';
import resolversCountrysQuery from './countrys';
import resolversGroupsQuery from './groups';
import resolversModelsQuery from './models';
import resolversOrdersQuery from './orders';
import resolversProductsQuery from './products';
import resolversStripeCardQuery from './stripe/card';
import resolversStripeChargeQuery from './stripe/charge';
import resolversStripeCustomerQuery from './stripe/customer';
import resolversSubcategoriesQuery from './subcategories';
import resolversSuppliersQuery from './suppliers';
import resolversTagsQuery from './tags';
import resolversUsersQuery from './users';

const queryResolvers = GMR.merge([
  resolversUsersQuery,
  resolversBrandsQuery,
  resolversModelsQuery,
  resolversCategoriesQuery,
  resolversSubcategoriesQuery,
  resolversTagsQuery,
  resolversGroupsQuery,
  resolversProductsQuery,
  resolversApiproveedoresQuery,
  resolversSuppliersQuery,
  resolversCountrysQuery,
  resolversCodigopostalsQuery,
  resolversStripeCustomerQuery,
  resolversStripeCardQuery,
  resolversOrdersQuery,
  resolversStripeChargeQuery,
  resolversConfigsQuery
]);

export default queryResolvers;