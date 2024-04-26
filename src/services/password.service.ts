import bcrypt from 'bcrypt';
import { COLLECTIONS, EXPIRETIME } from '../config/constants';
import { IContextData } from '../interfaces/context-data.interface';
import { findOneElement } from '../lib/db-operations';
import JWT from '../lib/jwt';
import MailService from './mail.service';
import ResolversOperationsService from './resolvers-operaciones.service';

class PasswordService extends ResolversOperationsService {
  constructor(root: object, variables: object, context: IContextData) {
    super(root, variables, context);
  }
  async sendMail() {
    const email = this.getVariables().user?.email || '';
    if (email === undefined || email === '') {
      return {
        status: false,
        message: 'El correo electrónico que estás colocando contiene información que no es válida, por favor verifica la información.'
      };
    }
    // Obtener informacion del usuario
    const user = await findOneElement(this.getDB(), COLLECTIONS.USERS, { email });
    // Si usuario es indefinido mandamos un mensaje que no existe el usuario
    if (user === undefined || user === null) {
      return {
        status: false,
        message: `Lo sentimos, el usuario con el correo electrónico ${email} que acabas de ingresar no existe, por favor verifica la información.`
      };
    }
    const newUser = {
      id: user.id,
      email
    };
    const token = new JWT().sign({ user: newUser }, EXPIRETIME.M15);
    const html = `
    <header>
        <h1>Bienvenido a #DARUTEAM</h1>
    </header>
    <main>
        <p>¡Bienvenido a nuestro TEAM! Estamos emocionados de tenerte como parte de nuestra comunidad.</p>
        <p>Para cambiar el password haz click sobre esto: <a href="${process.env.CLIENT_URL}reset/${token}">Click aqui</a></p>
        <p>Consulta nuestros terminos y condiciones. <a href="${process.env.CLIENT_URL}terminos">Click aqui</a></p>
    </main>
    <footer>
        <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en <a href="${process.env.CLIENT_URL}contact">Contactanos</a>.</p>
    </footer>
    `
    const mail = {
      to: email,
      subject: 'Peticion para cambiar de password',
      html
    };
    return new MailService().send(mail);
  }

  async change() {
    const id = this.getVariables().user?.id;
    let password = this.getVariables().user?.password;
    // Comprobar que el id es correcto: no indefinido y no en blanco
    if (id === undefined || id === '') {
      return {
        status: false,
        message: 'El ID necesita una informacion correcta'
      };
    }
    // Comprobar que el password es correcto: no indefinido y no en blanco
    if (password === undefined || password === '' || password === '1234') {
      return {
        status: false,
        message: 'La contraseña que estás colocando contiene información que no es válida.'
      };
    }
    // Encriptar el password
    password = bcrypt.hashSync(password, 10);
    // Actualizar en el id seleccionado de la coleccion usuarios
    const result = await this.update(
      COLLECTIONS.USERS,
      { id },
      { password },
      'users'
    );
    return {
      status: result.status,
      message: (result.status) ? 'Tú contraseña fue cambiada correctamente.' : result.message
    };
  }
}

export default PasswordService;