import GMR from 'graphql-merge-resolvers'; // Import module
import resolversApiproveedoresQuery from './apiproveedores';
import resolversBrandsQuery from './brands';
import resolversBrandsGroupsQuery from './brandsgroups';
import resolversCategoriesQuery from './categories';
import resolversCategorysGroupsQuery from './categorysgroups';
import resolversCodigopostalsQuery from './codigopostals';
import resolversConfigsQuery from './configs';
import resolversCountrysQuery from './countrys';
import resolversGroupsQuery from './groups';
import resolversModelsQuery from './models';
import resolversOrdersQuery from './orders';
import resolversProductsQuery from './products';
import resolversShippingsQuery from './shippings';
import resolversStripeCardQuery from './stripe/card';
import resolversStripeChargeQuery from './stripe/charge';
import resolversStripeCustomerQuery from './stripe/customer';
import resolversSubcategoriesQuery from './subcategories';
import resolversSuppliersQuery from './suppliers/suppliers';
import resolversOrderCtsQuery from './suppliers/orderct';
import resolversOrderCvasQuery from './suppliers/ordercva';
import resolversTagsQuery from './tags';
import resolversUsersQuery from './users';
import resolversWarehousesQuery from './warehouses';

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
  resolversConfigsQuery,
  resolversWarehousesQuery,
  resolversShippingsQuery,
  resolversBrandsGroupsQuery,
  resolversCategorysGroupsQuery,
  resolversOrderCtsQuery,
  resolversOrderCvasQuery
]);

export default queryResolvers;