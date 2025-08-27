import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import { databaseConfig } from '../config/database.config';

// ===== CARGAR VARIABLES DE ENTORNO SEGÚN ENV =====
const env = process.env.NODE_ENV || 'local';
const envFiles: Record<string, string> = {
  local: '.env.local',
  staging: '.env.staging',
  production: '.env.production',
};
const envFile = envFiles[env] || '.env.local';
const envPath = path.join(__dirname, '..', 'config', 'environments', envFile);
config({ path: envPath });

// ===== DATASOURCE =====
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: databaseConfig.connection.host,
  port: databaseConfig.connection.port,
  username: databaseConfig.connection.username,
  password: databaseConfig.connection.password,
  database: databaseConfig.connection.database,
  charset: databaseConfig.connection.charset,

  entities: [
    'src/shared/models/entities/**/*.model.ts',
    'dist/shared/models/entities/**/*.model.js',
  ],

  migrations: [
    `${databaseConfig.migrations.directory}/**/*.ts`,
    `${databaseConfig.migrations.directory}/**/*.js`,
  ],

  // Sincronización activable solo desde .env y nunca en producción
  synchronize: env === 'local' ? process.env.TYPEORM_SYNC === 'true' : false,

  logging: databaseConfig.logging.enabled,
});

// ===== DEBUG =====
if (['local', 'staging'].includes(env)) {
  console.log('🔧 TypeORM DataSource loaded:');
  console.log(`   Environment: ${env}`);
  console.log(`   Database: ${databaseConfig.connection.host}:${databaseConfig.connection.port}/${databaseConfig.connection.database}`);
  console.log(`   Synchronize: ${AppDataSource.options.synchronize}`);
}

// ===== FUNCIONES DE INICIALIZACIÓN =====
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection initialized successfully');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    process.exit(1);
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('🔒 Database connection closed');
  }
};
