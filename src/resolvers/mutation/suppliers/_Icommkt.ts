import { IResolvers } from '@graphql-tools/utils';
import ExternalIcommktsService from '../../../services/externalIcommkt.service';

const resolversIcommktMutation: IResolvers = {
  Mutation: {
    async addContact(_, variables, context) {
      return new ExternalIcommktsService(_, variables, context).setAddContact(variables);
    },
    async updateContact(_, variables, context) {
      return new ExternalIcommktsService(_, variables, context).setUpdateContact(variables);
    },
    async removeContact(_, variables, context) {
      return new ExternalIcommktsService(_, variables, context).setRemoveContact(variables);
    }
  }
};

export default resolversIcommktMutation;