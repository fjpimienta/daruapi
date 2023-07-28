import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import OpenPay from 'openpay';

class ExternalOpenpayService extends ResolversOperationsService {
  private openpay: any; // Agrega la propiedad openpay para acceder a la instancia de OpenPay

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);

    // Inicializar la instancia de OpenPay con tus credenciales
    const MERCHANT_ID = 'mbhvpztgt3rqse7zvxrc';
    const client_secret = 'sk_6a6bd967ab13459bb311f3d61fe03029';
    this.openpay = new OpenPay(MERCHANT_ID, client_secret, false);
  }

  /**
   * @returns Token de la tarjeta obtenido de OpenPay.
   */
  async setNewCard(variables: IVariables) {
    try {
      const { cardOpenpay } = variables;
      const token = await new Promise((resolve, reject) => {
        this.openpay.cards.create(cardOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'La tarjeta se ha creado correctamente.',
        createCardOpenpay: token,
      };
    } catch (error: any) {
      return {
        status: false,
        message: `Error al crear la tarjeta:', ${error.description}`,
      };
    }
  }
}

export default ExternalOpenpayService;
