import { IResolvers } from '@graphql-tools/utils';
import ExternalOpenpayService from '../../../services/externalOpenpay.service';

const resolversOpenpayQuery: IResolvers = {
  Query: {
    async createCustomerOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).createCustomer(variables);
    },
    async updateCustomerOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).updateCustomer(variables);
    },
    async deleteCustomerOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).deleteCustomer(variables);
    },
    async customerOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).oneCustomer(variables);
    },
    async listCustomersOpenpay(_, __, context) {
      return new ExternalOpenpayService(_, __, context).listCustomers();
    },

    async createCardOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).createCard(variables);
    },
    async cardOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).oneCard(variables);
    },
    async listCardsOpenpay(_, __, context) {
      return new ExternalOpenpayService(_, __, context).listCards();
    },
    async deleteCardOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).deleteCard(variables);
    },

    async createChargeOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).createCharge(variables);
    },
    async captureChargeOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).captureCharge(variables);
    },
    async refundChargeOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).refundCharge(variables);
    },
    async chargeOpenpay(_, variables, context) {
      return new ExternalOpenpayService(_, variables, context).oneCharge(variables);
    },
    async listChargesOpenpay(_, __, context) {
      return new ExternalOpenpayService(_, __, context).listCharges();
    },
  },
};

export default resolversOpenpayQuery;
