import { IResolvers } from '@graphql-tools/utils';
import ExternalCtsService from '../../../services/externalCts.service';
import { Promocion } from '../../../models/promocion';

const resolversCtsQuery: IResolvers = {
  ResponseValueUnion: {
    __resolveType(value: any) {
      // Determinar el tipo concreto de 'value' en la unión 'ResponseValueUnion'
      if (typeof value === 'number') {
        return 'Float';
      } else if (value instanceof Promocion) {
        return 'Promocion';
      }
      return null;
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