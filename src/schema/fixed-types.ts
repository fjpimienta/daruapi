import { gql } from 'graphql-tag';

// Tipos base explícitos que siempre estarán disponibles
export const baseTypes = gql`
  type Query {
    _: Boolean
  }

  type Mutation {
    _: Boolean
  }

  type Subscription {
    _: Boolean
  }
`;

// Resolver base vacío pero válido para Query
export const baseResolvers = {
  Query: {
    _: () => true
  }
};
