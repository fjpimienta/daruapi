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
import resolversDeliverysQuery from './deliverys';
import resolvers99minutosQuery from './suppliers/_99minutos';
import resolversCtsQuery from './suppliers/_Ct';
import resolversCvasQuery from './suppliers/_Cva';
import resolversOpenpayQuery from './suppliers/_Openpay';
import resolversCuponsQuery from './cupons';
import resolversIcecatQuery from './suppliers/_icecat';
import resolversIngramQuery from './suppliers/_Ingram';
import resolversInvoiceConfigsQuery from './invoiceconfig';
import resolversWelcomesQuery from './welcomes';
import resolversIcommktQuery from './suppliers/_Icommkt';
import resolversDashboardsQuery from './dashboard';
import resolversSyscomQuery from './suppliers/_Syscom';
import resolversBDIQuery from './suppliers/_bdi';
import resolversDaisytekQuery from './suppliers/_daisytek';
import resolversSlidersQuery from './sliders';
import resolversInttelecQuery from './suppliers/_inttelec';

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
  resolversOrderCvasQuery,
  resolversDeliverysQuery,
  resolvers99minutosQuery,
  resolversCtsQuery,
  resolversCvasQuery,
  resolversOpenpayQuery,
  resolversCuponsQuery,
  resolversIcecatQuery,
  resolversIngramQuery,
  resolversInvoiceConfigsQuery,
  resolversWelcomesQuery,
  resolversIcommktQuery,
  resolversDashboardsQuery,
  resolversSyscomQuery,
  resolversBDIQuery,
  resolversDaisytekQuery,
  resolversSlidersQuery,
  resolversInttelecQuery
]);

export default queryResolvers;