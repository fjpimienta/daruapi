export interface IMetodoPagoSyscom {
  nombre: string;
  metodo: IMetodoPagoItem;
}

export interface IMetodoPagoItem {
  nombre: String
  metodo: IMetodoPagoItemDetalle
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