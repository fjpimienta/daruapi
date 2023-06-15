export interface IOrderCva {
  NumOC?: string;                                   // Tu identificador/numero de orden
  Paqueteria?: string;                              // Clave de la paqueteria (Véase Catalogo Paqueterias)
  CodigoSucursal?: string;                          // Clave de la sucursal (Véase Catalogo sucursal)
  PedidoBO: string;                                // Si el pedido genera BO, ahora pedidos con existencia, no hay BO
  Observaciones?: string;                           // Alguna observacion sobre el pedido.
  productos?: IProductoCva[];                        // Lista de Productos
  TipoFlete?: string;                               // Si el producto lleva flete;
  //SF: Sin flete; FF: Flete cobrado en la factura de CVA; FS: Flete cobrado en la factura de CVA Asegurado
  Calle?: string;                                   // Calle de envio
  Numero?: string;                                  // Numero
  NumeroInt: string;                                // Numero interior
  Colonia?: string;                                 // Colonia de envio
  Estado?: string;                                  // Colonia de envio
  Ciudad?: string;                                  // Clave de Ciudad (Véase Catalogo de Ciudades )
  Atencion?: string;                                // Con atencion a quien (nombre)
}

export interface IProductoCva {
  clave: string;                                    // Clave del producto
  cantidad: number;                                 // La cantidad del producto
}