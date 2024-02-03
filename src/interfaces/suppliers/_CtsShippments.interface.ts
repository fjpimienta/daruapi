// Lista de Precios
export interface IProductoCt {
  precio: number;
  moneda: string;
  almacenes: IAlmacenes[];
  codigo: string;
}

export interface IAlmacenes {
  almacenes: IAlmacen[]
}

export interface IAlmacen {
  [key: string]: number | IPromocion;
}

export interface IExistenciaAlmacen {
  [key: string]: {
    existencia: number;
  };
}

export interface IAlmacenPromocion {
  key: string
  value: number
  promocionString: string
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
  productoCt?: IProductOrderCt[];
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
  codigoPostal: string;
  telefono: number;
}

export interface IProductOrderCt {
  precio: number;
  moneda: string;
  cantidad: number;
  clave: string;
}

export interface IResponseCtsJsonProducts {
  idProducto: number;
  clave: string;
  numParte: string;
  nombre: string;
  modelo: string;
  idMarca: number;
  marca: string;
  idSubCategoria: number;
  subcategoria: string;
  idCategoria: number;
  categoria: string;
  descripcion_corta: string;
  ean: string;
  upc: string;
  sustituto: string;
  activo: number;
  protegido: number;
  existencia: IExistencia
  precio: number;
  moneda: string;
  tipoCambio: number;
  especificaciones: IEspecificacion[]
  promociones: IPromocion[]
  imagen: string;
}

export interface IExistencia {
  HMO: number;
  OBR: number;
  LMO: number;
  CLN: number;
  DGO: number;
  TRN: number;
  CHI: number;
  AGS: number;
  QRO: number;
  SLP: number;
  LEO: number;
  GDL: number;
  MOR: number;
  SLT: number;
  XLP: number;
  VER: number;
  COL: number;
  CTZ: number;
  TAM: number;
  PUE: number;
  VHA: number;
  TXA: number;
  MTY: number;
  TPC: number;
  MID: number;
  OAX: number;
  MAZ: number;
  CUE: number;
  TOL: number;
  PAC: number;
  CUN: number;
  DFP: number;
  DFA: number;
  ZAC: number;
  DFT: number;
  ACA: number;
  IRA: number;
  DFC: number;
  TXL: number;
  CAM: number;
  ACX: number;
  URP: number;
  CDV: number;
  CEL: number;
  D2A: number;
  CMT: number;
}

export interface IEspecificacion {
  tipo: string;
  valor: string;
}

export interface IPromocion {
  tipo: string;
  promocion: number;
  vigencia: IVigencia
}

export interface IVigencia {
  inicio: string;
  fin: string;
}