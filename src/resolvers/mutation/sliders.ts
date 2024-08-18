import { IResolvers } from '@graphql-tools/utils';
import SlidersService from '../../services/sliders.service';

const resolversSlidersMutation: IResolvers = {
  Mutation: {
    async addSliders(_, variables, context) {
      return new SlidersService(_, variables, context).insert();
    },
    async updateSliders(_, variables, context) {
      return new SlidersService(_, variables, context).modify();
    },
    async deleteSliders(_, variables, context) {
      return new SlidersService(_, variables, context).delete();
    },
    async blockSliders(_, { id, unblock, admin }, context) {
      return new SlidersService(_, { id }, context).unblock(unblock, admin);
    }
  }
};

export default resolversSlidersMutation;