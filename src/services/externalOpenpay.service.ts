import { IContextData } from '../interfaces/context-data.interface';
import { IVariables } from '../interfaces/variable.interface';
import ResolversOperationsService from './resolvers-operaciones.service';
import OpenPay from 'openpay';

class ExternalOpenpayService extends ResolversOperationsService {
  private openpay: any; // Agrega la propiedad openpay para acceder a la instancia de OpenPay

  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);

    // Inicializar la instancia de OpenPay con tus credenciales
    const MERCHANT_ID = process.env.OPENPAY_MERCHANT_ID ?? 'm6xdaknfuv0l7ytry0li';
    const CLIENT_SECRET = process.env.OPENPAY_CLIENT_SECRET ?? 'sk_hzwz5re4i0mvygx0tbtmdevpn1i86cax';
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.error('error: ', error);
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

      const chargeOpenpay = await new Promise((resolve, reject) => {
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
        message: 'El cargo se ha localizado correctamente.',
        chargeOpenpay,
      };
    } catch (error: any) {
      console.error('error: ', error);
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
      console.error('error: ', error);
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
      console.log('payoutOpenpay: ', payoutOpenpay);
      const createPayoutOpenpay = await new Promise((resolve, reject) => {
        this.openpay.payouts.create(payoutOpenpay, (error: any, response: any) => {
          if (error) {
            console.log('error: ', error);
            reject(error);
          } else {
            console.log('createCharge/response: ', response);
            resolve(response);
          }
        });
      });
      console.log('createCharge/createPayoutOpenpay: ', createPayoutOpenpay);
      return {
        status: true,
        message: 'El cargo se ha creado correctamente.',
        createPayoutOpenpay,
      };
    } catch (error: any) {
      console.error('error: ', error);
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
    switch (error.error_code) {
      case 1000:
        return 'Ocurrió un error interno en el servidor de Openpay.';
      case 1001:
        if (error.description.includes('cvv2 length must be 3 digits')) {
          return 'El código de seguridad de la tarjeta (CVV2) debe ser de 3 digitos.';
        } else if (error.description.includes('expiration_year')) {
          return 'El año debe ser de 2 digitos.';
        } else if (error.description.includes('expiration_month')) {
          return 'El mes debe ser de 2 digitos. De 01 a 12';
        } else if (error.description.includes('expiration_month length must be 2 digits')) {
          return 'El mes debe ser de 2 digitos. De 01 a 12';
        }
      case 1002:
        return 'La llamada no esta autenticada o la autenticación es incorrecta.';
      case 1003:
        if (error.http_code===422) {
          return 'El cargo a la tarjeta se encuentra en estado final.';
        }
        return 'La operación no se pudo completar por que el valor de uno o más de los parámetros no es correcto.';
      case 1004:
        return 'Un servicio necesario para el procesamiento de la transacción no se encuentra disponible.';
      case 1005:
        return 'Uno de los recursos requeridos no existe.';
      case 1006:
        return 'Ya existe una transacción con el mismo ID de orden.';
      case 1007:
        return 'La transferencia de fondos entre una cuenta de banco o tarjeta y la cuenta de Openpay no fue aceptada.';
      case 1008:
        return 'Una de las cuentas requeridas en la petición se encuentra desactivada.';
      case 1009:
        return 'El cuerpo de la petición es demasiado grande.';
      case 1010:
        return 'Se esta utilizando la llave pública para hacer una llamada que requiere la llave privada, o bien, se esta usando la llave privada desde JavaScript.';
      case 1011:
        return 'Se solicita un recurso que esta marcado como eliminado.';
      case 1012:
        return 'El monto transacción esta fuera de los limites permitidos.';
      case 1013:
        return 'La operación no esta permitida para el recurso.';
      case 1014:
        return 'La cuenta esta inactiva.';
      case 1015:
        return 'No se ha obtenido respuesta de la solicitud realizada al servicio.';
      case 1016:
        return 'El mail del comercio ya ha sido procesada.';
      case 1017:
        return 'El gateway no se encuentra disponible en ese momento.';
      case 1018:
        return 'El número de intentos de cargo es mayor al permitido.';
      case 1020:
        return 'El número de dígitos decimales es inválido para esta moneda.';
      case 1023:
        return 'Se han terminado las transacciones incluidas en tu paquete. Para contratar otro paquete contacta a soporte@openpay.mx.';
      case 1024:
        return 'El monto de la transacción excede su límite de transacciones permitido por TPV.';
      case 1025:
        return 'Se han bloqueado las transacciones CoDi contratadas en tu plan.';
      case 2001:
        return 'La cuenta de banco con esta CLABE ya se encuentra registrada en el cliente.';
      case 2003:
        return 'El cliente con este identificador externo (External ID) ya existe.';
      case 2004:
        return 'El número de tarjeta no es valido.';
      case 2005:
        return 'La fecha de expiración de la tarjeta es anterior a la fecha actual.';
      case 2006:
        return 'El código de seguridad de la tarjeta (CVV2) no fue proporcionado.';
      case 2007:
        return 'El número de tarjeta es de prueba, solamente puede usarse en Sandbox.';
      case 2008:
        return 'La tarjeta no es valida para pago con puntos.';
      case 2009:
        return 'El código de seguridad de la tarjeta (CVV2) es inválido.';
      case 2010:
        return 'Autenticación 3D Secure fallida.';
      case 2011:
        return 'Tipo de tarjeta no soportada.';
      case 3001:
        return 'La tarjeta fue declinada por el banco.';
      case 3002:
        return 'La tarjeta ha expirado.';
      case 3003:
        return 'La tarjeta no tiene fondos suficientes.';
      case 3004:
        return 'Tarjeta no válida para compra. (3004)'; // La tarjeta ha sido identificada como una tarjeta robada
      case 3005:
        return 'Tarjeta no válida para compra. (3005)'; // La tarjeta ha sido rechazada por el sistema antifraude
      case 3006:
        return 'La operación no esta permitida para este cliente o esta transacción.';
      case 3009:
        return 'Tarjeta no válida para compra. (3009)'; // La tarjeta fue reportada como perdida
      case 3010:
        return 'Tarjeta no válida para compra. (3010)'; // El banco ha restringido la tarjeta
      case 3011:
        return 'Tarjeta no válida para compra. (3011)'; // El banco ha restringido la tarjeta
      case 3012:
        return 'El banco ha solicitado que la tarjeta sea retenida. Contacte al banco.';
      case 3201:
        return 'Comercio no autorizado para procesar pago a meses sin intereses.';
      case 3203:
        return 'Promoción no valida para este tipo de tarjetas.';
      case 3204:
        return 'El monto de la transacción es menor al mínimo permitido para la promoción.';
      case 3205:
        return 'Promoción no permitida.';
      case 4001:
        return 'La cuenta de Openpay no tiene fondos suficientes.';
      case 4002:
        return 'La operación no puede ser completada hasta que sean pagadas las comisiones pendientes.';
      case 6001:
        return 'El webhook ya ha sido procesado.';
      case 6002:
        return 'No se ha podido conectar con el servicio de webhook.';
      case 6003:
        return 'El servicio respondió con errores.';
      default:
        return error.description;
    }
  }

  //#endregion
}

export default ExternalOpenpayService;
