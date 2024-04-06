import { IResolvers } from '@graphql-tools/utils';
import ExternalSyscomService from '../../../services/externalSyscom.service';

const resolversSyscomQuery: IResolvers = {
  Query: {
    async tokenSyscom(_, __, context) {
      console.log('tokenSyscom');
      return new ExternalSyscomService(_, __, context).getTokenSyscom();
    },
  }
};

export default resolversSyscomQuery;