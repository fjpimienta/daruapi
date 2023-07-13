import express, { Express } from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer, Server } from 'http';
import environments from './config/environments';
import { ApolloServer } from 'apollo-server-express';
import schema from './schema';
import expressPlayground from 'graphql-playground-middleware-express';
import Database from './lib/database';
import { IContext } from './interfaces/context.interface';
import chalk from 'chalk';
import logger from './utils/logger';
import loggerMiddleware from './utils/loggerMiddleware';
import https from 'https';
import fs from 'fs';

// Configuración de las variables de entorno (lectura)
if (process.env.NODE_ENV !== 'production') {
  const env = environments;
  console.log(env);
}

const httpsOptions = {
  key: fs.readFileSync('src/_.daru.mx_private_key.key'),
  cert: fs.readFileSync('src/daru.mx_ssl_certificate.cer'),
};

async function init(): Promise<void> {
  const app: Express = express();

  app.use(cors());

  app.use(compression());

  app.use(express.json({ limit: '50mb' }));
  
  app.use(loggerMiddleware(logger));

  const database = new Database();

  const db = await database.init();

  const server: ApolloServer = new ApolloServer({
    schema,
    introspection: true,
    context: async ({ req, connection }: IContext) => {
      const token = (req) ? req.headers.authorization : connection.authorization;
      return { db, token };
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  app.get('/graphiql', cors(), expressPlayground({
    endpoint: '/graphql',
  }));

  const httpServer: Server = createServer(app);
  const httpsServer: https.Server = https.createServer(httpsOptions, app);
  const PORT: number | string = process.env.PORT || 3000;
  console.log('PORT: ', PORT);

  httpsServer.listen(PORT, () => {
    logger.info('=================SERVER API GRAPHQL=====================');
    logger.info(`STATUS: ${chalk.greenBright('ONLINE')}`);
    logger.info(`MESSAGE: ${chalk.greenBright('API DARU - MarketPlace !!!')}`);
    logger.info(`GraphQL Server => @: https://localhost:${PORT}/graphql`);
    logger.info(`WS Connection => @: wss://localhost:${PORT}/graphql`);
  });
}

init();
