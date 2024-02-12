import { Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';

const loggerMiddleware = (logger: Logger) => async (req: Request, res: Response, next: NextFunction) => {
  const { method, path, query } = req;

  if (process.env.PRODUCTION === 'true') {
    if (method === 'GET') {
      // Registra la solicitud GET
      logger.info(`GET Request - Path: ${path}, \n Query: ${JSON.stringify(query)} \n`);
    } else if (method === 'POST') {
      // Registra la solicitud POST
      logger.info(`POST Request - Path: ${path}, \n Body: ${JSON.stringify(req.body)}, \n Variables: ${JSON.stringify(req.body.variables)} \n`);
    } else {
      // Otros tipos de solicitudes
      logger.info(`Request - Method: ${method}, \n Path: ${path} \n`);
    }
  }

  // Espera a que se complete la ejecución de la solicitud
  await next();

  // Accede a la respuesta de GraphQL y regístrala en el logger
  if (res.locals.graphqlResponse) {
    logger.info(`GraphQL Response: ${JSON.stringify(res.locals.graphqlResponse)}`);
  }
};

export default loggerMiddleware;
