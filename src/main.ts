import 'reflect-metadata';
import express, { Application } from 'express';
import { envConfig } from './core/config/env.config';
import { AppDataSource, initializeDatabase, closeDatabase } from './core/database/data-source';
import { AppModule } from './app.module';
import { createApp } from './app';
import { errorMiddleware } from './core/middleware/error.middleware';

let server: any = null;

async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 Starting API Main...');
    console.log(`🔧 Environment: ${envConfig.nodeEnv}`);
    console.log(`🔧 Port: ${envConfig.port}`);

    // ===== VALIDACIÓN DE ENTORNO =====
    if (!envConfig.validate()) {
      console.error('❌ Invalid environment configuration');
      process.exit(1);
    }

    // ===== INICIALIZAR BASE DE DATOS =====
    console.log('📦 Connecting to database...');
    console.log(`   Host: ${envConfig.database.host}:${envConfig.database.port}`);
    console.log(`   Database: ${envConfig.database.database}`);
    await initializeDatabase();
    console.log('✅ Database connected successfully');

    // ===== INICIALIZAR MÓDULOS =====
    console.log('📦 Initializing application modules...');
    AppModule.initialize();
    console.log('✅ Application modules initialized');

    // ===== CREAR APP EXPRESS =====
    console.log('📦 Setting up Express application...');
    const app: Application = createApp();

    // ===== CONFIGURAR RUTAS DE MÓDULOS =====
  console.log('📦 Setting up module routes...');
    console.log('🔎 Listing all registered routes:');
    app.use(AppModule.getRoutes());
    console.log('✅ Module routes configured');


    // ===== 404 HANDLER (después de las rutas) =====
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // ===== ERROR HANDLER (último SIEMPRE) =====
    app.use(errorMiddleware);

    // ===== INICIAR SERVIDOR HTTP =====
    server = app.listen(envConfig.port, () => logServerInfo());

    console.log('✅ Module routes configured');

    // ===== HEALTHCHECK / INFO API =====
    app.get('/', (req, res) => {
      res.json({
        message: 'API Main is running',
        version: '1.0.0',
        environment: envConfig.nodeEnv,
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          users: '/api/users',
        }
      });
    });


    server.timeout = 30000; // 30 segundos

    // ===== EVENT LISTENERS / GRACEFUL SHUTDOWN =====
    setupProcessListeners();

  } catch (error) {
    console.error('❌ Failed to start API Main:', error);
    await cleanup();
    process.exit(1);
  }
}

// ===== LOG SERVER INFO =====
function logServerInfo(): void {
  console.log('');
  console.log('🎉 API Main started successfully!');
  console.log(`📍 URL: http://localhost:${envConfig.port}`);
  console.log(`🗄️  DB: ${envConfig.database.host}:${envConfig.database.port}/${envConfig.database.database}`);
  console.log(`🔧 Environment: ${envConfig.nodeEnv}`);
  if (envConfig.isDevelopment) {
    console.log('🔧 Development Tools:');
    console.log(`   📊 phpMyAdmin: http://localhost:8080`);
    console.log(`   📝 Logs: ./logs/app.log`);
  }
}

// ===== GRACEFUL SHUTDOWN =====
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error: any) => {
          if (error) return reject(error);
          console.log('🔒 HTTP server closed');
          resolve();
        });
      });
    }
    await closeDatabase();
    await cleanup();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// ===== SETUP PROCESS LISTENERS =====
function setupProcessListeners(): void {
  ['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => gracefulShutdown(signal));
  });

  process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
    console.error('❌ Unhandled Rejection at:', promise, 'Reason:', reason);
    if (envConfig.isProduction) await gracefulShutdown('unhandledRejection');
  });

  process.on('uncaughtException', async (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    if (envConfig.isProduction) await gracefulShutdown('uncaughtException');
  });

  process.on('SIGUSR2', () => {
    console.log('💓 Health check signal received - API is healthy');
  });
}

// ===== CLEANUP FUNCTION =====
async function cleanup(): Promise<void> {
  try {
    // Cerrar conexiones adicionales si existen (Redis, cache, etc.)
    console.log('🧹 Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// ===== START APP =====
if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('💥 Fatal error during bootstrap:', error);
    process.exit(1);
  });
}

export { bootstrap };
