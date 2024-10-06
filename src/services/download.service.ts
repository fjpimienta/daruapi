import http, { ClientRequest, IncomingMessage } from 'http';
import https from 'https';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const MAX_CONCURRENT_DOWNLOADS = 10;
const downloadQueue: Promise<void>[] = [];
const imageCache = new Map<string, string>();

const downloadImage = async (
  url: string,
  destFolder: string,
  filename: string,
  maxRetries = 1,
  retryDelay = 5000
): Promise<void> => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      // Crear la carpeta de destino si no existe
      if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
      }

      const filePath = path.join(destFolder, filename);
      const tempFilePath = path.join(destFolder, `${uuidv4()}.tmp`);
      const protocol = url.startsWith('https') ? https : http;

      // Manejar la solicitud con redirección manual en caso de código 301 o 302
      const response = await new Promise<IncomingMessage>((resolve, reject) => {
        const request = protocol.get(url, (res) => {
          // Manejar redirección si es 301 o 302
          if (res.statusCode === 301 || res.statusCode === 302) {
            const redirectUrl = res.headers.location;
            if (redirectUrl) {
              logger.info(`Redirigiendo a: ${redirectUrl}`);
              // Hacer la solicitud a la URL de redirección
              const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
              const redirectRequest = redirectProtocol.get(redirectUrl, resolve);
              redirectRequest.on('error', reject);
              redirectRequest.setTimeout(30000, () => {
                redirectRequest.abort();
              });
            } else {
              reject(new Error(`Redirección sin URL de destino para ${url}`));
            }
          } else {
            resolve(res);
          }
        });

        request.on('error', reject);
        request.setTimeout(30000, () => {
          request.abort();
        });
      });

      // Verifica el código de estado HTTP
      if (response.statusCode !== 200) {
        throw new Error(`Failed to get '${url}' (${response.statusCode})`);
      }

      // Verifica el tipo de contenido
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image')) {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => responseBody += chunk);
        response.on('end', () => {
          logger.error(`Invalid content type '${contentType}' for URL: ${url}. Response body: ${responseBody}`);
        });
        throw new Error(`Invalid content type '${contentType}' for URL: ${url}`);
      }

      // Descarga la imagen y guarda el archivo temporal
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tempFilePath);
        response.pipe(file);
        file.on('finish', resolve);
        file.on('error', reject);
      });

      // Mueve el archivo temporal a su destino final (sin procesamiento de la imagen)
      fs.renameSync(tempFilePath, filePath);

      // Si todo sale bien, salir del ciclo
      return;
    } catch (error) {
      retries++;
      logger.error(`Error downloading image from ${url}. Retrying (${retries}/${maxRetries})... ${error}`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
};

const checkImageExists = async (url: string): Promise<boolean> => {
  const protocol = url.startsWith('https') ? https : http;
  const options = {
    rejectUnauthorized: false  // Ignorar problemas de certificado SSL
  };
  return new Promise((resolve) => {
    const request = protocol.get(url, options, (res) => {
      const imageExists = res.statusCode === 200;
      // if (imageExists) {
      //   // logger.info(`La imagen existe en la URL: ${url} (Status Code: ${res.statusCode})`);
      // } else {
      //   logger.warn(`La imagen NO existe en la URL: ${url} (Status Code: ${res.statusCode})`);
      // }
      resolve(imageExists);
    });
    request.on('error', (err) => {
      logger.error(`Error al verificar la URL: ${url} - Error: ${err.message}`);
      resolve(false);
    });
    request.setTimeout(30000, () => {
      logger.error(`La solicitud a la URL: ${url} ha superado el tiempo de espera y ha sido abortada.`);
      request.abort();
      resolve(false);
    });
  });
};


export { downloadImage, checkImageExists, imageCache, downloadQueue, MAX_CONCURRENT_DOWNLOADS };
