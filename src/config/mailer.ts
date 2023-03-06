import chalk from 'chalk';
import nodemailer from 'nodemailer';

export const transport = nodemailer.createTransport({
  pool: true,
  host: 'smtp.ionos.mx',
  port: 587,                                    // 465 (gmail)
  secure: false,                                // true for 465, false for other ports
  auth: {
    user: process.env.USER_EMAIL,               // generated ethereal user
    pass: process.env.USER_PASSWORD,            // generated ethereal password
  },
  tls: {
    ciphers: 'SSLv3'                            //  adding the tls.ciphers option to use SSLv3
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