import dotenv from 'dotenv';
dotenv.config(); // Cargar variables de entorno desde .env

import express, { Express } from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer, Server } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import schema from './schema';
import expressPlayground from 'graphql-playground-middleware-express';
import database from './lib/database';
import { IContext } from './interfaces/context.interface';
import chalk from 'chalk';
import logger from './utils/logger';
import loggerMiddleware from './utils/loggerMiddleware';
import https from 'https';
import fs from 'fs';
import multer from 'multer';
import * as path from 'path';
import fileService from './services/fileService';
import { execSync } from 'child_process';
import helmet from 'helmet';
import { checkGraphQLFiles } from './utils/schemaChecker';

console.log('Iniciando la aplicación API GraphQL Daru...');

// Check if the certificate and key files exist
const keyPath = 'src/_.daru.mx_private_key.key';
const certPath = 'src/daru.mx_ssl_certificate.cer';

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating self-signed certificate...');
  try {
    execSync('npm run generate-ssl', { stdio: 'inherit' });
    console.log('Self-signed certificate generated successfully.');
  } catch (error) {
    console.error('Failed to generate self-signed certificate:', error);
    process.exit(1);
  }
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

// Ruta donde se guardarán los archivos
const uploadFolder = path.join(__dirname, '../uploads/files');

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
  console.log('Función init() iniciada');
  
  // Verificar archivos GraphQL al iniciar
  if (process.env.NODE_ENV !== 'production') {
    checkGraphQLFiles();
  }

  const app: Express = express();

  // Aplicar medidas de seguridad con Helmet (nuevas medidas)
  app.use(helmet({
    contentSecurityPolicy: process.env.PRODUCTION === 'true' ? undefined : false,
    crossOriginEmbedderPolicy: false
  }));

  // Configurar CORS con opciones más restrictivas
  app.use(cors({
    origin: [
      process.env.CLIENT_URL || 'https://dev.daru.mx',
      process.env.CLIENT_URL_ADMIN || 'https://devadmin.daru.mx',
      'https://localhost:4200',
      'https://localhost:3002',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(compression());

  app.use(express.json({ limit: '50mb' }));

  app.use(loggerMiddleware(logger));

  try {
    // Inicializar conexión a la base de datos usando el singleton mejorado
    const db = await database.init();

    // Configurar validación de contexto para mayor seguridad
    const validateContextFn = async ({ req }: { req: any }) => {
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.replace('Bearer ', '');
        // Podrías verificar el token aquí o en un middleware de resolvers
        // const decodedToken = verifyToken(token);
      }
    };

    const server: ApolloServer<IContext> = new ApolloServer<IContext>({
      schema,
      introspection: process.env.PRODUCTION !== 'true', // Deshabilitar en producción
      includeStacktraceInErrorResponses: process.env.PRODUCTION !== 'true',
      plugins: [
        // Agregar plugins de seguridad personalizados si es necesario
      ],
    });

    await server.start();

    app.use(
      '/graphql',
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          await validateContextFn({ req });
          return {
            req: {
              headers: {
                authorization: req.headers.authorization,
              },
            },
            res,
            db,
          };
        },
      })
    );

    // Agrega el servicio de archivos a la aplicación
    app.use('/files', fileService);

    // Configurar el directorio estático
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    app.get('/graphiql', cors(), expressPlayground({
      endpoint: '/graphql',
    }));

    // Agrega el middleware multer al manejo de rutas para procesar las solicitudes de carga de archivos
    app.post('/upload', upload, (req, res) => {
      if (req.files) {
        const files: Express.Multer.File[] = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        const savedFiles = files.map((file) => {
          const destinationPath = path.join(uploadFolder, file.filename);
          fs.renameSync(file.path, destinationPath);
          return {
            originalname: file.originalname,
            filename: file.filename,
            path: destinationPath,
          };
        });
        res.json({ files: savedFiles });
      } else {
        res.status(400).json({ error: 'No se han proporcionado archivos' });
      }
    });

    const httpServer: Server = createServer(app);
    const httpsServer: https.Server = https.createServer(httpsOptions, app);
    const PORT: number | string = process.env.PORT || 3002;
    httpsServer.listen(PORT, () => {
      // Mostrar siempre la URL, independientemente del entorno
      logger.info('=================SERVER API GRAPHQL=====================');
      logger.info(`STATUS: ${chalk.greenBright('ONLINE')}`);
      logger.info(`MESSAGE: ${chalk.greenBright('API DARU - MarketPlace !!!')}`);
      logger.info(`GraphQL Server => @: https://localhost:${PORT}/graphql`);
      logger.info(`WS Connection => @: wss://localhost:${PORT}/graphql`);
      
      // Escribir también a la salida estándar para asegurar visibilidad en PM2
      console.log('=================SERVER API GRAPHQL=====================');
      console.log(`STATUS: ONLINE`);
      console.log(`MESSAGE: API DARU - MarketPlace !!!`);
      console.log(`GraphQL Server => @: https://localhost:${PORT}/graphql`);
      console.log(`WS Connection => @: wss://localhost:${PORT}/graphql`);
    });

    // Manejo de cierre limpio de la aplicación
    const handleShutdown = async () => {
      logger.info('Cerrando servidor y conexiones...');
      await database.close();
      httpsServer.close();
      httpServer.close();
      process.exit(0);
    };

    // Registrar manejadores de señales para cierre limpio
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    process.on('uncaughtException', (error) => {
      logger.error('Excepción no capturada:', error);
      handleShutdown();
    });

  } catch (error) {
    logger.error(`Error fatal al inicializar la aplicación: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

console.log('Llamando a función init() para iniciar servidor...');
init().catch(error => {
  console.error('Error fatal en la inicialización:', error);
  process.exit(1);
});
