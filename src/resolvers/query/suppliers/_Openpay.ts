import { IResolvers } from '@graphql-tools/utils';
import ExternalOpenpayService from '../../../services/externalOpenpay.service';

const resolversOpenpayQuery: IResolvers = {
  Query: {
    async createCardOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).create(variables);
    },
    async cardOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).oneCard(variables);
    },
    async listCardsOpenpay(_, __, context) {
      return new ExternalOpenpayService(_, __, context).listCards();
    },
    async deleteCardOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).delete(variables);
    },
  },
};

export default resolversOpenpayQuery;
