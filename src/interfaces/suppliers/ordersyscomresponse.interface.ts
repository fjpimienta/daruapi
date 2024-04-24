export interface IOrderSyscomResponse {
  error: string;
  cliente: IClienteSyscom;
  resumen: IResumenSyscom;
  datos_entrega: IDatosEntregaSyscom;
  productos: [IProductoSyscom];
  totales: ITotalesSyscom;
}

export interface IClienteSyscom {
  num_cliente: string;
  rfc: string;
  whatsapp: string;
  email: string;
  telefono: string;
  direccion: IDireccionSyscom;
}

export interface IResumenSyscom {
  peso_total: number;
  peso_vol_total: number;
  moneda: string;
  forma_pago: number;
  tipo_cambio: string;
  plazo: string;
  codigo_pago: string;
  folio: string;
  folio_pedido: string;
  fecha_creacion: string;
  iva_aplicado: number;
}

export interface IDatosEntregaSyscom {
  calle: string;
  num_exterior: string;
  num_interior: string;
  colonia: string;
  ciudad: string;
  estado: string;
  pais: string;
}

export interface IProductoSyscom {
  id: number;
  cantidad: number;
  tipo: string;
  modelo: string;
  titulo: string;
  marca: string;
  link: string;
  imagen: string;
  precio_lista: string;
  precio_oferta: string;
  precio_unitario: string;
  importe: number;
  descuentos: IDescuentosSyscom;
}

export interface ITotalesSyscom {
  subtotal: number;
  flete: number;
  iva: number;
  total: number;
}

export interface IDireccionSyscom {
  calle: string;
  num_exterior: string;
  num_interior: string;
  colonia: string;
  ciudad: string;
  estado: string;
  pais: string;
}

export interface IDescuentosSyscom {
  distribucion: number;
  clasificacion: string;
  volumen: number;
  financiero: number;
}