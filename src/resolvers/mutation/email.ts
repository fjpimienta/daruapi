import { IResolvers } from '@graphql-tools/utils';
import { MESSAGES } from '../../config/constants';
import JWT from '../../lib/jwt';
import MailService from '../../services/mail.service';
import PasswordService from '../../services/password.service';
import UsersService from '../../services/users.service';

const resolversMailMutation: IResolvers = {
  Mutation: {
    async sendEmail(_, { mail }) {
      return new MailService().send(mail);
    },
    async activeUserEmail(_, { id, email }) {
      return new UsersService(_, { user: { id, email } }, {}).active();
    },
    async activeUserAction(_, { id, password }, { token, db }) {
      // Verificar el token
      const verify = verifyToken(token, id);
      if (verify?.status === false) {
        return {
          status: false,
          message: verify.message
        };
      }
      return new UsersService(_, { id, user: { password } }, { token, db }).unblock(true, false);
    },
    async resetPassword(_, { email }, { db }) {
      return new PasswordService(_, { user: { email } }, { db }).sendMail();
    },
    async changePassword(_, { id, password }, { token, db }) {
      // Verificar el token
      const verify = verifyToken(token, id);
      if (verify?.status === false) {
        return {
          status: false,
          message: verify.message
        };
      }
      return new PasswordService(_, { user: { id, password } }, { db }).change();
    }
  }
};

function verifyToken(token: string, id: string) {
  const checkToken = new JWT().verify(token);
  if (checkToken === MESSAGES.TOKEN_VERICATION_FAILED) {
    return {
      status: false,
      message: 'El periodo para activar el usuario ha finalizado. Contacta con el administrador para mas informacion.',
      user: null
    };
  }
  // Si el token es valido, asignamos la informacion al usuario
  const user = Object.values(checkToken)[0];
  if (user.id !== id) {
    return {
      status: false,
      message: 'El usuario del token no corresponde al agregado en el argumento.'
    };
  }

  return {
    status: true,
    message: 'Token correcto, podemos seguir'
  };
}

export default resolversMailMutation;
