import 'reflect-metadata';
import { envConfig } from './core/config/env.config';
import { AppDataSource, initializeDatabase, closeDatabase } from './core/database/data-source';
import { AppModule } from './app.module';
import { createApp } from './app';
import express, { Application } from 'express';

async function bootstrap(): Promise<void> {
  let server: any = null;

  try {
    console.log('🚀 Starting API Main...');
    console.log(`🔧 Environment: ${envConfig.nodeEnv}`);
    console.log(`🔧 Port: ${envConfig.port}`);
    
    // 1. Validar configuración de entorno
    if (!envConfig.validate()) {
      console.error('❌ Invalid environment configuration');
      process.exit(1);
    }
    
    // 2. Inicializar base de datos
    console.log('📦 Connecting to database...');
    console.log(`   Host: ${envConfig.database.host}:${envConfig.database.port}`);
    console.log(`   Database: ${envConfig.database.database}`);
    
    await initializeDatabase();
    console.log('✅ Database connected successfully');
    
    // 3. Inicializar módulos de la aplicación
    console.log('📦 Initializing application modules...');
    AppModule.initialize(); // 🔥 AQUÍ se inicializa AppModule
    console.log(`✅ Application modules initialized`);
    
    // 4. Crear aplicación Express (middlewares, configuración)
    console.log('📦 Setting up Express application...');
    const app: Application = createApp();
    
    // 5. Configurar rutas de los módulos (DESPUÉS de crear la app)
    console.log('📦 Setting up module routes...');
    const moduleRoutes = AppModule.getRoutes();
    app.use('/', moduleRoutes); // Las rutas ya vienen con prefijo /api
    console.log('✅ Module routes configured');
    
    // 6. Ruta de salud básica
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
    
    // 7. Iniciar servidor HTTP
    server = app.listen(envConfig.port, () => {
      console.log('');
      console.log('🎉 API Main started successfully!');
      console.log('📍 Server Details:');
      console.log(`   🌐 URL: http://localhost:${envConfig.port}`);
      console.log(`   🗄️  Database: ${envConfig.database.host}:${envConfig.database.port}/${envConfig.database.database}`);
      console.log(`   🔧 Environment: ${envConfig.nodeEnv}`);
      console.log('');
      console.log('📋 Available Endpoints:');
      console.log('   GET  /                    - API Info');
      console.log('   GET  /api/health          - Health Check');
      console.log('   POST /api/auth/login      - User Login');
      console.log('   POST /api/auth/register   - User Registration');
      console.log('   GET  /api/users/profile   - User Profile');
      console.log('');
      
      // Información adicional para desarrollo
      if (envConfig.isDevelopment) {
        console.log('🔧 Development Tools:');
        console.log(`   📊 phpMyAdmin: http://localhost:8080`);
        console.log(`   📝 Logs: ./logs/app.log`);
        console.log('');
      }
    });

    // 8. Configurar timeout del servidor
    server.timeout = 30000; // 30 segundos
    
  } catch (error) {
    console.error('❌ Failed to start API Main:');
    console.error(error);
    await cleanup();
    process.exit(1);
  }

  // ===== GRACEFUL SHUTDOWN =====
  
  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`\n🔄 Received ${signal}, starting graceful shutdown...`);
    
    try {
      // 1. Dejar de aceptar nuevas conexiones
      if (server) {
        await new Promise<void>((resolve, reject) => {
          server.close((error: any) => {
            if (error) {
              console.error('❌ Error closing HTTP server:', error);
              reject(error);
            } else {
              console.log('🔒 HTTP server closed');
              resolve();
            }
          });
        });
      }
      
      // 2. Cerrar conexión a la base de datos
      await closeDatabase();
      
      // 3. Otros cleanups si es necesario
      await cleanup();
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  // ===== EVENT LISTENERS =====
  
  // Señales de terminación
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Errores no manejados
  process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
    console.error('❌ Unhandled Promise Rejection at:', promise);
    console.error('❌ Reason:', reason);
    
    // En producción, hacer graceful shutdown
    if (envConfig.isProduction) {
      await gracefulShutdown('unhandledRejection');
    } else {
      // En desarrollo, solo logear
      console.error('⚠️  Continuing in development mode...');
    }
  });

  process.on('uncaughtException', async (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    
    // En producción, shutdown inmediato
    if (envConfig.isProduction) {
      await gracefulShutdown('uncaughtException');
    } else {
      // En desarrollo, continuar
      console.error('⚠️  Continuing in development mode...');
    }
  });
}

// ===== CLEANUP FUNCTION =====
async function cleanup(): Promise<void> {
  try {
    // Cerrar conexiones adicionales si las hay
    // Por ejemplo: Redis, caches, etc.
    
    console.log('🧹 Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// ===== HEALTH CHECK PARA CONTENEDORES =====
process.on('SIGUSR2', () => {
  console.log('💓 Health check signal received - API is healthy');
});

// ===== INICIAR APLICACIÓN =====
if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('💥 Fatal error during bootstrap:', error);
    process.exit(1);
  });
}

export { bootstrap };