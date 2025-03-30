import express from 'express'; // Importar express para usarlo en el tipo 'res'

export interface IContext {
  req: IRequest;
  res: express.Response; // Asegúrate de incluir 'res' en el contexto
  connection?: IConnection; // Hacer que 'connection' sea opcional
}

interface IRequest {
  headers: {
    authorization?: string; // Hacer que 'authorization' sea opcional
  };
}

interface IConnection {
  authorization: string;
}