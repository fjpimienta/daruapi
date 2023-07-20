export interface IProductCvaShippment {
  clave: string;
  cantidad: number;
}

export interface IOrderCva {
  NumOC: string;
  Paqueteria: string;
  CodigoSucursal: string;
  PedidoBO: string;
  Observaciones: string;
  productos: IProductoCva[];
  TipoFlete: string;
  Calle: string;
  Numero: string;
  NumeroInt: string;
  CP: string;
  Colonia: string;
  Estado: string;
  Ciudad: string;
  Atencion: string;
}

export interface IProductoCva {
  clave: string;
  cantidad: number;
}

export interface IGroupCva {
  grupo: string;
}