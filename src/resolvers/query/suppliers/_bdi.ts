import { IResolvers } from '@graphql-tools/utils';
import ExternalBDIService from '../../../services/externalBDI.service';

const resolversBDIQuery: IResolvers = {
  Query: {
    async tokenBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getTokenBDI();
    },
    async brandsBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getBrandsBDI();
    },
    async categoriesBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getCategoriesBDI();
    },
    async productsBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getProductsBDI();
    }
  }
};

export default resolversBDIQuery;