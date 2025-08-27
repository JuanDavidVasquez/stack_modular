import { config } from 'dotenv';
import path from 'path';

export class EnvConfig {
  private static instance: EnvConfig;
  
  private constructor() {
    this.loadEnvFile();
  }

  static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  private loadEnvFile(): void {
    const env = process.env.NODE_ENV || 'local';
    
    // Mapeo de entornos a archivos
    const envFiles: Record<string, string> = {
      'local': '.env.local',
      'development': '.env.development', 
      'staging': '.env.staging',
      'production': '.env.production'
    };

    const envFile = envFiles[env] || '.env.local';
    const envPath = path.join(__dirname, 'environments', envFile);

    console.log(`🔧 Loading environment: ${env} (${envFile})`);
    
    const result = config({ path: envPath });
    
    if (result.error) {
      console.warn(`⚠️  Could not load ${envFile}, falling back to process.env`);
      // Intentar cargar .env por defecto
      config();
    }
  }

  // ===== CONFIGURACIÓN BÁSICA =====
  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'local';
  }

  get isDevelopment(): boolean {
    return ['local', 'development'].includes(this.nodeEnv);
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isStaging(): boolean {
    return this.nodeEnv === 'staging';
  }

  // ===== BASE DE DATOS (MYSQL) =====
  get database() {
    return {
      type: 'mysql' as const,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'api_user',
      password: process.env.DB_PASSWORD || 'api_password',
      database: process.env.DB_NAME || 'api_main_db',
    };
  }

  // ===== JWT CONFIGURATION =====
  get jwt() {
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET not set, using default (not recommended for production)');
    }
    
    return {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    };
  }

  // ===== MICROSERVICIOS (PARA FUTURO) =====
  get microservices() {
    return {
      notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001',
      fileUpload: process.env.FILE_UPLOAD_SERVICE_URL || 'http://localhost:3002',
      socket: process.env.SOCKET_SERVICE_URL || 'http://localhost:3003',
    };
  }

  // ===== CORS CONFIGURATION =====
  get cors() {
    return {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: process.env.CORS_CREDENTIALS === 'true' || true,
    };
  }

  // ===== RATE LIMITING =====
  get rateLimit() {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests por ventana
      message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP',
    };
  }

  // ===== LOGGING =====
  get logging() {
    return {
      level: process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info'),
      format: process.env.LOG_FORMAT || 'combined',
      directory: process.env.LOG_DIRECTORY || 'logs',
    };
  }

  // ===== VALIDACIÓN DE CONFIGURACIÓN =====
  validate(): boolean {
    const errors: string[] = [];

    // Validar configuración crítica
    if (!process.env.DB_HOST) errors.push('DB_HOST is required');
    if (!process.env.DB_USERNAME) errors.push('DB_USERNAME is required');
    if (!process.env.DB_PASSWORD) errors.push('DB_PASSWORD is required');
    if (!process.env.DB_NAME) errors.push('DB_NAME is required');

    // Warnings para producción
    if (this.isProduction) {
      if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
        errors.push('JWT_SECRET must be changed in production');
      }
      if (!process.env.CORS_ORIGIN) {
        console.warn('⚠️  CORS_ORIGIN not set in production');
      }
    }

    if (errors.length > 0) {
      console.error('❌ Environment configuration errors:');
      errors.forEach(error => console.error(`   - ${error}`));
      return false;
    }

    console.log('✅ Environment configuration validated successfully');
    return true;
  }

  // ===== INFO PARA DEBUGGING =====
  getInfo() {
    return {
      nodeEnv: this.nodeEnv,
      port: this.port,
      database: {
        host: this.database.host,
        port: this.database.port,
        database: this.database.database,
        // No exponer password
      },
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      isStaging: this.isStaging,
    };
  }
}

// Export singleton instance
export const envConfig = EnvConfig.getInstance();

// Auto-validar en desarrollo
if (envConfig.isDevelopment) {
  envConfig.validate();
}