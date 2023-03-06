import { IResolvers } from '@graphql-tools/utils';
import ConfigsService from '../../services/config.service';

const resolversConfigMutation: IResolvers = {
  Mutation: {
    async addConfig(_, variables, context) {
      return new ConfigsService(_, variables, context).insert();
    },
    async updateConfig(_, variables, context) {
      return new ConfigsService(_, variables, context).modify();
    },
    async deleteConfig(_, variables, context) {
      return new ConfigsService(_, variables, context).delete();
    },
    async blockConfig(_, { id, unblock, admin }, context) {
      return new ConfigsService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversConfigMutation;