import { IResolvers } from '@graphql-tools/utils';
import ExternalCtsService from '../../../services/externalCts.service';

const resolversCtsQuery: IResolvers = {
  Query: {
    async tokenCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getTokenCt();
    },
    async shippingCtRates(_, variables, context) {
      return new ExternalCtsService(_, variables, context).setShippingCtRates(variables);
    },
    async jsonProductsCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getJsonProductsCt();
    },
    async jsonProductsCtHP(_, __, context) {
      return new ExternalCtsService(_, __, context).getJsonProductsCtHP();
    },
    async existenciaProductoCt(_, variables, context) {
      return new ExternalCtsService(_, variables, context).getExistenciaProductoCt(variables);
    },
    async stockProductsCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getStockProductsCt();
    },
    async orderCt(_, variables, context) {
      return new ExternalCtsService(_, variables, context).setOrderCt(variables);
    },
    async confirmOrderCt(_, variables, context) {
      return new ExternalCtsService(_, variables, context).setConfirmOrderCt(variables);
    },
    async listOrdersCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getListOrderCt();
    },
    async statusOrdersCt(_, variables, context) {
      return new ExternalCtsService(_, variables, context).getStatusOrderCt(variables);
    },
    async detailOrdersCt(_, variables, context) {
      return new ExternalCtsService(_, variables, context).getDetailOrderCt(variables);
    },
    async volProductCt(_, variables, context) {
      return new ExternalCtsService(_, variables, context).getVolProductCt(variables);
    }
  },
};

export default resolversCtsQuery;