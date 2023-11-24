export interface IInvoiceConfig {
  nombres: string;
  apellidos: string;
  rfc: string;
  codigoPostal: string;
  formaPago: IFormaPago;
  metodoPago: IMetodoPago;
  regimenFiscal: IRegimenFiscal;
  usoCFDI: IUsoCFDI;
}

export interface IFormaPago {
  id: string;
  descripcion: string;
}

export interface IMetodoPago {
  id: string;
  descripcion: string;
}

export interface IRegimenFiscal {
  id: string;
  descripcion: string;
  fisica: string;
  moral: string;
}

export interface IUsoCFDI {
  id: string;
  descripcion: string;
  aplicaParaTipoPersonaFisica: string;
  aplicaParaTipoPersonaMoral: string;
}