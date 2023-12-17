import transporter from '../config/mailer';
import { IMailOptions } from '../interfaces/email.interface';
import { SentMessageInfo } from 'nodemailer';

class MailService {
  send(mail: IMailOptions): Promise<{ status: boolean; message: string; mail?: IMailOptions }> {
    return new Promise((resolve, reject) => {
      transporter.sendMail({
        from: '"DARU Shop - " <marketplace@daru.mx>',
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
      }, (error: Error | null, info: SentMessageInfo) => {
        if (error) {
          reject({
            status: false,
            message: error.message,
          });
        } else {
          resolve({
            status: true,
            message: `DARU Shop - Email enviado correctamente a ${mail.to}`,
            mail,
          });
        }
      });
    });
  }
}

export default MailService;
