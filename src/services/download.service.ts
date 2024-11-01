import http, { ClientRequest, IncomingMessage } from 'http';
import https from 'https';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';
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
  let tempFilePath = '';

  while (retries < maxRetries) {
    try {
      if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
      }

      const filePath = path.join(destFolder, filename);
      tempFilePath = path.join(destFolder, `${uuidv4()}.tmp`);
      const protocol = url.startsWith('https') ? https : http;

      const response = await new Promise<IncomingMessage>((resolve, reject) => {
        const request = protocol.get(url, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            const redirectUrl = res.headers.location;
            if (redirectUrl) {
              const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
              const redirectRequest = redirectProtocol.get(redirectUrl, resolve);
              redirectRequest.on('error', reject);
              redirectRequest.setTimeout(30000, () => {
                redirectRequest.abort();
                reject(new Error(`Timeout al redirigir a ${redirectUrl}`));
              });
            } else {
              reject(new Error(`Redirección sin URL de destino para ${url}`));
            }
          } else {
            resolve(res);
          }
        });
        request.on('error', reject);
        request.setTimeout(90000, () => {
          request.abort();
          reject(new Error(`Timeout al intentar acceder a ${url}`));
        });
      });

      // Manejo del código de estado 429
      if (response.statusCode === 429) {
        throw new Error(`Demasiadas solicitudes para ${url}. Código de estado: ${response.statusCode}`);
      }

      if (response.statusCode !== 200) {
        throw new Error(`Failed to get '${url}' (${response.statusCode})`);
      }

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image')) {
        let responseBody = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => (responseBody += chunk));
        response.on('end', () => {
          logger.error(`Invalid content type '${contentType}' for URL: ${url}. Response body: ${responseBody}`);
        });
        throw new Error(`Invalid content type '${contentType}' for URL: ${url}`);
      }

      await new Promise<void>((resolve, reject) => {
        const file = fs.createWriteStream(tempFilePath);
        response.pipe(file);
        file.on('finish', resolve);
        file.on('error', (error) => {
          logger.error(`Error durante la descarga: ${error}`);
          fs.unlinkSync(tempFilePath);
          reject(error);
        });
      });

      if (fs.existsSync(tempFilePath)) {
        const stats = fs.statSync(tempFilePath);
        if (stats.size > 0) {
          fs.renameSync(tempFilePath, filePath);
        } else {
          throw new Error(`El archivo descargado está vacío o corrupto: ${tempFilePath}`);
        }
      }

      return;
    } catch (error) {
      retries++;
      logger.error(`Error descargando imagen de ${url}. Intento (${retries}/${maxRetries}). Error: ${error}`);

      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      // Si se alcanza el límite de reintentos, se sale del proceso
      if (retries >= maxRetries) {
        logger.error(`No se pudo descargar la imagen de ${url} después de ${maxRetries} intentos. Continuando con las siguientes imágenes.`);
        return; // Continuar con las siguientes descargas
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
};

const checkImageExists = async (url: string): Promise<boolean> => {
  const protocol = url.startsWith('https') ? https : http;
  const options = {
    rejectUnauthorized: false, // Ignorar problemas de certificado SSL
    headers: {
      'Connection': 'close' // Cierra la conexión después de cada solicitud
    }
  };
  return new Promise((resolve) => {
    const request = protocol.get(url, options, (res) => {
      const imageExists = res.statusCode === 200;
      // logger.info(`Status Code: ${res.statusCode}, Status Message: ${res.statusMessage}`);
      resolve(imageExists);
    });
    request.on('error', (err) => {
      logger.error(`Error al verificar la URL: ${url} - Error: ${err.message}`);
      resolve(false);
    });
    request.setTimeout(90000, () => {  // Aumentar el tiempo de espera a 90 segundos
      logger.error(`La solicitud a la URL: ${url} ha superado el tiempo de espera y ha sido abortada.`);
      request.abort();
      resolve(false);
    });
  });
};



export { downloadImage, checkImageExists, imageCache, downloadQueue, MAX_CONCURRENT_DOWNLOADS };
