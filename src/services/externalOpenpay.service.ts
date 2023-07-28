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

  async listCards() {
    try {
      const listCardsOpenpay = await new Promise((resolve, reject) => {
        this.openpay.cards.list({}, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'La lista de tarjetas se ha creado correctamente.',
        listCardsOpenpay,
      };
    } catch (error: any) {
      return {
        status: false,
        message: `Error al crear la tarjeta: ' ${error.description}`,
      };
    }
  }

  async create(variables: IVariables) {
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
        message: `Error al crear la tarjeta: ' ${error.description}`,
      };
    }
  }

  async oneCard(variables: IVariables) {
    try {
      const { idCardOpenpay } = variables;

      if (!idCardOpenpay) {
        return {
          status: false,
          message: 'Se requiere el ID de la tarjeta para actualizar.',
        };
      }

      const cardOpenpay = await new Promise((resolve, reject) => {
        this.openpay.cards.get(idCardOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'La tarjeta se ha localizdo correctamente.',
        cardOpenpay,
      };
    } catch (error: any) {
      return {
        status: false,
        message: `Error al actualizar la tarjeta: ${error.message}`,
      };
    }
  }

  async delete(variables: IVariables) {
    try {
      const { idCardOpenpay } = variables;
      const token = await new Promise((resolve, reject) => {
        this.openpay.cards.delete(idCardOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'La tarjeta se ha eliminado correctamente.',
      };
    } catch (error: any) {
      return {
        status: false,
        message: `Error al eliminar la tarjeta: ' ${error.description}`,
      };
    }
  }
}

export default ExternalOpenpayService;
