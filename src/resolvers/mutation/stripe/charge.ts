import { IResolvers } from '@graphql-tools/utils';
import StripeChargeService from '../../../services/stripe/charge.service';

const resolversStripeChargeMutation: IResolvers = {
  Mutation: {
    async chargeOrder(_, { payment, order }, { db }) {
      return new StripeChargeService().order(payment, order, db);
    }
  }
};

export default resolversStripeChargeMutation;