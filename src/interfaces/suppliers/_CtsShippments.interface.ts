// Lista de Precios
export interface IProductoCt {
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
  ean: string | null;
  upc: string | null;
  sustituto: string;
  activo: number;
  protegido: number;
  existencia: IExistencia;
  precio: number;
  moneda: string;
  tipoCambio: number;
  especificaciones: {
    tipo: string;
    valor: string;
  }[];
  promociones: {
    tipo: string;
    promocion: number;
    vigencia: {
      inicio: string;
      fin: string;
    };
  }[];
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