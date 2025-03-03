import { ApolloServer } from 'apollo-server-express';
import schema from './schema';
import BBVAService from './services/bbva.service';

// ...existing code...

const server = new ApolloServer({
  schema,
  dataSources: () => {
    return {
      bbvaService: new BBVAService(),
      // ...other data sources...
    };
  },
  context: async ({ req }) => {
    // ...existing context...
  }
});

// ...existing code...