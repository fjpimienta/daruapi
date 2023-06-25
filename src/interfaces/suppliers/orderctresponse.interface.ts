export interface IOrderCtResponse {
  pedidoWeb: string;
  fecha: string;
  tipoDeCambio: number;
  estatus: string;
  errores: IErroresCT[];
}

export interface IErroresCT {
  errorCode: string;
  errorMessage: string;
  errorReference: string;
}
