import { IResolvers } from '@graphql-tools/utils';
import WelcomesService from '../../services/welcomes.service';

const resolversWelcomesQuery: IResolvers = {
  Query: {
    async welcomes(_, variables, context) {
      return new WelcomesService(_, { pagination: variables }, context).items(variables);
    },
    async welcome(_, variables, context) {
      return new WelcomesService(_, variables, context).details();
    },
    async welcomeByField(_, variables, context) {
      return new WelcomesService(_, variables, context).detailsByField();
    },
    async welcomeId(_, __, context) {
      return new WelcomesService(_, __, context).next();
    }
  },
};

export default resolversWelcomesQuery;