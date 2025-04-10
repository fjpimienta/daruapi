import { MongoClient, Db, MongoClientOptions } from 'mongodb';
import chalk from 'chalk';
import logger from '../utils/logger';

class Database {
  private static instance: Database;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting: boolean = false;
  private connectionAttempts: number = 0;
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly RETRY_INTERVAL = 5000; // 5 segundos

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async init(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    if (this.isConnecting) {
      // Esperar a que la conexión actual termine
      return this.waitForConnection();
    }

    this.isConnecting = true;

    try {
      const mongoUri = this.getMongoUri();
      const options = this.getConnectionOptions();

      logger.info('Intentando conectar a MongoDB...');
      this.client = await MongoClient.connect(mongoUri, options);
      this.db = this.client.db();
      this.connectionAttempts = 0;
      this.isConnecting = false;

      // Configurar listeners para manejar eventos de conexión
      this.setupConnectionListeners();

      const timestamp = new Date().toISOString();
      logger.info('=================== DATABASE ===================');
      logger.info(`STATUS: ${chalk.greenBright('ONLINE')}`);
      logger.info(`DATABASE: ${chalk.greenBright(this.db.databaseName)}`);
      logger.info(`TIMESTAMP: ${chalk.blueBright(timestamp)}`);
      
      return this.db;
    } catch (error) {
      this.isConnecting = false;
      logger.error(`Error al conectar con la base de datos: ${error instanceof Error ? error.message : String(error)}`);
      
      if (this.connectionAttempts < this.MAX_RETRY_ATTEMPTS) {
        this.connectionAttempts++;
        logger.info(`Reintentando conexión (${this.connectionAttempts}/${this.MAX_RETRY_ATTEMPTS}) en ${this.RETRY_INTERVAL / 1000} segundos...`);
        
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              const db = await this.init();
              resolve(db);
            } catch (retryError) {
              reject(retryError);
            }
          }, this.RETRY_INTERVAL);
        });
      }
      
      throw new Error(`No se pudo conectar a la base de datos después de ${this.MAX_RETRY_ATTEMPTS} intentos.`);
    }
  }

  private waitForConnection(): Promise<Db> {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (!this.isConnecting && this.db) {
          resolve(this.db);
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  private getMongoUri(): string {
    const mongoUri = process.env.DATABASE || 'mongodb://localhost:27017/darushop';
    
    if (!process.env.DATABASE) {
      logger.warn(`process.env.DATABASE is undefined, using default connection: ${mongoUri}`);
    }
    
    // Ocultar credenciales en logs si existen
    const sanitizedUri = mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
    logger.info(`Conectando a MongoDB: ${sanitizedUri}`);
    
    return mongoUri;
  }

  private getConnectionOptions(): MongoClientOptions {
    return {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true,
      compressors: ['snappy', 'zlib'],
      w: 'majority', // Para garantizar escrituras durables
      ssl: this.isSslRequired(),
      tls: this.isSslRequired(),
      tlsAllowInvalidCertificates: process.env.PRODUCTION !== 'true', // Solo permitir en desarrollo
    };
  }

  private isSslRequired(): boolean {
    // Determinar si estamos usando una conexión Atlas o si estamos en producción
    const uri = process.env.DATABASE || '';
    return uri.includes('mongodb+srv://') || process.env.PRODUCTION === 'true';
  }

  private setupConnectionListeners(): void {
    if (!this.client) return;
    
    // Monitorear eventos de la conexión
    this.client.on('serverHeartbeatFailed', (event) => {
      logger.warn('MongoDB heartbeat falló. Posibles problemas de conectividad.');
    });

    this.client.on('serverHeartbeatSucceeded', () => {
      // Reducir logs, solo cuando el servidor se reconecta después de un fallo
      if (this.connectionAttempts > 0) {
        logger.info('MongoDB heartbeat restablecido. Conexión estable.');
        this.connectionAttempts = 0;
      }
    });

    this.client.on('connectionClosed', (event) => {
      logger.warn(`MongoDB conexión cerrada: ${event.reason}`);
    });

    this.client.on('topologyOpening', () => {
      logger.info('MongoDB intentando re-establecer la conexión...');
    });
  }

  // Método para cerrar la conexión (útil para pruebas y cierre limpio)
  public async close(): Promise<void> {
    if (this.client) {
      logger.info('Cerrando conexión a MongoDB...');
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.info('Conexión a MongoDB cerrada correctamente.');
    }
  }

  // Verificar si la conexión está activa
  public isConnected(): boolean {
    return !!this.client && !!this.db;
  }

  // Método para obtener estadísticas de conexión (útil para monitoreo)
  public async getConnectionStats(): Promise<object> {
    if (!this.client || !this.db) {
      return { status: 'Desconectado' };
    }
    
    try {
      const status = await this.db.command({ serverStatus: 1 });
      return {
        status: 'Conectado',
        connections: status.connections,
        uptime: status.uptime,
        dbName: this.db.databaseName
      };
    } catch (error) {
      return { 
        status: 'Error', 
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Exportar singleton
export default Database.getInstance();