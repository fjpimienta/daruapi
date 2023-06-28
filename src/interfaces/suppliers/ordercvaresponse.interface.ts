export interface IOrderCvaResponse {
  error: string;                                // Numero interior
  estado?: string;                                 // Colonia de envio
  pedido?: string;                                  // Colonia de envio
  total?: string;                                  // Clave de Ciudad (Véase Catalogo de Ciudades )
  agentemail?: string;                                // Con atencion a quien (nombre)
  almacenmail?: string;                                // Con atencion a quien (nombre)
}
