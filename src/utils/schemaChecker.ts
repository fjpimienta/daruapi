import fs from 'fs';
import path from 'path';
import logger from './logger';

export function checkGraphQLFiles() {
  const schemaDir = path.join(__dirname, '../schema');
  
  // Verificar que el directorio existe
  if (!fs.existsSync(schemaDir)) {
    logger.error(`El directorio de schema no existe: ${schemaDir}`);
    return;
  }
  
  // Listar archivos recursivamente
  function listFilesRecursively(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        fileList = listFilesRecursively(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }
  
  const files = listFilesRecursively(schemaDir);
  logger.info(`Archivos encontrados en el directorio schema:`);
  
  // Buscar archivos .graphql y verificar si contienen type Query
  let hasQueryType = false;
  
  files.forEach(file => {
    const relativePath = path.relative(__dirname, file);
    if (file.endsWith('.graphql')) {
      const content = fs.readFileSync(file, 'utf8');
      // logger.info(`- [GraphQL] ${relativePath}`);
      
      if (content.includes('type Query')) {
        hasQueryType = true;
        // logger.info(`  * Contiene definición de 'type Query'`);
      }
    } else if (file.endsWith('.resolver.ts') || file.endsWith('.resolver.js')) {
      logger.info(`- [Resolver] ${relativePath}`);
    }
  });
  
  if (!hasQueryType) {
    logger.warn('¡ATENCIÓN! No se encontró ninguna definición de "type Query" en los archivos .graphql');
    logger.warn('Esto puede causar el error: "Query" defined in resolvers, but not in schema');
  }
}
