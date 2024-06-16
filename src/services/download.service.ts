import http from 'http';
import https from 'https';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import logger from '../utils/logger';

const downloadImage = (url: string, destFolder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Asegúrate de que la carpeta de destino existe
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const fileName = `${uuidv4()}${path.extname(url)}`;
    const filePath = path.join(destFolder, fileName);

    const file = fs.createWriteStream(filePath);

    const protocol = url.startsWith('https') ? https : http;

    console.log(`Starting download from: ${url}`);
    logger.info(`Starting download from: ${url}`);

    protocol.get(url, (response) => {
      console.log(`Response status code: ${response.statusCode}`);
      logger.info(`Response status code: ${response.statusCode}`);

      if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {
          let errorMessage;
          if (response.statusCode === 404) {
            errorMessage = `Image not found: ${url} (404)`;
          } else {
            errorMessage = `Failed to get '${url}' (${response.statusCode})`;
          }
          console.error(errorMessage);
          logger.info(`response(if) - errorMessage: ${errorMessage}`);
          return reject(errorMessage);
        });
      } else {
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image')) {
          fs.unlink(filePath, () => {
            const errorMessage = `Invalid content type '${contentType}' for URL: ${url}`;
            console.error(errorMessage);
            logger.info(`response(else) - errorMessage: ${errorMessage}`);
            return reject(errorMessage);
          });
        } else {
          response.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              console.log(`Successfully downloaded image: ${filePath}`);
              logger.info(`Successfully downloaded image: ${filePath}`);
              resolve(fileName);
            });  // Cierra el archivo y resuelve la promesa
          });

          file.on('error', (err) => {
            console.error(`File stream error: ${err.message}`);
            logger.info(`File stream error: ${err.message}`);
            fs.unlink(filePath, () => reject(err.message));
          });

          response.on('error', (err) => {
            console.error(`Response stream error: ${err.message}`);
            logger.info(`Response stream error: ${err.message}`);
            fs.unlink(filePath, () => reject(err.message));
          });
        }
      }
    }).on('error', (err) => {
      console.error(`Request error: ${err.message}`);
      logger.info(`Request error: ${err.message}`);
      fs.unlink(filePath, () => reject(err.message));
    });
  });
};

export default downloadImage;
