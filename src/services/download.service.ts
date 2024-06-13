import http from 'http';
import https from 'https';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const downloadImage = (url: string, destFolder: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileName = `${uuidv4()}${path.extname(url)}`;
    const filePath = path.join(destFolder, fileName);

    const file = fs.createWriteStream(filePath);

    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {
          let errorMessage;
          if (response.statusCode === 404) {
            errorMessage = `Image not found: ${url} (404)`;
          } else {
            errorMessage = `Failed to get '${url}' (${response.statusCode})`;
          }
          return reject(errorMessage);
        });
      } else {
        response.pipe(file);

        file.on('finish', () => {
          file.close(() => resolve(fileName));
        });
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err.message));
    });
  });
};

export default downloadImage;
