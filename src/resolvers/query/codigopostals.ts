import { IResolvers } from '@graphql-tools/utils';
import CodigopostalsService from '../../services/codigopostal.service';

const resolversCodigopostalsQuery: IResolvers = {
  Query: {
    async codigopostals(_, variables, context) {
      return new CodigopostalsService(_, { pagination: variables }, context).items(variables);
    }
  }
};

export default resolversCodigopostalsQuery;