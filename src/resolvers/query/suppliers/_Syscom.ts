import { IResolvers } from '@graphql-tools/utils';
import ExternalSyscomService from '../../../services/externalSyscom.service';

const resolversSyscomQuery: IResolvers = {
  Query: {
    async tokenSyscom(_, __, context) {
      return new ExternalSyscomService(_, __, context).getTokenSyscom();
    },
    async listProductsSyscomByBrand(_, __, context) {
      return new ExternalSyscomService(_, __, context).getListProductsSyscomByBrand();
    },
  }
};

export default resolversSyscomQuery;