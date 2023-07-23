import { IResolvers } from '@graphql-tools/utils';
import ExternalCtsService from '../../../services/externalCts.service';

// Agrega esta función de resolución antes de definir los resolvers de GraphQL
const resolveResponseValueUnionType = (obj: any) => {
  if (obj && typeof obj.precio === 'number' && obj.vigente !== undefined) {
    return 'Promocion';
  }
  return null;
};

const resolversCtsQuery: IResolvers = {
  ResponseValueUnion: {
    __resolveType(value: any) {
      return resolveResponseValueUnionType(value);
    },
  },
  AlmacenDinamico: {
    value(parent: any) {
      return parent.value;
    },
  },
  Query: {
    async tokenCt(_, __, context) {
      return new ExternalCtsService(_, __, context).getTokenCt();
    },
    async shippingCtRates(_, variables, context) {
      return new ExternalCtsService(_, variables, context).setShippingCtRates(variables);
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
  Promocion: {
    precio(parent: any) {
      return parent.precio;
    },
    vigente(parent: any) {
      return parent.vigente;
    },
  },
};

export default resolversCtsQuery;