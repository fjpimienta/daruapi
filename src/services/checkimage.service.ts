import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

const checkImageExists = async (url: string): Promise<boolean> => {
  const parsedUrl = new URL(url);
  const protocol = parsedUrl.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const request = protocol.request(url, (response) => {
      // La imagen existe si el código de estado es 200
      if (response.statusCode === 200) {
        resolve(true);
      } else if (response.statusCode === 404) {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    request.on('error', (err) => {
      reject(`Request error: ${err.message}`);
    });

    request.end();
  });
};

export default checkImageExists;
