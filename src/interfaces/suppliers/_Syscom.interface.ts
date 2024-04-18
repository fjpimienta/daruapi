export interface ITokenSyscom {
  token_type: string;
  expires_in: string;
  access_token: string;
}

export interface IMetodoPagoSyscom {
  nombre: string;
  metodo: IMetodoPagoItem;
}

export interface IMetodoPagoItem {
  nombre: string;
  metodo: IMetodoPagoItemDetalle;
}

export interface IMetodoPagoItemDetalle {
  nombre: string;
  titulo: string;
  codigo: string;
  descuento: number;
  tipo_cambio: string;
  plazo: number;
  forma: IFormaPago;
}

export interface IFormaPago {
  PUE: number;
  PPD: number;
}

export interface IOrderSyscom {
  tipo_entrega: string;
  direccion: IDireccionSyscom;
  metodo_pago: string;
  fletera: string;
  productos: IProductsSyscom[];
  moneda: string;
  uso_cfdi: string;
  tipo_pago: string;
  orden_compra: string;
  ordenar: boolean;
  iva_frontera: boolean;
  forzar: boolean;
  testmode: boolean;
}

export interface IDireccionSyscom {
  atencion_a: string;
  calle: string;
  num_ext: string;
  num_int: string;
  colonia: string;
  codigo_postal: number;
  pais: string;
  estado: string;
  ciudad: string;
  telefono: string;
}

export interface IProductsSyscom {
  id: number;
  tipo: string;
  cantidad: number;
}