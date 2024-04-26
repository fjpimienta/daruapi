import { ACTIVE_VALUES_FILTER, COLLECTIONS, EXPIRETIME, MESSAGES } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { findOneElement } from '../lib/db-operations';
import { asignDocumentId } from '../lib/db-operations';
import ResolversOperationsService from './resolvers-operaciones.service';
import bcrypt from 'bcrypt';
import JWT from '../lib/jwt';
import { IVariables } from '../interfaces/variable.interface';
import MailService from './mail.service';

class UsersService extends ResolversOperationsService {
  collection = COLLECTIONS.USERS;
  catalogName = 'Usuarios';
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }

  // Listar informacion
  async items(variables: IVariables) {
    const { active, filterName, role } = variables;
    let filter: object;
    const regExp = new RegExp('.*' + filterName + '.*', 'i');
    if (filterName === '' || filterName === undefined) {
      filter = { active: { $ne: false } };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = {};
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false } };
      }
    } else {
      filter = { active: { $ne: false }, 'name': regExp };
      if (active === ACTIVE_VALUES_FILTER.ALL) {
        filter = { 'name': regExp };
      } else if (active === ACTIVE_VALUES_FILTER.INACTIVE) {
        filter = { active: { $eq: false }, 'name': regExp };
      }
    }
    if (role) {
      filter = { ...filter, ...{ role: { $eq: role } } };
    }
    const page = this.getVariables().pagination?.page;
    const itemsPage = this.getVariables().pagination?.itemsPage;
    const result = await this.list(this.collection, this.catalogName, page, itemsPage, filter);
    return {
      info: result.info,
      status: result.status,
      message: result.message,
      users: result.items
    };
  }

  // Obtener detalles del item (login)
  async login() {
    try {
      const variables = this.getVariables().user;
      const user = await findOneElement(this.getDB(), this.collection, { email: variables?.email });
      if (user === null) {
        return {
          status: false,
          message: 'Lo sentimos este usuario no es parte de #DARUTEAM. Unete a nuestra comunidad',
          token: null
        };
      }
      const passwordCheck = bcrypt.compareSync(variables?.password, user.password);
      if (passwordCheck !== null) {
        delete user.password;
        delete user.registerdate;
      }
      if (!user.active) {
        return {
          status: false,
          message: 'Lo sentimos, este usuario no está activo. Verificar su cuenta de correo o contacte a marketplace@daru.mx',
          token: null
        };
      }
      return {
        status: passwordCheck,
        message: !passwordCheck
          ? 'Lo sentimos el Usuario o Password son incorrectos, sesión no iniciada.'
          : 'El Usuario ha sido verificado, puedes continuar.',
        token: !passwordCheck ? null : new JWT().sign({ user }, EXPIRETIME.H24),
        user: !passwordCheck ? null : user
      };
    } catch (error) {
      console.log('error: ', error);
      return {
        status: false,
        message: 'Lo sentimos hay un errror al cargar el usuario. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo',
        token: null
      };
    }
  }

  // Autenticar
  async auth() {
    let info = new JWT().verify(this.getContext().token!);
    if (info === MESSAGES.TOKEN_VERICATION_FAILED) {
      return {
        status: false,
        message: info,
        user: null
      };
    }
    return {
      status: true,
      message: 'El Usuario ha sido verificado, puedes continuar.',
      user: Object.values(info)[0]
    };
  }

  // Anadir Item
  async register() {
    const user = this.getVariables().user;
    // Comprobar que el usuario no sea nulo.
    if (user === null) {
      return {
        status: false,
        mesage: 'Lo sentimos hay un errror al cargar el usuario. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo',
        user: null
      };
    }
    // Verificar que el usuario no existe.
    const userCheck = await findOneElement(this.getDB(), this.collection, { email: user?.email });
    if (userCheck !== null) {
      return {
        status: false,
        message: `Lo sentimos el email ${user?.email} ya es parte de #DARUTEAM. Intentar con otro email.`,
        user: null
      };
    }

    // Verificar el último usuario registrado para asignar ID
    user!.id = await asignDocumentId(this.getDB(), this.collection, { registerdate: -1 });
    // Asignar la fecha en formato ISO en  registerdate
    user!.registerdate = new Date().toISOString();

    // Guardar el docuento (registro) en la colección
    const result = await this.add(this.collection, user || {}, 'usuario');
    return {
      status: result.status,
      message: result.message,
      user: result.item
    };
  }

  // Obtener el siguiente elemento
  async next() {
    const result = await this.nextId(this.collection);
    return {
      status: result.status,
      message: result.message,
      userId: result.catId
    };
  }

  // Modificar Item
  async modify() {
    const user = this.getVariables().user;
    // Comprobar que el usuario no sea nulo.
    if (user === null) {
      return {
        status: false,
        mesage: 'Lo sentimos hay un errror al cargar el usuario. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo',
        user: null
      };
    }

    // Conocer el id del usuario
    const filter = { id: user?.id };

    const result = await this.updateForce(this.collection, filter, user || {}, 'usuarios');
    return {
      status: result.status,
      message: result.message,
      user: result.item
    };
  }

  // Eliminar item
  async delete() {
    const id = this.getVariables().id;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: 'Lo sentimos hay un errror el identificador del usuario. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo',
        user: null
      };
    }
    const result = await this.del(this.collection, { id }, 'usuario');
    return {
      status: result.status,
      message: result.message
    };
  }

  // Bloquear item
  async unblock(unblock: boolean, admin: boolean) {
    const id = this.getVariables().id;
    const user = this.getVariables().user;
    if (!this.checkData(String(id) || '')) {
      return {
        status: false,
        message: 'Lo sentimos hay un errror al cargar el correo del usuario. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo',
        user: null
      };
    }
    let update = { active: unblock };
    if (unblock && !admin) {
      update = Object.assign({}, { active: true }, {
        password: bcrypt.hashSync(user?.password, 10)
      });
    }
    const result = await this.update(this.collection, { id }, update, 'usuario');
    const action = (unblock) ? 'Activado' : 'Desactivado';
    return {
      status: result.status,
      message: (result.message) ? `${action} correctamente` : `No se ha ${action.toLowerCase()} comprobarlo por favor`
    };
  }

  // Activar Usuario
  async active() {
    const id = this.getVariables().user?.id;
    const email = this.getVariables().user?.email || '';
    const admin = this.getVariables().admin || '';
    if (email === undefined || email === '') {
      return {
        status: false,
        message: 'Lo sentimos hay un errror al cargar el email. Por favor contáctanos a marketplace@daru.mx para brindarte apoyo'
      };
    }
    const token = new JWT().sign({ user: { id, email } }, EXPIRETIME.H1);
    let html = '';
    if (admin) {
      html = `
      <header>
          <h1>Bienvenido a #DARUTEAM</h1>
      </header>
      <main>
          <h2>¡Bienvenido a nuestro TEAM!</h2>
          <p>Estamos emocionados de tenerte como parte de nuestra comunidad, para poder continuar es necesario que actives tu cuenta.</p>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL_ADMIN}auth/active/${token}" style="text-decoration: none; cursor: pointer;">
              <button style="background-color: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; font-size: 16px;">Activar cuenta</button>
            </a>
          </div>
          <p>&nbsp;</p>
          <p>&nbsp;</p>
      </main>
      <footer>
          <p>&nbsp;</p>
      </footer>
      `
    } else {
      html = `
      <header>
          <h1>Bienvenido a #DARUTEAM</h1>
      </header>
      <main>
          <h2>¡Bienvenido a nuestro TEAM!</h2>
          <p>Estamos emocionados de tenerte como parte de nuestra comunidad, para poder continuar es necesario que actives tu cuenta.</p>
          <div style="text-align: center;">
            <a href="${process.env.CLIENT_URL}active/${token}" style="text-decoration: none; cursor: pointer;">
              <button style="background-color: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; font-size: 16px;">Activar cuenta</button>
            </a>
          </div>
          <p>&nbsp;</p>
          <p>Consulta nuestros terminos y condiciones. <a href="${process.env.CLIENT_URL}terminos" style="text-decoration: none; color: #007bff; padding: 5px 10px; background-color: #f0f0f0; border-radius: 4px;">Click aqui</a></p>
      </main>
      <footer>
          <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. <a href="${process.env.CLIENT_URL}contact" style="text-decoration: none; color: #007bff; padding: 5px 10px; background-color: #f0f0f0; border-radius: 4px;">Click Aqui</a></p>
      </footer>
      `
    }
    const mail = {
      to: email,
      subject: 'Activar Usuario',
      html
    };
    return new MailService().send(mail);
  }

  // Comprobar que no esta en blanco ni es indefinido
  private checkData(value: string) {
    return (value === '' || value === undefined) ? false : true;
  }

  // Verificar existencia en Base de Datos
  private async checkInDatabase(value: string) {
    return await findOneElement(this.getDB(), this.collection, {
      name: value
    });
  }
}

export default UsersService;