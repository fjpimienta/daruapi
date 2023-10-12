import { IResolvers } from '@graphql-tools/utils';
import ExternalIcecatsService from '../../../services/externalIcecat.service';

const resolversIcecatQuery: IResolvers = {
  Query: {
    async icecatProduct(_, variables, context) {
      return new ExternalIcecatsService(_, variables, context).getICecatProduct(variables);
    }
  }
};

export default resolversIcecatQuery;