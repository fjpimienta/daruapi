export interface IOrderCtResponse {
  pedidoWeb: string;
  tipoDeCambio: number;
  estatus: string;
  errores: IErroresCT[];
}

export interface IErroresCT {
  errorCode: number;
  errorMessage: string;
  errorReference: string;
}
