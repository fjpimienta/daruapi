import chalk from 'chalk';
import nodemailer from 'nodemailer';

export const transport = nodemailer.createTransport({
  pool: true,
  host: 'smtp.ionos.mx',
  port: 587,                                   // Deberías usar 587 para TLS o STARTTLS, 465 es para SSL, pero no estás usando "secure: true"
  secure: true,                                // Establecer a true solo si estás utilizando SSL (puerto 465)
  auth: {
    user: process.env.USER_EMAIL,              // generated ethereal user
    pass: process.env.USER_PASSWORD,           // generated ethereal password
  },
  tls: {
    ciphers: 'TLS_AES_128_GCM_SHA256'          // Mejorar las ciphers para seguridad, SSLv3 no se recomienda
  }
});

transport.verify().then(() => {
  console.log('=================NODE MAILER CONFIG=====================');
  console.log(`STATUS: ${chalk.greenBright('ONLINE')}`);
  console.log(`MESSAGE: ${chalk.greenBright('MAILER CONNECT!!!')}`);
}).catch(error => {
  console.log('=================NODE MAILER CONFIG=====================');
  console.log(`STATUS: ${chalk.redBright('OFFLINE')}`);
  console.log(`MESSAGE: ${chalk.redBright('MAILER CONNECT!!!')}`);
  console.log(`ERROR: ${chalk.redBright(error.message)}`);
});