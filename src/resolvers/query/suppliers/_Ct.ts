import { IResolvers } from '@graphql-tools/utils';
import ExternalCtsService from '../../../services/externalCts.service';

// Agrega esta función de resolución antes de definir los resolvers de GraphQL
const resolveResponseValueUnionType = (obj: any) => {
  // Verifica si el objeto es una instancia de Promocion
  if (obj && typeof obj.precio === 'number' && obj.vigente !== undefined) {
    return 'Promocion'; // Devuelve el nombre del tipo concreto (Promocion) dentro de la unión
  }

  // Si no es una instancia de Promocion, devuelve null o undefined
  return null;
};

const resolversCtsQuery: IResolvers = {
  ResponseValueUnion: {
    __resolveType(value: any) {
      if (typeof value === 'number') {
        return 'Float';
      } else if (value && typeof value === 'object' && value.hasOwnProperty('precio') && value.hasOwnProperty('vigente')) {
        return 'Promocion';
      }
      return null; // Devolver null si no se puede determinar el tipo.
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
  }
};

export default resolversCtsQuery;