// fileService.ts

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs'; // Agregamos la importación de fs

const fileService = express.Router();

// Utiliza __dirname para obtener la ruta del directorio actual
const appDir = __dirname;

fileService.get('/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  // Utiliza la ruta del directorio actual (__dirname) para construir el filePath
  const filePath = path.join(appDir, '..', '..', 'uploads', 'files', filename);
  // Verifica si el archivo existe antes de enviarlo
  if (fs.existsSync(filePath)) {
    // Puedes agregar lógica adicional aquí, como verificar si el archivo existe
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
});

export default fileService;
