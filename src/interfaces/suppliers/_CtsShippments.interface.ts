// Lista de Precios
export interface IProductoCt {
  precio: number;
  moneda: string;
  almacenes: IAlmacenes[];
  codigo: string;
  almacenesString: string;
}

export interface IAlmacenes {
  almacenes: IAlmacen[]
}

export interface IAlmacen {
  promocion: IPromocion;
  [key: string]: number | IPromocion;
}

export interface IAlmacenDinamico {
  key: string
  value: string
}

export interface IPromocion {
  precio: number;
  vigente: IVigencia;
}

export interface IVigencia {
  ini: string;
  fin: string;
}

export interface IProductCtShippment {
  producto: string;
  cantidad: number;
  precio: number;
  moneda: string;
  almacen: string;
}

// Ordenes
export interface IOrderCtResponse extends IOrderCt {
  respuestaCT: IRespuestaCT[]
}

export interface IRespuestaCT {
  pedidoWeb: string;
  fecha: string;
  tipoDeCambio: number;
  estatus: string;
  errores: [IErroresCts]
}

export interface IErroresCts {
  errorCode: string;
  errorMessage: string;
  errorReference: string;
}

export interface IOrderCt {
  idPedido?: number;
  almacen?: string;
  tipoPago?: string;
  guiaConnect: IGuiaConnect;
  envio?: IEnvioCt[];
  producto?: IProductOrderCt[];
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

export interface IProductOrderCt {
  precio: number;
  moneda: string;
  cantidad: number;
  clave: string;
}