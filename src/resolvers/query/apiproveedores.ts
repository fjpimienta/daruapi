import { IResolvers } from '@graphql-tools/utils';
import ApiproveedoresService from '../../services/apiproveedores.service';

const resolversApiproveedoresQuery: IResolvers = {
  Query: {
    async apiproveedores(_, variables, context) {
      return new ApiproveedoresService(_, { pagination: variables }, context).items(variables);
    },
    async apiproveedor(_, variables, context) {
      return new ApiproveedoresService(_, variables, context).details(variables);
    },
    async apiproveedorId(_, __, context) {
      return new ApiproveedoresService(_, __, context).next();
    }
  },
};

export default resolversApiproveedoresQuery;