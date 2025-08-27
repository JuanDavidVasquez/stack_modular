import { envConfig } from './env.config';

export interface DatabaseConfig {
  // Configuración básica
  connection: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    charset: string;
  };
  
  // Pool de conexiones
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  
  // Configuración de logging
  logging: {
    enabled: boolean;
    level: 'query' | 'error' | 'schema' | 'warn' | 'info' | 'log';
    logQueries: boolean;
    logOnlyFailedQueries: boolean;
    maxQueryExecutionTime: number;
  };
  
  // Migraciones
  migrations: {
    autoRun: boolean;
    tableName: string;
    directory: string;
  };
  
  // Cache
  cache: {
    enabled: boolean;
    duration: number;
    type: 'simple-json' | 'redis' | 'ioredis';
  };
}

export const databaseConfig: DatabaseConfig = {
  // ===== CONFIGURACIÓN BÁSICA =====
  connection: {
    host: envConfig.database.host,
    port: envConfig.database.port,
    username: envConfig.database.username,
    password: envConfig.database.password,
    database: envConfig.database.database,
    charset: 'utf8mb4',
  },

  // ===== POOL DE CONEXIONES =====
  pool: {
    min: envConfig.isDevelopment ? 2 : 5,
    max: envConfig.isDevelopment ? 10 : 20,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 600000, // 10 minutos
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },

  // ===== LOGGING =====
  logging: {
    enabled: envConfig.isDevelopment,
    level: envConfig.isDevelopment ? 'query' : 'error',
    logQueries: envConfig.isDevelopment,
    logOnlyFailedQueries: envConfig.isProduction,
    maxQueryExecutionTime: envConfig.isDevelopment ? 0 : 1000, // 1 segundo en prod
  },

  // ===== MIGRACIONES =====
  migrations: {
    autoRun: false, // Siempre manual
    tableName: 'typeorm_migrations',
    directory: 'src/core/database/migrations',
  },

  // ===== CACHE =====
  cache: {
    enabled: false, // Por ahora sin cache
    duration: 30000, // 30 segundos
    type: 'simple-json',
  },
};

// ===== CONFIGURACIONES ESPECÍFICAS POR ENTORNO =====

export const getDatabaseConfigByEnvironment = () => {
  const baseConfig = { ...databaseConfig };

  switch (envConfig.nodeEnv) {
    case 'local':
    case 'development':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          enabled: true,
          logQueries: true,
          level: 'query' as const,
        },
        pool: {
          ...baseConfig.pool,
          min: 1,
          max: 5,
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          enabled: true,
          logQueries: false,
          level: 'warn' as const,
          logOnlyFailedQueries: true,
        },
        pool: {
          ...baseConfig.pool,
          min: 3,
          max: 15,
        },
      };

    case 'production':
      return {
        ...baseConfig,
        logging: {
          ...baseConfig.logging,
          enabled: true,
          logQueries: false,
          level: 'error' as const,
          logOnlyFailedQueries: true,
        },
        pool: {
          ...baseConfig.pool,
          min: 5,
          max: 25,
        },
        cache: {
          ...baseConfig.cache,
          enabled: true, // Habilitar cache en producción
        },
      };

    default:
      return baseConfig;
  }
};

// ===== UTILIDADES =====

export const getConnectionString = (): string => {
  const { connection } = databaseConfig;
  return `mysql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}?charset=${connection.charset}`;
};

export const validateDatabaseConfig = (): boolean => {
  const { connection } = databaseConfig;
  
  const requiredFields = ['host', 'port', 'username', 'password', 'database'];
  const missingFields = requiredFields.filter(field => !(connection as Record<string, any>)[field]);
  
  if (missingFields.length > 0) {
    console.error(`❌ Missing database configuration fields: ${missingFields.join(', ')}`);
    return false;
  }
  
  console.log('✅ Database configuration validated successfully');
  return true;
};

// ===== HEALTH CHECK =====

export const getDatabaseHealthCheck = () => {
  return {
    name: 'MySQL Database',
    status: 'unknown',
    connection: `${databaseConfig.connection.host}:${databaseConfig.connection.port}`,
    database: databaseConfig.connection.database,
    environment: envConfig.nodeEnv,
    pool: {
      min: databaseConfig.pool.min,
      max: databaseConfig.pool.max,
    },
  };
};