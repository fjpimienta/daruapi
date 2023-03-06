import { IResolvers } from '@graphql-tools/utils';
import CountrysService from '../../services/country.service';

const resolversCountrysQuery: IResolvers = {
  Query: {
    async countrys(_, variables, context) {
      return new CountrysService(_, { pagination: variables }, context).items(variables);
    },
    async country(_, variables, context) {
      return new CountrysService(_, variables, context).details();
    }
  },
};

export default resolversCountrysQuery;