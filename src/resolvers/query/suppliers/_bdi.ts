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
    async locationsBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getLocationsBDI();
    },
    async productsBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getProductsBDI();
    },
    async productsPricesBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getProductsPricesBDI();
    },
    async listProductsBDI(_, __, context) {
      return new ExternalBDIService(_, __, context).getListProductsBDI();
    },
    async existenciaProductoBDI(_, variables, context) {
      return new ExternalBDIService(_, variables, context).getExistenciaProductoBDI(variables);
    },
    async shippingIngramRates(_, variables, context) {
      return new ExternalBDIService(_, variables, context).getShippingIngramRates(variables);
    },
    async orderIngramBDI(_, variables, context) {
      return new ExternalBDIService(_, variables, context).setOrderIngramBDI(variables);
    }
  }
};

export default resolversBDIQuery;