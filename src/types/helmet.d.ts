declare module 'helmet' {
  import { RequestHandler } from 'express';
  
  interface HelmetOptions {
    contentSecurityPolicy?: boolean | { [key: string]: any };
    crossOriginEmbedderPolicy?: boolean | { [key: string]: any };
    [key: string]: any;
  }
  
  function helmet(options?: HelmetOptions): RequestHandler;
  
  export = helmet;
}
