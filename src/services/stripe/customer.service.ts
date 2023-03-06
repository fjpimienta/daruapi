import { Db } from 'mongodb';
import { COLLECTIONS } from '../../config/constants';
import { IStripeCustomer } from '../../interfaces/stripe/customer.interface';
import { IUser } from '../../interfaces/user.interface';
import { findOneElement } from '../../lib/db-operations';
import StripeApi, { STRIPE_ACTIONS, STRIPE_OBJECTS } from '../../lib/stripe-api';
import UsersService from '../users.service';

class StripeCustomerService extends StripeApi {
   // Lista de Clientes
   async list(limit: number, startingAfter: string, endingBefore: string) {
      const pagination = this.getPagination(startingAfter, endingBefore);
      return await this.execute(
         STRIPE_OBJECTS.CUSTOMERS,
         STRIPE_ACTIONS.LIST,
         {
            limit,
            ...pagination
         }
      ).then((result: { has_more: boolean, data: Array<IStripeCustomer> }) => {
         return {
            status: true,
            message: `Lista cargada correctamente con los clientes seleccionados`,
            hasMore: result.has_more,
            customers: result.data
         };
      }).catch((error: Error) => this.getError(error));
   }

   // Obtiene un cliente
   async get(id: string) {
      return await this.execute(
         STRIPE_OBJECTS.CUSTOMERS,
         STRIPE_ACTIONS.GET,
         id
      ).then(async (result: IStripeCustomer) => {
         return {
            status: true,
            message: `El cliente ${result.name} se ha obtenido correctamente`,
            customer: result
         };
      }).catch((error: Error) => this.getError(error));
   }

   // Existe Cliente
   async existeCustomer(email: string) {
      // Comprobar que el cliente no exista.
      const userCheckExist: { data: Array<IStripeCustomer> } = await this.execute(
         STRIPE_OBJECTS.CUSTOMERS,
         STRIPE_ACTIONS.LIST,
         {
            email
         }
      );
      if (userCheckExist.data.length > 0) {
         // Usuario existe - Devolver diciendo que no se puede agregar
         return {
            status: false,
            message: `El usuario con el email ${email} ya existe en el sistema`,
            customer: userCheckExist.data[0]
         };
      }
      return {
         status: true,
         message: `El usuario con el email ${email} no existe en el sistema`
      };
   }

   // Crear un cliente
   async add(name: string, email: string, db: Db) {
      // Comprobar que el cliente no exista.
      const userCheckExist: { data: Array<IStripeCustomer> } = await this.execute(
         STRIPE_OBJECTS.CUSTOMERS,
         STRIPE_ACTIONS.LIST,
         {
            email
         }
      );
      if (userCheckExist.data.length > 0) {
         // Usuario existe - Devolver diciendo que no se puede agregar
         return {
            status: false,
            message: `El usuario con el email ${email} ya existe en el sistema`
         };
      }

      // Se agrega el cliente.
      return await this.execute(
         STRIPE_OBJECTS.CUSTOMERS,
         STRIPE_ACTIONS.CREATE,
         {
            name,
            email,
            description: `${name} (${email})`,
         }
      ).then(async (result: IStripeCustomer) => {
         // Actualizar en nuestra base de datos con la nueva propiedad que es el id del cliente
         const user: IUser = await findOneElement(db, COLLECTIONS.USERS, { email });
         if (user) {
            user.stripeCustomer = result.id;
            const resultUserOperation = await new UsersService({}, { user }, { db }).modify();
            console.log('resultUserOperation: ', resultUserOperation);
            // Si el resultado es falso, no se ha ejecutado. Hay que borrar el cliente creado (en stripe)
         }
         return {
            status: true,
            message: `El cliente ${name} se ha creado correctamente`,
            customer: result
         };
      }).catch((error: Error) => this.getError(error));
   }

   // Actualizar un cliente
   async update(id: string, customer: IStripeCustomer) {
      return await this.execute(
         STRIPE_OBJECTS.CUSTOMERS,
         STRIPE_ACTIONS.UPDATE,
         id,
         customer
      ).then((result: IStripeCustomer) => {
         return {
            status: true,
            message: `Usuario ${id} actualizado correctamente.`,
            customer: result
         };
      }).catch((error: Error) => this.getError(error));
   }

   // Eliminar un cliente
   async delete(id: string, db: Db) {
      return await this.execute(
         STRIPE_OBJECTS.CUSTOMERS,
         STRIPE_ACTIONS.DELETE,
         id
      ).then(async (result: { id: string, deleted: boolean }) => {
         if (result.deleted) {
            const resultOperation = await db
               .collection(COLLECTIONS.USERS)
               .updateOne({ stripeCustomer: result.id }, { $unset: { stripeCustomer: result.id } }
               );
            return {
               status: result.deleted && resultOperation ? true : false,
               message: result.deleted && resultOperation ?
                  `Usuario ${id} actualizado correctamente.` :
                  `Usuario ${id} no se ha actualizado correctamente.`
            };
         }
         return {
            status: false,
            message: `Usuario ${id} no se ha actualizado correctamente. Compruebalo`
         };
      }).catch((error: Error) => this.getError(error));
   }
}

export default StripeCustomerService;