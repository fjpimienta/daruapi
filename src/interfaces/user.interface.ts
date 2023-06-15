export interface IUser extends IUserBasic {
  password?: string;
  registerdate?: string;
  role?: string;
}

export interface IUserBasic {
  id?: string;
  name?: string;
  lastname?: string;
  email: string;
  phone?: string;
  stripeCustomer?: string;
  addresses?: IAddress[];
  policy?: boolean;
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
  outdoorNumber: string;
  interiorNumber: string;
}