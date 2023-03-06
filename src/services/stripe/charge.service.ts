import StripeApi, { STRIPE_ACTIONS, STRIPE_OBJECTS } from '../../lib/stripe-api';
import StripeCardService from './card.service';
import StripeCustomerService from './customer.service';
import { IOrder } from '../../interfaces/order.interface';
import { IPayment } from '../../interfaces/stripe/payment.interface';
import UsersService from '../users.service';
import { Db } from 'mongodb';
import OrdersService from '../order.service';
import { IStripeCharge } from '../../interfaces/stripe/charge.interface';

class StripeChargeService extends StripeApi {
  private async getClient(customer: string) {
    return new StripeCustomerService().get(customer);
  }

  async order(payment: IPayment, order: IOrder, db: Db) {
    // Comprobar que existe el cliente
    const userData = await this.getClient(payment.customer);
    if (userData && userData.status) {
      if (payment.token !== undefined) {
        // Asociar el cliente a la tarjeta
        const cardCreate = await new StripeCardService().create(
          payment.customer, payment.token
        );
        // Actualizar como fuente predeterminada de pago
        await new StripeCustomerService().update(
          payment.customer, {
          default_source: cardCreate.card?.id
        });
        // Actualizar borrando las demas tarjetas de ese cliente
        await new StripeCardService().removeOtherCards(payment.customer, cardCreate.card?.id || '');
      } else if (payment.token === undefined && userData.customer?.default_source === null) {
        return {
          status: false,
          message: 'El cliente no tiene ningun metodo de pago asignado y no puede realizar el pago.'
        };
      }
    } else {
      if (payment.token !== undefined) {
        // Asociar el cliente a la tarjeta
        const cardCreate = await new StripeCardService().create(
          payment.customer, payment.token
        );
        // Actualizar como fuente predeterminada de pago
        await new StripeCustomerService().update(
          payment.customer, {
          default_source: cardCreate.card?.id
        });
        // Actualizar borrando las demas tarjetas de ese cliente
        await new StripeCardService().removeOtherCards(payment.customer, cardCreate.card?.id || '');
      } else if (payment.token === undefined) {
        return {
          status: false,
          message: 'El cliente no tiene ningun metodo de pago asignado y no puede realizar el pago.'
        };
      }
    }

    // Eliminar el dato token, ya que no esta como parametro de payment
    delete payment.token;
    // Convertir a 0 decimal
    payment.amount = Math.round(((+payment.amount + Number.EPSILON) * 100) / 100 * 100);
    // Pago
    return await this.execute(
      STRIPE_OBJECTS.CHARGES,
      STRIPE_ACTIONS.CREATE,
      payment
    ).then((result: IStripeCharge) => {
      // Actualizar el Stock
      //  new ShopProductsService({}, {}, { db }).updateStock(stockChange, pubsub);

      // Registrar el usuario de la orden
      const resultUserOperation = new UsersService({}, { user: order.user }, { db }).register().then(resultUser => {
      });
      // Registrar la orden en nuestra BD MongoDB.
      const newCharge: IStripeCharge = {
        id: result.id,
        amount: result.amount,
        status: result.status,
        receipt_email: result.receipt_email,
        receipt_url: result.receipt_url,
        paid: result.paid,
        payment_method: result.payment_method,
        created: result.created,
        description: result.description,
        customer: result.customer,
      };
      order.charge = newCharge;
      order.name = result.description;
      const resultOrderOperation = new OrdersService({}, { order }, { db }).insert().then(resultOrder => {
      });

      return {
        status: true,
        message: 'Pago realizado correctamente!',
        charge: result
      };
    }).catch((error: Error) => this.getError(error));
  }

  async listByCustomer(customer: string, limit: Number, startingAfter: string, endingBefore: string) {
    const pagination = this.getPagination(startingAfter, endingBefore);
    return this.execute(
      STRIPE_OBJECTS.CHARGES,
      STRIPE_ACTIONS.LIST,
      {
        limit,
        customer,
        ...pagination
      }
    ).then((result: { has_more: boolean, data: Array<IStripeCharge> }) => {
      return {
        status: true,
        message: `Lista cargada correctamente con los pagos del cliente seleccionados`,
        hasMore: result.has_more,
        charges: result.data
      };
    }).catch((error: Error) => this.getError(error));
  }
}

export default StripeChargeService;