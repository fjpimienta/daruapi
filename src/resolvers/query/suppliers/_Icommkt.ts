import { IResolvers } from '@graphql-tools/utils';
import ExternalIcommktsService from '../../../services/externalIcommkt.service';

const resolversIcommktQuery: IResolvers = {
  Query: {
    async icommktContacts(_, variables, context) {
      return new ExternalIcommktsService(_, variables, context).getIcommktContacts();
    },
    async icommktContact(_, variables, context) {
      return new ExternalIcommktsService(_, variables, context).getIcommktContact(variables);
    }
  }
};

export default resolversIcommktQuery;