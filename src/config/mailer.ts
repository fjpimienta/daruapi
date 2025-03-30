import chalk from 'chalk';
import nodemailer from 'nodemailer';
import logger from '../utils/logger';

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
  logger.info('=================NODE MAILER CONFIG=====================');
  logger.info(`STATUS: ${chalk.greenBright('ONLINE')}`);
  logger.info(`MESSAGE: ${chalk.greenBright('MAILER CONNECT!!!')}`);
}).catch(error => {
  logger.info('=================NODE MAILER CONFIG=====================');
  logger.info(`STATUS: ${chalk.redBright('OFFLINE')}`);
  logger.info(`MESSAGE: ${chalk.redBright('MAILER CONNECT!!!')}`);
  logger.info(`ERROR: ${chalk.redBright(error.message)}`);
});