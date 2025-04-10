import path from 'path';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import 'graphql-import-node';
import logger from '../utils/logger';
import fs from 'fs';
import { baseTypes, baseResolvers } from './fixed-types';

// Obtener ruta absoluta al directorio del schema
const SCHEMA_DIR = path.resolve(__dirname);
logger.info(`Directorio de schema: ${SCHEMA_DIR}`);

// Intentar cargar los archivos GraphQL
let typesArray = [baseTypes]; // Siempre incluir los tipos base
try {
  // Usar ruta absoluta para cargar archivos
  const loadedTypes = loadFilesSync(path.join(SCHEMA_DIR, './**/*.graphql'));
  logger.info(`Se cargaron ${loadedTypes.length} archivos GraphQL`);
  
  if (loadedTypes.length > 0) {
    typesArray = [...typesArray, ...loadedTypes];
    
    // // Mostrar los archivos cargados para depuración
    // loadedTypes.forEach(file => {
    //   if (typeof file === 'object' && file.loc) {
    //     logger.info(`Archivo GraphQL cargado: ${file.loc.source.name}`);
    //   }
    // });
  }
} catch (error) {
  logger.error(`Error al cargar archivos GraphQL: ${error instanceof Error ? error.message : String(error)}`);
}

// Verificar si hay archivos .graphql en el directorio para depuración
try {
  const filesList = fs.readdirSync(SCHEMA_DIR);
  const graphqlFiles = filesList.filter(file => file.endsWith('.graphql'));
  logger.info(`Archivos .graphql encontrados en directorio: ${graphqlFiles.join(', ') || 'Ninguno'}`);
} catch (error) {
  logger.error(`Error al leer directorio schema: ${error instanceof Error ? error.message : String(error)}`);
}

// Cargar resolvers - siempre incluir los resolvers base
let allResolvers = [baseResolvers];
try {
  // Usar ruta absoluta para cargar archivos
  const loadedResolvers = loadFilesSync(path.join(SCHEMA_DIR, './**/*.resolver.{js,ts}'));
  logger.info(`Se cargaron ${loadedResolvers.length} archivos resolver`);
  
  if (loadedResolvers.length > 0) {
    allResolvers = [...allResolvers, ...loadedResolvers];
  }
} catch (error) {
  logger.error(`Error al cargar resolvers: ${error instanceof Error ? error.message : String(error)}`);
}

// Mostrar cómo se ve typesArray para depuración
logger.info(`typesArray length: ${typesArray.length}`);
logger.info(`allResolvers length: ${allResolvers.length}`);

// Merge typeDefs y resolvers
const typeDefs = mergeTypeDefs(typesArray);
const resolvers = mergeResolvers(allResolvers);

// Verificar que Query está definido en typeDefs
const typeDefsStr = typeof typeDefs === 'string' ? typeDefs : (typeDefs as any).loc?.source?.body || '';
if (typeDefsStr.includes('type Query')) {
  logger.info('✅ El tipo Query está definido correctamente en el schema');
} else {
  logger.warn('❌ ADVERTENCIA! El tipo Query NO está definido en el schema a pesar de los tipos base.');
}

// Verificar que Query está definido en resolvers
if (resolvers && resolvers.Query) {
  logger.info('✅ Query está definido en los resolvers');
} else {
  logger.warn('❌ ADVERTENCIA! Query no está definido en los resolvers');
}

// Crear el schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

export default schema;