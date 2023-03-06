import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import environments from './config/environments';
import { ApolloServer } from 'apollo-server-express';
import schema from './schema';
import expressPlayground from 'graphql-playground-middleware-express';
import Database from './lib/database';
import { IContext } from './interfaces/context.interface';
import chalk from 'chalk';

const uploadFile = require('./middleware/multer');

// Configuración de las variables de entorno (lectura)
if (process.env.NODE_ENV !== 'production') {
  const env = environments;
  console.log(env);
}

async function init() {

  const app = express();

  app.use(cors());

  app.use(compression());

  app.use(express.json({ limit: '50mb' }));

  const database = new Database();

  const db = await database.init();

  const context = async ({ req, connection }: IContext) => {
    const token = (req) ? req.headers.authorization : connection.authorization;
    return { db, token };
  };

  const server = new ApolloServer({
    schema,
    introspection: true,
    context
  });

  await server.applyMiddleware({ app });

  app.get('/graphiql', cors(), expressPlayground({
    endpoint: '/graphql'
  }));

  app.post('/uploadFile', uploadFile(), (req, res) => {
    res.send({ 'status': 'Ok' });
  });

  const httpServer = createServer(app);
  const PORT = process.env.PORT || 3000;

  httpServer.listen(
    {
      port: PORT
    },
    () => {
      console.log('=================SERVER API GRAPHQL=====================');
      console.log(`STATUS: ${chalk.greenBright('ONLINE')}`);
      console.log(`MESSAGE: ${chalk.greenBright('API DARU - MarketPlace !!!')}`);
      console.log(`GraphQL Server => @: http://localhost:${PORT}/graphql`);
      console.log(`WS Connection => @: ws://localhost:${PORT}/graphql`);
    }
  );

}

init();