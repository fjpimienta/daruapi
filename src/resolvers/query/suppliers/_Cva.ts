import { IResolvers } from '@graphql-tools/utils';
import ExternalCvasService from '../../../services/externalCvas.service';

const resolversCvasQuery: IResolvers = {
  Query: {
    async tokenCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getTokenCva();
    },
    async shippingCvaRates(_, variables, context) {
      return new ExternalCvasService(_, variables, context).getShippingCvaRates(variables);
    },
    async listOrdersCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getListOrdersCva();
    },
    async consultaOrderCva(_, variables, context) {
      return new ExternalCvasService(_, variables, context).getConsultaOrderCva(variables);
    },
    async orderCva(_, variables, context) {
      return new ExternalCvasService(_, variables, context).setOrderCva(variables);
    },
    async listBrandsCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getListBrandsCva();
    },
    async listGroupsCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getListGroupsCva();
    },
    async listSolucionesCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getListSolucionesCva();
    },
    async listSucursalesCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getListSucursalesCva();
    },
    async listPaqueteriasCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getListPaqueteriasCva();
    },
    async listPricesCva(_, variables, context) {
      return new ExternalCvasService(_, variables, context).getListPricesCva(variables);
    },
    async listProductsCva(_, __, context) {
      return new ExternalCvasService(_, __, context).getListProductsCva();
    },
    async listProductsCvaByGroup(_, __, context) {
      return new ExternalCvasService(_, __, context).getListProductsCvaByGroup();
    }
  },
};

export default resolversCvasQuery;