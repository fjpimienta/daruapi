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

// Función para cargar y normalizar el JSON
export const loadAndNormalizeJson = (jsonData: any) => { // Cambia el parámetro para aceptar datos JSON
  const normalizedData: Record<string, Record<string, string[]>> = {};
  jsonData.forEach((item: any) => {
    const attributeName = item.attributeName.toLowerCase();
    const attributeValue = item.attributeValue.toLowerCase();
    if (!normalizedData[attributeName]) {
      normalizedData[attributeName] = {};
    }
    if (!normalizedData[attributeName][attributeValue]) {
      normalizedData[attributeName][attributeValue] = [];
    }
    normalizedData[attributeName][attributeValue].push(item.attributeDisplay);
  });
  return normalizedData;
};

export default fileService;
