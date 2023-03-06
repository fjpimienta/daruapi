import { IJwt } from '../interfaces/jwt.interface';
import { EXPIRETIME, MESSAGES, SECRET_KEY } from './../config/constants';
import jwt from 'jsonwebtoken';

class JWT {
  private secretKey = SECRET_KEY as string;

  // Informacion del payload con fecha de caducidad 24 horas por defecto
  sign(data: IJwt, expiresIn: number = EXPIRETIME.H24) {
    return jwt.sign(
      { user: data.user },
      this.secretKey,
      { expiresIn }
    );
  }

  verify(token: string) {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (e) {
      return MESSAGES.TOKEN_VERICATION_FAILED;
    }
  }
}

export default JWT;
