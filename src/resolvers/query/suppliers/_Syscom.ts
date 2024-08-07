import { IResolvers } from '@graphql-tools/utils';
import ExternalSyscomService from '../../../services/externalSyscom.service';

const resolversSyscomQuery: IResolvers = {
  Query: {
    async tokenSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getTokenSyscom();
    },
    async oneBrandSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getOneBrandSyscom();
    },
    async listBrandsSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getListBrandsSyscom();
    },
    async oneCategorySyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getOneCategorySyscom();
    },
    async listCategorysSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getListCategorySyscom();
    },
    async listProductsSyscomByBrand(_, __, context) {
      return new ExternalSyscomService(_, __, context).getListProductsSyscomByBrand();
    },
    async listProductsSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getListProductsSyscom();
    },
    async existenciaProductoSyscom(_, variables, context) {
      return new ExternalSyscomService(_, variables, context).getExistenciaProductoSyscom();
    },
    async metodosPagosSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getMetodosPagosSyscom();
    },
    async fleterasSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getFleterasSyscom();
    },
    async cfdisSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getCfdisSyscom();
    },
    async tipoCambioSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getTipoCambioSyscom();
    },
    async paisSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getPaisSyscom();
    },
    async estadoByCP(_, __, context) {
      return new ExternalSyscomService(_, __, context).getEstadoByCP();
    },
    async coloniaByCP(_, __, context) {
      return new ExternalSyscomService(_, __, context).getColoniaByCP();
    },
    async sucursalSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getSucursalSyscom();
    },
    async saveOrderSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).setOrderSyscom();
    },
    async facturasSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getFacturasSyscom();
    },
    async facturaSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getFacturaSyscom();
    },
  }
};

export default resolversSyscomQuery;