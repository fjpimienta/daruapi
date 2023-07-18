export interface IOrderCt {
  idPedido?: number;
  almacen?: string;
  tipoPago?: string;
  guiaConnect: IGuiaConnect;
  envio?: IEnvioCt[];
  producto?: IProductoCt[];
  cfdi: string;
}

export interface IGuiaConnect {
  generarGuia: boolean;
  paqueteria: string;
}

export interface IEnvioCt {
  nombre: string;
  direccion: string;
  entreCalles: string;
  noExterior: string;
  noInterior: string;
  colonia: string;
  estado: string;
  ciudad: string;
  codigoPostal: number;
  telefono: number;
}

export interface IProductoCt {
  cantidad: number;
  clave: string;
  precio: number;
  moneda: string;
}