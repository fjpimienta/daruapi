import chalk from 'chalk';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  pool: true,
  host: 'smtp.ionos.mx',
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
  tls: {
    ciphers: 'TLS_AES_128_GCM_SHA256',
  },
});

export default transporter;

transporter.verify().then(() => {
  console.log('=================NODE MAILER CONFIG=====================');
  console.log(`STATUS: ${chalk.greenBright('ONLINE')}`);
  console.log(`MESSAGE: ${chalk.greenBright('MAILER CONNECT!!!')}`);
}).catch(error => {
  console.log('=================NODE MAILER CONFIG=====================');
  console.log(`STATUS: ${chalk.redBright('OFFLINE')}`);
  console.log(`MESSAGE: ${chalk.redBright('MAILER CONNECT!!!')}`);
  console.log(`ERROR: ${chalk.redBright(error.message)}`);
});