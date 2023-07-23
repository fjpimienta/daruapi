import { IPromocion, IVigencia } from '../interfaces/suppliers/_CtsShippments.interface'; // Ajusta la ruta del import según la ubicación real del archivo promocion.ts en tu proyecto

export class Promocion {
  // Puedes usar las interfaces IPromocion e IVigencia aquí en tu clase
  private promocion: IPromocion;
  private vigencia: IVigencia;

  constructor(promocion: IPromocion, vigencia: IVigencia) {
    this.promocion = promocion;
    this.vigencia = vigencia;
  }

  // Implementar la función "__isTypeOf" para que GraphQL pueda determinar el tipo en tiempo de ejecución
  static __isTypeOf(obj: any) {
    return obj instanceof Promocion;
  }
}
