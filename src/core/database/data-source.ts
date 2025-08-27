import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Cargar variables de entorno para CLI
const env = process.env.NODE_ENV || 'development';
const envFiles = {
  'local': '.env.local',
  'development': '.env.development', 
  'staging': '.env.staging',
  'production': '.env.production'
};

const envFile = envFiles[env as keyof typeof envFiles] || '.env.local';
const envPath = path.join(__dirname, '..', 'config', 'environments', envFile);
config({ path: envPath });

// Importar todas las entidades
/* import { User } from './entities/user.entity';
import { Session } from './entities/session.entity'; */

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'api_user',
  password: process.env.DB_PASSWORD || 'api_password',
  database: process.env.DB_NAME || 'api_main_db',
  charset: 'utf8mb4',
  
  // Configuración según entorno
  synchronize: false, // Siempre false, usar migraciones
  logging: env === 'development' || env === 'local' ? ['query', 'error'] : ['error'],
  
  // Entidades registradas
  entities: [
    // User, Session // 🔥 Cuando las crees
    // Por ahora rutas dinámicas:
    'src/core/database/entities/**/*.ts',
    'dist/core/database/entities/**/*.js'
  ],
  
  // Migraciones
  migrations: [
    'src/core/database/migrations/**/*.ts',
    'dist/core/database/migrations/**/*.js'
  ],
  
  // Configuraciones específicas para MySQL
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    timezone: '+00:00',
  },
});

// Log para debugging
if (env === 'development' || env === 'local') {
  console.log('🔧 TypeORM DataSource loaded:');
  console.log(`   Environment: ${env}`);
  console.log(`   Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
}

// Función para inicializar la conexión
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection initialized successfully');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    process.exit(1);
  }
};

// Función para cerrar la conexión
export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('🔒 Database connection closed');
  }
};