export interface IOrderCtResponse {
  pedidoWeb: string;
  tipoDeCambio: number;
  estatus: string;
  errores: IErroresCT[];
}

export interface IErroresCT {
  errorCode: string;
  errorMessage: string;
  errorReference: string;
}
