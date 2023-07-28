import { IResolvers } from '@graphql-tools/utils';
import ExternalOpenpayService from '../../../services/externalOpenpay.service';
import Openpay from 'openpay';

const resolversOpenpayQuery: IResolvers = {
  Query: {
    async createCard(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).setNewCard(variables);
    },
    async getListCards(_, __, context) {
      return new ExternalOpenpayService(_, __, context).getListCards();
    },
  },
};

export default resolversOpenpayQuery;
