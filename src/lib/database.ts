import { MongoClient } from 'mongodb';
import chalk from 'chalk';
import logger from '../utils/logger';

const MONGO_DB = process.env.DATABASE || 'mongodb://localhost:27017/darushop';
if (!process.env.DATABASE) {
  logger.warn(`process.env.DATABASE is undefined, using default connection: ${MONGO_DB}`);
}

class Database {
   async init() {
      try {
         const client = await MongoClient.connect(MONGO_DB); // Elimina las opciones obsoletas
         const db = client.db();

         const timestamp = new Date().toISOString();
         logger.info('=================== DATABASE ===================');
         logger.info(`STATUS: ${chalk.greenBright('ONLINE')}`);
         logger.info(`DATABASE: ${chalk.greenBright(db.databaseName)}`);
         return db;
      } catch (error) {
         logger.error('Error al conectar con la base de datos:', error);
         throw new Error('No se pudo conectar a la base de datos.');
      }
   }
}

export default Database;