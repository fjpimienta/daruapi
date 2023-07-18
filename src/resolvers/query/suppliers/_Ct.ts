import { IResolvers } from '@graphql-tools/utils';
import ExternalCtsService from '../../../services/externalCts.service';

const resolversCtsQuery: IResolvers = {
  Query: {
    async tokenCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getTokenCt();
    },
    async shippingCtRates(_, variables, context) {
      return new ExternalCtsService(_, variables, context).getShippingCtRates(variables);
    },
    async orderCt(_, variables, context) {
      return new ExternalCtsService(_, variables, context).getOrderCt(variables);
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