import { ICatalog } from '../catalog.interface';

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
  url_base_api_order: string;
  url_base_api_shipments: string;
  token: IToken;
  apis: IApisupplier[];
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
  basic_auth_username: string;
  basic_auth_password: string;
  header_parameters: IParameters[];
  body_parameters: IParameters[];
  response_token: IResponsetoken[];
}

export interface IParameters {
  name: string;
  value: string;
  secuence: number;
  onlyUrl: boolean;
}

export interface IResponsetoken {
  name: string;
  es_token: boolean;
}

export interface IApisupplier {
  type: string;
  name: string;
  method: string;
  operation: string;
  suboperation: string;
  use: string;
  return: string;
  headers: IHeaders;
  parameters: IParameters[];
  requires_token: boolean;
}

export interface IHeaders {
  authorization: boolean;
}
