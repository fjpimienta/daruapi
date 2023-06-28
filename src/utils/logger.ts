import winston from 'winston';

// const logger = winston.createLogger({
//   level: 'info', // Nivel mínimo de logs a registrar (p. ej., 'info', 'error', 'debug')
//   format: winston.format.simple(), // Formato del log
//   transports: [
//     new winston.transports.Console(), // Salida a la consola
//     new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), // Salida a un archivo
//     new winston.transports.File({ filename: 'logs/combined.log' }) // Salida a otro archivo
//   ]
// });

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.simple(),
    winston.format.timestamp(),
    winston.format.printf(info => `[${info.timestamp}] ${info.level} ${info.message}`)
  ),
  transports: [
    new winston.transports.File({
      maxsize: 5120000,
      maxFiles: 5,
      filename: `${__dirname}/../logs/log-api.log`
    }),
    new winston.transports.Console({
      level: 'debug'
    })
  ]
});

export default logger;
