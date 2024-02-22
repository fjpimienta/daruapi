import { IOrderCvaResponse } from './ordercvaresponse.interface';

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
  orderCvaResponse?: IOrderCvaResponse;
}

export interface IProductoCva {
  clave: string;
  cantidad: number;
}

export interface IGroupCva {
  grupo: string;
}

export interface IResponseProductCva {
  clave: string;
  upc: string;
  codigo_fabricante: string;
  descripcion: string;
  solucion: string;
  grupo: string;
  marca: string;
  garantia: string;
  clase: string;
  disponible: number;
  precio: number;
  moneda: string;
  ficha_tecnica: string;
  ficha_comercial: string;
  imagen: string;
  disponibleCD: number;
  tipocambio: number;
  fechaactualizatipoc: string;
  TotalDescuento: number;
  MonedaDescuento: string;
  PrecioDescuento: number;
  MonedaPrecioDescuento: string;
  ClavePromocion: string;
  DescripcionPromocion: string;
  VencimientoPromocion: string;
  DisponibleEnPromocion: string;
  CEDIS_PROYECTO_IPN: number;
  TALLER_PROYECTO_IPN: number;
  VENTAS_ACAPULCO: number;
  VENTAS_AGUASCALIENTES: number;
  VENTAS_CAMPECHE: number;
  VENTAS_CANCUN: number;
  VENTAS_CHIHUAHUA: number;
  VENTAS_COLIMA: number;
  VENTAS_CEDISGUADALAJARA: number;
  VENTAS_CUERNAVACA: number;
  VENTAS_CULIACAN: number;
  VENTAS_DF_TALLER: number;
  VENTAS_DURANGO: number;
  VENTAS_GUADALAJARA: number;
  VENTAS_HERMOSILLO: number;
  VENTAS_LEON: number;
  VENTAS_MERIDA: number;
  VENTAS_MONTERREY: number;
  VENTAS_MORELIA: number;
  VENTAS_OAXACA: number;
  VENTAS_PACHUCA: number;
  VENTAS_PUEBLA: number;
  VENTAS_QUERETARO: number;
  VENTAS_SAN_LUIS_POTOSI: number;
  VENTAS_TAMPICO: number;
  VENTAS_TEPIC: number;
  VENTAS_TOLUCA: number;
  VENTAS_TORREON: number;
  VENTAS_TUXTLA: number;
  VENTAS_VERACRUZ: number;
  VENTAS_ZACATECAS: number;
  ExsTotal: number;
  dimensiones: string;
  peso: string;
}

export interface IEnvioCVA {
  nombre: string;
  direccion: string;
  entreCalles: string;
  noExterior: string;
  noInterior: string;
  colonia: string;
  estado: string;
  ciudad: string;
  codigoPostal: string;
  telefono: string;
}