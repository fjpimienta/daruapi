import chalk from 'chalk';
import nodemailer from 'nodemailer';
import logger from '../utils/logger';

// Configuración del transporte
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

// Verificación de la conexión del transporte
transporter.verify()
  .then(() => {
    console.log('=================NODE MAILER CONFIG=====================');
    console.log(`STATUS: ${chalk.greenBright('ONLINE')}`);
    console.log(`MESSAGE: ${chalk.greenBright('MAILER CONNECT!!!')}`);

    // Prueba de envío de correo (puedes comentar esto si solo estás verificando la conexión)
    transporter.sendMail({
      from: 'your.email@example.com',
      to: 'recipient@example.com',
      subject: 'Prueba de correo',
      text: 'Este es un correo de prueba.',
    }, (error, info) => {
      if (error) {
        console.error('ERROR AL ENVIAR CORREO:', error);
        logger.info('ERROR AL ENVIAR CORREO: ' + error);
      } else {
        console.log('CORREO ENVIADO:', info);
        logger.info('ERROR AL ENVIAR CORREO: ' + info);
      }
    });
  })
  .catch(error => {
    console.log('=================NODE MAILER CONFIG=====================');
    console.log(`STATUS: ${chalk.redBright('OFFLINE')}`);
    console.log(`MESSAGE: ${chalk.redBright('MAILER CONNECT!!!')}`);
    console.log(`ERROR: ${chalk.redBright(error.message)}`);
  });

export default transporter;
