import { ICatalog } from './catalog.interface';

export interface ISupplier {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  large_description: string;
  addres: string;
  contact: string;
  phone: string;
  web: string;
  url_base_api: string;
  token: IToken;
  apis: IApis[];
  active: boolean;
  catalogs: ICatalogs[];
}

export interface ICatalogs {
  name: string;
  catalog: [ICatalog];
}

export interface IToken {
  type: string;
  method: string;
  url_base_token: string;
  body_parameters: IBodyParameters[];
  response_token: IResponsetoken[];
}

export interface IBodyParameters {
  name: string;
  value: string;
  secuence: number;
  onlyUrl: boolean;
}

export interface IResponsetoken {
  name: string;
  es_token: boolean;
}

export interface IApis {
  type: string;
  name: string;
  method: string;
  operation: string;
  suboperation: string;
  use: string;
  return: string;
  headers: IHeaders;
  parameters: IBodyParameters[];
  requires_token: boolean;
}

export interface IHeaders {
  authorization: boolean;
}
