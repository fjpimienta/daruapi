import { IResolvers } from '@graphql-tools/utils';
import ExternalBDIService from '../../../services/externalBDI.service';

const resolversBDIQuery: IResolvers = {
  Query: {
    async tokenBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getTokenBDI();
    },
    async imagenBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getImagenBDI();
    }
  }
};

export default resolversBDIQuery;