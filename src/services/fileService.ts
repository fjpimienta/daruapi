import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const fileService = express.Router();

const appDir = __dirname;

fileService.get('/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(appDir, '..', '..', 'uploads', 'files', filename);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
});

// Función para cargar y normalizar el JSON en un array de objetos con clave y valor
export const loadAndNormalizeJson = (jsonData: any) => {
  function capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  function capitalizeWords(str: string) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }
  const normalizedData = jsonData.map((item: any) => {
    return {
      tipo: capitalizeWords(item.attributeName),
      valor: capitalizeFirstLetter(item.attributeValue)
    };
  });
  return normalizedData;
};

export default fileService;
