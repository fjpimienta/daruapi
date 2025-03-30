import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express, { Request } from 'express';
import schema from './schema';

// Inicializa la aplicación Express
const app = express();

const server = new ApolloServer({
  schema,
  introspection: true,
});

app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }: { req: Request }) => {
      return { req }; // Ahora 'req' tiene un tipo explícito
    },
  })
);