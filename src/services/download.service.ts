import http from 'http';
import https from 'https';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

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

        // Manejar el evento 'finish' para cerrar el archivo
        file.on('finish', () => {
          file.close(() => resolve(fileName));  // Cierra el archivo y resuelve la promesa
        });

        // Manejar cualquier error que ocurra durante la escritura del archivo
        file.on('error', (err) => {
          fs.unlink(filePath, () => reject(err.message));
        });

        // Manejar errores en el flujo de respuesta
        response.on('error', (err) => {
          fs.unlink(filePath, () => reject(err.message));
        });
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => reject(err.message));
    });
  });
};

export default downloadImage;
