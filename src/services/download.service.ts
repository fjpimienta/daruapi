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

const downloadImage = async (url: string, destFolder: string, filename: string, maxRetries = 1, retryDelay = 5000): Promise<void> => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
      }

      const filePath = path.join(destFolder, filename);
      const tempFilePath = path.join(destFolder, `${uuidv4()}.tmp`);
      const protocol = url.startsWith('https') ? https : http;

      const response = await new Promise<IncomingMessage>((resolve, reject) => {
        const request = protocol.get(url, (res) => {
          resolve(res);
        });

        request.on('error', (err) => {
          reject(err);
        });

        request.setTimeout(30000, () => {
          // logger.error(`Request timed out after 30 seconds: ${url}`);
          request.abort();
        });
      });

      if (response.statusCode !== 200) {
        // throw new Error(`Failed to get '${url}' (${response.statusCode})`);
      }

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.startsWith('image')) {
        throw new Error(`Invalid content type '${contentType}' for URL: ${url}`);
      }

      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tempFilePath);
        response.pipe(file);
        file.on('finish', resolve);
        file.on('error', (err) => {
          reject(err);
        });
      });

      // Optimize the image using sharp
      try {
        await sharp(tempFilePath)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(filePath);
      } catch (sharpError) {
        throw new Error(`Error processing image with sharp: ${sharpError}`);
      } finally {
        fs.unlinkSync(tempFilePath);  // Ensure the temp file is deleted
      }

      // logger.info(`Image saved to: ${filePath}`);
      return;
    } catch (error) {
      retries++;
      // logger.error(`Error downloading image from ${url}. Retrying (${retries}/${maxRetries})...`);
      logger.error(error);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  // logger.error(`Maximum number of retries reached for ${url}`);
};

const checkImageExists = async (url: string): Promise<boolean> => {
  const protocol = url.startsWith('https') ? https : http;
  return new Promise((resolve) => {
    (protocol.get(url, (res) => {
      resolve(res.statusCode === 200);
    }) as ClientRequest).on('error', () => {
      resolve(false);
    });
  });
};

export { downloadImage, checkImageExists, imageCache, downloadQueue, MAX_CONCURRENT_DOWNLOADS };
