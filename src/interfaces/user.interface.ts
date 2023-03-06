export interface IUser {
  id?: string;
  name?: string;
  lastname?: string;
  email: string;
  password?: string;
  registerdate?: string;
  role?: string;
  phone?: string;
  stripeCustomer?: string;
  addresses?: IAddress[];
}

export interface IAddress {
  c_pais: string;
  d_pais: string;
  c_estado: string;
  d_estado: string;
  c_mnpio: string;
  d_mnpio: string;
  c_ciudad: string;
  d_ciudad: string;
  d_asenta: string;
  directions: string;
  phone: string;
  references: string;
  d_codigo: string;
  dir_invoice: boolean;
  dir_delivery: boolean;
  dir_delivery_main: boolean;
}