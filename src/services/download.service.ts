import http, { ClientRequest, IncomingMessage } from 'http';
import https from 'https';
import fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

const downloadImage = (url: string, destFolder: string, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Ensure the destination folder exists
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }

    const filePath = path.join(destFolder, filename);
    const protocol = url.startsWith('https') ? https : http;

    console.log(`Starting download from: ${url}`);
    logger.info(`Starting download from: ${url}`);

    const request = (protocol.get(url, (response: IncomingMessage) => {
      if (!response || response.statusCode === null) {
        const errorMessage = `No valid response from: ${url}`;
        console.error(errorMessage);
        logger.error(errorMessage);
        fs.unlink(filePath, () => reject(errorMessage));
        return;
      }

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
          logger.error(`response(if) - errorMessage: ${errorMessage}`);
          return reject(errorMessage);
        });
      } else {
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image')) {
          fs.unlink(filePath, () => {
            const errorMessage = `Invalid content type '${contentType}' for URL: ${url}`;
            console.error(errorMessage);
            logger.error(`response(else) - errorMessage: ${errorMessage}`);
            return reject(errorMessage);
          });
        } else {
          const file = fs.createWriteStream(filePath);

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              console.log(`Successfully downloaded image: ${filePath}`);
              logger.info(`Successfully downloaded image: ${filePath}`);
              resolve(filename);
            });  // Cierra el archivo y resuelve la promesa
          });

          file.on('error', (err) => {
            console.error(`File stream error: ${err.message}`);
            logger.error(`File stream error: ${err.message}`);
            fs.unlink(filePath, () => reject(err.message));
          });

          response.on('error', (err) => {
            console.error(`Response stream error: ${err.message}`);
            logger.error(`Response stream error: ${err.message}`);
            file.close(() => {
              fs.unlink(filePath, () => reject(err.message));
            });
          });
        }
      }
    }) as ClientRequest);

    request.on('error', (err) => {
      console.error(`Request error: ${err.message}`);
      logger.error(`Request error: ${err.message}`);
      fs.unlink(filePath, () => reject(err.message));
    });
  });
};

const checkImageExists = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    (protocol.get(url, (res) => {
      resolve(res.statusCode === 200);
    }) as ClientRequest).on('error', () => {
      resolve(false);
    });
  });
};

export { downloadImage, checkImageExists };