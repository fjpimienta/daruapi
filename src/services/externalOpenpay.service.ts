import { IContextData } from '../interfaces/context-data.interface';
import { IChargeOpenpay, IPayoutOpenpay } from '../interfaces/suppliers/_Openpay.interface';
import { IVariables } from '../interfaces/variable.interface';
import logger from '../utils/logger';
import ResolversOperationsService from './resolvers-operaciones.service';
import OpenPay from 'openpay';

class ExternalOpenpayService extends ResolversOperationsService {
  private openpay: any; // Agrega la propiedad openpay para acceder a la instancia de OpenPay

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);

    // Inicializar la instancia de OpenPay con tus credenciales
    const MERCHANT_ID = process.env.OPENPAY_MERCHANT_ID ?? 'mbhvpztgt3rqse7zvxrc';
    const CLIENT_SECRET = process.env.OPENPAY_CLIENT_SECRET ?? 'sk_6a6bd967ab13459bb311f3d61fe03029';
    this.openpay = new OpenPay(MERCHANT_ID, CLIENT_SECRET, false);
  }

  //#region Token

  //#endregion

  //#region Customers
  async createCustomer(variables: IVariables) {
    try {
      const { customerOpenpay } = variables;
      const createCustomerOpenpay = await new Promise((resolve, reject) => {
        this.openpay.customers.create(customerOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'Se ha creado correctamente el cliente.',
        createCustomerOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`createCustomer: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async updateCustomer(variables: IVariables) {
    try {
      const { idCustomerOpenpay, customerOpenpay } = variables;
      const updateCustomerOpenpay = await new Promise((resolve, reject) => {
        this.openpay.customers.update(idCustomerOpenpay, customerOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'Se ha actualizado correctamente el cliente.',
        updateCustomerOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`updateCustomer: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async deleteCustomer(variables: IVariables) {
    try {
      const { idCustomerOpenpay } = variables;
      const token = await new Promise((resolve, reject) => {
        this.openpay.customers.delete(idCustomerOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'Se ha eliminado el Cliente correctamente.',
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`deleteCustomer: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async oneCustomer(variables: IVariables) {
    try {
      const { idCustomerOpenpay } = variables;

      if (!idCustomerOpenpay) {
        return {
          status: false,
          message: 'Se requiere el ID del Cliente para buscarlo.',
        };
      }

      const customerOpenpay = await new Promise((resolve, reject) => {
        this.openpay.customers.get(idCustomerOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'El cliente se ha localizado correctamente.',
        customerOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`oneCustomer: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async listCustomers() {
    try {
      const listCustomersOpenpay = await new Promise((resolve, reject) => {
        this.openpay.customers.list({}, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'La lista de clientes se ha creado correctamente.',
        listCustomersOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`listCustomers: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  //#endregion

  //#region Cards
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
      process.env.PRODUCTION !== 'true' && logger.info(`listCards: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async createCard(variables: IVariables) {
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
      process.env.PRODUCTION !== 'true' && logger.info(`createCard: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async oneCard(variables: IVariables) {
    try {
      const { idCardOpenpay } = variables;

      if (!idCardOpenpay) {
        return {
          status: false,
          message: 'Se requiere el ID de la tarjeta para buscarlo.',
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
        message: 'La tarjeta se ha localizado correctamente.',
        cardOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`oneCard: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async deleteCard(variables: IVariables) {
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
      process.env.PRODUCTION !== 'true' && logger.info(`deleteCard: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }
  //#endregion

  //#region charge
  async createCharge(variables: IVariables) {
    try {
      const { chargeOpenpay } = variables;
      const createChargeOpenpay = await new Promise((resolve, reject) => {
        this.openpay.charges.create(chargeOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      return {
        status: true,
        message: 'El cargo se ha creado correctamente.',
        createChargeOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`createCharge: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async captureCharge(variables: IVariables) {
    try {
      const { idChargeOpenpay, captureTransactionOpenpay } = variables;

      if (!idChargeOpenpay) {
        return {
          status: false,
          message: 'Se requiere el ID de la Transaccion para buscarla.',
        };
      }

      const captureChargeOpenpay = await new Promise((resolve, reject) => {
        this.openpay.charges.capture(idChargeOpenpay, captureTransactionOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'Se ha autorizado correctamente el cargo.',
        captureChargeOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`captureCharge: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async refundCharge(variables: IVariables) {
    try {
      const { idChargeOpenpay, refundTransactionCharge } = variables;

      if (!idChargeOpenpay) {
        return {
          status: false,
          message: 'Se requiere el ID de la Transaccion para buscarla.',
        };
      }

      const refundChargeOpenpay = await new Promise((resolve, reject) => {
        this.openpay.charges.refund(idChargeOpenpay, refundTransactionCharge, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'Se ha devuelto correctamente el cargo.',
        refundChargeOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`refundCharge: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async oneCharge(variables: IVariables) {
    try {
      const { idTransactionOpenpay } = variables;
      if (!idTransactionOpenpay) {
        return {
          status: false,
          message: 'Se requiere el ID del Cargo para buscarlo.',
        };
      }
      const chargeOpenpay: IChargeOpenpay = await new Promise((resolve, reject) => {
        this.openpay.charges.get(idTransactionOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'El cargo se ha realizado correctamente.',
        chargeOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`oneCharge: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async listCharges() {
    try {
      const listChargesOpenpay = await new Promise((resolve, reject) => {
        this.openpay.charges.list({}, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'La lista de cargos se ha creado correctamente.',
        listChargesOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`listCharges: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  //#endregion

  //#region Payouts
  async createPayout(variables: IVariables) {
    try {
      const { payoutOpenpay } = variables;
      const createPayoutOpenpay = await new Promise((resolve, reject) => {
        this.openpay.payouts.create(payoutOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      return {
        status: true,
        message: 'El cargo se ha creado correctamente.',
        createPayoutOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`createPayout: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async onePayout(variables: IVariables) {
    try {
      const { idPayoutOpenpay } = variables;
      if (!idPayoutOpenpay) {
        return {
          status: false,
          message: 'Se requiere el ID del Pago para buscarlo.',
        };
      }
      const payoutOpenpay: IPayoutOpenpay = await new Promise((resolve, reject) => {
        this.openpay.payouts.get(idPayoutOpenpay, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      return {
        status: true,
        message: 'El cargo se ha consultado correctamente.',
        payoutOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`onePayout: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }

  async listPayouts() {
    try {
      const listPayoutsOpenpay = await new Promise((resolve, reject) => {
        this.openpay.charges.list({}, (error: any, response: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      return {
        status: true,
        message: 'La lista de pagos se ha creado correctamente.',
        listPayoutsOpenpay,
      };
    } catch (error: any) {
      process.env.PRODUCTION !== 'true' && logger.info(`listPayouts: \n ${JSON.stringify(error)} \n`);
      let description = this.decodeError(error);
      return {
        status: false,
        message: description,
      };
    }
  }
  //#endregion

  //#region Metodos Adicionales
  decodeError(error: any) {
    // Verificar si el error es una cadena JSON válida
    if (typeof error === 'string') {
      // Intentar analizar la cadena como JSON
      try {
        const errorObj = JSON.parse(error);
        return this.handleParsedError(errorObj);
      } catch (parseError) {
        // Si hay un error al analizar la cadena JSON, manejarla como cadena directamente
        console.error('Error parsing JSON:', parseError);
        return this.handleStringError(error);
      }
    } else if (typeof error === 'object') {
      // Si el error ya es un objeto JavaScript, manejarlo directamente
      return this.handleParsedError(error);
    } else {
      // Si el tipo de error no es una cadena ni un objeto, manejarlo aquí
      console.error('Error inesperado:', error);
      return 'Error inesperado';
    }
  }

  handleStringError(error: string) {
    process.env.PRODUCTION !== 'true' && logger.info(`handleStringError.Error string: \n ${JSON.stringify(error)} \n`);
    // Aquí puedes manejar el error como una cadena directamente
    // Por ejemplo, podrías buscar patrones en la cadena para determinar el tipo de error
    // y devolver un mensaje adecuado en función de eso.
    return 'Error desconocido';
  }

  handleParsedError(errorObj: any) {
    const errorCode = errorObj.error_code;
    const httpCode = errorObj.http_code;
    const description = errorObj.description;

    switch (errorCode) {
      case 1000:
        return 'Lo sentimos ocurrió un error interno, estamos trabajando para resolverlo a la brevedad posible.';
      case 1001:
        if (httpCode === 400) {
          if (description.includes('ustomer.email no puede estar vac')) {
            return 'Por favor agrega un correo electrónico, ésta acción es necesaria para avanzar. ';
          }
          return 'La vigencia del token de pago no es válida, favor de verificarla o revisarlo directo con el banco.';
        }
        if (description.includes('cvv2 length must be 3 digits')) {
          return 'El código de seguridad de la tarjeta debe ser de 3 digitos.';
        } else if (description.includes('expiration_year')) {
          return 'El año de vencimiento de la tarjeta debe de ser de dos dígitos: ejemplo (01,02,11,12).';
        } else if (description.includes('expiration_month')) {
          return 'El mes de vencimiento de la tarjeta debe de ser de dos dígitos: ejemplo (01,02,11,12).';
        } else if (description.includes('expiration_month length must be 2 digits')) {
          return 'El mes de vencimiento de la tarjeta debe de ser de dos dígitos: ejemplo (01,02,11,12).';
        } else if (description.includes('equired request body is missin')) {
          return 'Lo sentimos no se encuentra toda la informacion requerida, por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
        }
      case 1002:
        return 'Lo sentimos hay un problema con el token de seguridad, por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1003:
        if (httpCode === 422) {
          if (errorCode === 1003) {
            return 'Lo sentimos hay un problema con el token de seguridad, por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
          }
          return 'Favor de esperar unos minutos, el cargo a la tarjeta se encuentra en estado final. Cualquier duda por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
        }
        return 'Lo sentimos, la operación no pudo ser completada debido a que la información proporcionada no es correcta.';
      case 1004:
        return 'Lo sentimos ocurrió un error interno, estamos trabajando para resolverlo a la brevedad posible.';
      case 1005:
        return 'Lo sentimos uno de los recursos requeridos no existe, verifique los datos capturados o por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1006:
        return 'Ya existe una transacción con el mismo número de orden, por favor revisa a detalle la información o contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1007:
        return 'La transacción no fue aceptada, favor de ponerse en contacto con el banco.';
      case 1008:
        return 'Una de las cuentas se encuentra desactivada, por favor revisa a detalle la información o contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1009:
        return 'Lo sentimos, la informacion enviada no cumple con las especificaciones. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1010:
        return 'Lo sentimos, Se esta utilizando la llave pública para hacer una llamada que requiere la llave privada. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1011:
        return 'Es indispensable que revises que la información que solicitamos esté completa, debido a que falta información no podrás seguir avanzando.';
      case 1012:
        return 'El monto de la transacción se encuentra fuera de los límites permitidos, favor de revisarlo con el banco.';
      case 1013:
        return 'Lo sentimos, la operación que estás intentando realizar no está permitida, por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1014:
        return 'Te informamos que tu cuenta se encuentra inactiva, por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1015:
        return 'Lo sentimos, no se ha obtenido respuesta de la solicitud realizada al servicio. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1016:
        return 'Lo sentimos, el mail del comercio ya ha sido configurado previamente, se requiere otro email.';
      case 1017:
        return 'Lo sentimos, el gateway no se encuentra disponible en ese momento, por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1018:
        return 'Lo sentimos, el número de intentos de cargos que se han realizado es mayor al permitido, favor de ponerse en contacto con el banco o contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1020:
        return 'Lo sentimos, el número de dígitos decimales es inválido para éste tipo de moneda, por favor revisa a detalle la información o contáctanos a marketplace@daru.mx.';
      case 1023:
        return 'Lo sentimos, se han terminado las transacciones incluidas en tu paquete. Para contratar otro paquete contacta a marketplace@daru.mx.';
      case 1024:
        return 'Lo sentimos, el monto de la transacción excede el límite de transacciones permitidas, por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 1025:
        return 'Lo sentimos, se han bloqueado las transacciones CoDi contratadas en tu plan. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo.';
      case 2001:
        return 'Lo sentimos, la cuenta de banco con esta CLABE ya se encuentra registrada en el cliente. Favor de verificar o ingresar otra CLABE';
      case 2003:
        return 'Lo sentimos, el cliente con este identificador ya existe. Favor de verificar o ingresar otra clilente.';
      case 2004:
        return 'El número de tarjeta que estás colocando no es válido, por favor revisa a detalle la información.';
      case 2005:
        return 'La fecha de expiración de la tarjeta es anterior a la fecha actual, por favor revisa a detalle la información.';
      case 2006:
        return 'Por favor agregar el código de seguridad de la tarjeta, ya que sin esta información no podrás completar el pedido.';
      case 2007:
        return 'El número de tarjeta que intenta utilizar no es permitido.';
      case 2008:
        return 'La tarjeta que estás usando no es válida para pago con puntos, favor de ponerse en contacto con el banco.';
      case 2009:
        return 'El código de seguridad de la tarjeta que estás agregando es inválido, por favor revisa a detalle la información o ponte en contacto directo con el banco.';
      case 2010:
        return 'Lo sentimos, la autenticación 3D Secure no es correcta, favor de ponerse en contacto con el banco.';
      case 2011:
        return 'Lo sentimos, este tipo de tarjeta no es soportada en nuestra pasarela de pagos. Puedes utilizar tarjetas VISA o MasterCard';
      case 3001:
        return 'Lo sentimos la tarjeta que estás utilizando fue declinada por el banco, favor de contactarse directamente al banco.';
      case 3002:
        return 'La tarjeta que estás utilizando ha expirado, favor de contactarse directamente con el banco.';
      case 3003:
        return 'Lo sentimos, la tarjeta que estás utilizando no tiene fondos suficientes, favor de contactarse directamente con el banco.';
      case 3004:
        return 'Lo sentimos, La tarjeta intentas usar no es válida para compra, favor de contactarse directamente con el banco. (3004)'; // La tarjeta ha sido identificada como una tarjeta robada
      case 3005:
        return 'Lo sentimos, La tarjeta intentas usar no es válida para compra, favor de contactarse directamente con el banco. (3005)'; // La tarjeta ha sido rechazada por el sistema antifraude
      case 3006:
        return 'Lo sentimos, esta operación no esta permitida para este cliente, favor de contactarse directamente con el banco.';
      case 3009:
        return 'Lo sentimos, La tarjeta intentas usar no es válida para compra, favor de contactarse directamente con el banco. (3009)'; // La tarjeta fue reportada como perdida
      case 3010:
        return 'Lo sentimos, La tarjeta intentas usar no es válida para compra, favor de contactarse directamente con el banco. (3010)'; // El banco ha restringido la tarjeta
      case 3011:
        return 'Lo sentimos, La tarjeta intentas usar no es válida para compra, favor de contactarse directamente con el banco. (3011)'; // El banco ha restringido la tarjeta
      case 3012:
        return 'Lo sentimos, La tarjeta intentas usar no es válida para compra, favor de contactarse directamente con el banco. (3012)'; // El banco ha restringido la tarjeta
      case 3201:
        return 'Lo sentimos este pedido no se puede realizar con pago a meses sin intereses.';
      case 3203:
        return 'Lo sentimos, ésta promoción no es válida para la tarjeta que estás utilizando, por favor intenta con otra.';
      case 3204:
        return 'El monto de la transacción es menor que está permitido para que aplique ésta promoción.';
      case 3205:
        return 'Lo sentimos, ésta promoción no es permitida para la tarjeta que estás utilizando, por favor intenta con otra.';
      case 4001:
        return 'Lo sentimos ocurrió un error interno, estamos trabajando para resolverlo a la brevedad posible.. Por favor contacta con marketplace@daru.mx para brindarte apoyo. (4001)';
      case 4002:
        return 'Lo sentimos ocurrió un error interno, estamos trabajando para resolverlo a la brevedad posible.. Por favor contacta con marketplace@daru.mx para brindarte apoyo. (4002)';
      case 6001:
        return 'Lo sentimos ocurrió un error interno, estamos trabajando para resolverlo a la brevedad posible.. Por favor contacta con marketplace@daru.mx para brindarte apoyo. (6001)';
      case 6002:
        return 'Lo sentimos ocurrió un error interno, estamos trabajando para resolverlo a la brevedad posible.. Por favor contacta con marketplace@daru.mx para brindarte apoyo. (6002)';
      case 6003:
        return 'Lo sentimos ocurrió un error interno, estamos trabajando para resolverlo a la brevedad posible.. Por favor contacta con marketplace@daru.mx para brindarte apoyo. (6003)';
      default:
        return description;
    }
  }

  //#endregion
}

export default ExternalOpenpayService;
