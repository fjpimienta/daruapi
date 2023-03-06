import { IResolvers } from '@graphql-tools/utils';
import query from './query';
import mutation from './mutation';
import type from './type';

const resolvers: IResolvers = {
  ...query,
  ...mutation,
  ...type
};

export default resolvers;