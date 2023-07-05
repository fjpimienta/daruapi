import { Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';

const loggerMiddleware = (logger: Logger) => async (req: Request, res: Response, next: NextFunction) => {
  // Registra la solicitud en el logger
  // logger.info(`GraphQL Request: ${req.body.operationName}`);
  // logger.info(`GraphQL Request - Operation: ${req.body.operationName}, 
  // Variables: ${JSON.stringify(req.body.variables)}, Query: ${req.body.query}`);
  const { method, path, query } = req;

  if (method === 'GET') {
    // Registra la solicitud GET
    logger.info(`GET Request - Path: ${path}, Query: ${JSON.stringify(query)}`);
  } else if (method === 'POST') {
    // Registra la solicitud POST
    logger.info(`POST Request - Path: ${path}, Body: ${JSON.stringify(req.body)}, Variables: ${JSON.stringify(req.body.variables)}`);
  } else {
    // Otros tipos de solicitudes
    logger.info(`Request - Method: ${method}, Path: ${path}`);
  }

  // Espera a que se complete la ejecución de la solicitud
  await next();

  // Accede a la respuesta de GraphQL y regístrala en el logger
  if (res.locals.graphqlResponse) {
    logger.info(`GraphQL Response: ${JSON.stringify(res.locals.graphqlResponse)}`);
  }
};

export default loggerMiddleware;
