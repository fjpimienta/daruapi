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
import multer from 'multer';
import * as path from 'path';
import fileService from './services/fileService';

// Configuración de las variables de entorno (lectura)
if (process.env.NODE_ENV !== 'production') {
  const env = environments;
  console.log(env);
}

const httpsOptions = {
  key: fs.readFileSync('src/_.daru.mx_private_key.key'),
  cert: fs.readFileSync('src/daru.mx_ssl_certificate.cer'),
};

// Ruta donde se guardarán los archivos
const uploadFolder = './uploads/files';

// Verificar y crear la carpeta de destino si no existe
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadFolder,
  filename: function (_req, file, cb) {
    const extension = path.extname(file.originalname);
    cb(null, Date.now() + extension);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1048576, files: 4 },
  fileFilter: function (_req, file, cb) {
    const type = file.mimetype.startsWith('image/');
    type ? cb(null, true) : cb(new Error('No es un archivo de tipo imagen'));
  }
}).array('files');

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

  // Agrega el servicio de archivos a la aplicación
  app.use('/files', fileService);

  // Configurar el directorio estático
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  await server.start();
  server.applyMiddleware({ app });

  app.get('/graphiql', cors(), expressPlayground({
    endpoint: '/graphql',
  }));

  // Agrega el middleware multer al manejo de rutas para procesar las solicitudes de carga de archivos
  app.post('/upload', upload, (req, res) => {
    // Verifica si 'files' existe en 'req' antes de intentar acceder a sus propiedades
    if (req.files) {
      // Si 'req.files' es un objeto, conviértelo a un arreglo de archivos
      const files: Express.Multer.File[] = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      // Guarda los archivos en el sistema de archivos
      const savedFiles = files.map((file) => {
        // const destinationPath = path.join(__dirname, 'uploads', 'files', file.filename);
        const destinationPath = path.join(uploadFolder, file.filename);
        // Mueve el archivo a la ubicación final
        fs.renameSync(file.path, destinationPath);
        // Retorna la información del archivo guardado (puedes personalizar esto)
        return {
          originalname: file.originalname,
          filename: file.filename,
          path: destinationPath,
        };
      });
      // Ahora puedes usar 'map' sin problemas
      res.json({ files: savedFiles });
    } else {
      // Manejar el caso en que 'req.files' sea 'undefined'
      res.status(400).json({ error: 'No se han proporcionado archivos' });
    }
  });

  const httpServer: Server = createServer(app);
  const httpsServer: https.Server = https.createServer(httpsOptions, app);
  const PORT: number | string = process.env.PORT || 3001;
  httpsServer.listen(PORT, () => {
    if (process.env.PRODUCTION !== 'true') {
      logger.info('=================SERVER API GRAPHQL=====================');
      logger.info(`STATUS: ${chalk.greenBright('ONLINE')}`);
      logger.info(`MESSAGE: ${chalk.greenBright('API DARU - MarketPlace !!!')}`);
      logger.info(`GraphQL Server => @: https://localhost:${PORT}/graphql`);
      logger.info(`WS Connection => @: wss://localhost:${PORT}/graphql`);
    }
  });
}

init();
