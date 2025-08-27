// src/app.module.ts - Módulo principal del sistema
import { Router } from 'express';
import { envConfig } from '@config/env.config';
import { logger } from '@core/utils/logger';

// Importar todos los módulos


// Módulos futuros (comentados hasta que se implementen)
// import { FileModule } from '@modules/file/file.module';
// import { NotificationModule } from '@modules/notification/notification.module';
// import { SocketModule } from '@modules/socket/socket.module';

// Tipos para el sistema de módulos
interface ModuleInterface {
  name: string;
  getRoutes(): Router;
  initialize?(): void;
  getInfo?(): any;
}

interface AppModuleConfig {
  modules: (new () => ModuleInterface)[];
  globalPrefix: string;
  enableLogging: boolean;
}

export class AppModule {
  private static instance: AppModule | null;
  private static config: AppModuleConfig | null;
  private static initializedModules: ModuleInterface[] = [];

  // ===== CONFIGURACIÓN DE MÓDULOS =====
  static modules: (new () => ModuleInterface)[] = [
    // Módulos básicos (siempre habilitados)

    
    // Módulos futuros (comentados hasta implementar)
    // FileModule,
    // NotificationModule, 
    // SocketModule,
  ];

  // ===== CONFIGURACIÓN PRINCIPAL =====
  static getConfig(): AppModuleConfig {
    if (!this.config) {
      this.config = {
        modules: this.modules,
        globalPrefix: 'api',
        enableLogging: envConfig.isDevelopment,
      };
    }
    return this.config;
  }

  // ===== INICIALIZACIÓN =====
  static initialize(): void {
    const config = this.getConfig();
    
    if (config.enableLogging) {
      logger.info('🔧 Initializing AppModule...');
      logger.info(`📦 Found ${config.modules.length} modules to initialize`);
    }

    // Limpiar módulos anteriores (útil para hot-reload en desarrollo)
    this.initializedModules = [];

    // Inicializar cada módulo
    config.modules.forEach((ModuleClass, index) => {
      try {
        const moduleInstance = new ModuleClass();
        
        // Ejecutar inicialización personalizada si existe
        if (moduleInstance.initialize) {
          moduleInstance.initialize();
        }
        
        // Agregar a la lista de módulos inicializados
        this.initializedModules.push(moduleInstance);
        
        if (config.enableLogging) {
          logger.info(`✅ [${index + 1}/${config.modules.length}] ${moduleInstance.name} initialized`);
        }
        
      } catch (error) {
        logger.error(`❌ Failed to initialize module at index ${index}:`, error);
        
        // En producción, fallar completamente si un módulo crítico no se inicializa
        if (envConfig.isProduction) {
          if (error instanceof Error) {
            throw new Error(`Critical module initialization failed: ${error.message}`);
          } else {
            throw new Error('Critical module initialization failed: Unknown error');
          }
        }
      }
    });

    if (config.enableLogging) {
      logger.info(`🎉 AppModule initialized successfully with ${this.initializedModules.length} modules`);
      
      // Log de información de módulos en desarrollo
      if (envConfig.isDevelopment) {
        this.logModulesInfo();
      }
    }
  }

  // ===== OBTENER RUTAS COMBINADAS =====
  static getRoutes(): Router {
    const router = Router();
    const config = this.getConfig();

    if (this.initializedModules.length === 0) {
      logger.warn('⚠️ No modules initialized. Call AppModule.initialize() first');
      return router;
    }

    // Combinar rutas de todos los módulos
    this.initializedModules.forEach((module) => {
      try {
        const moduleRoutes = module.getRoutes();
        
        if (moduleRoutes) {
          // Usar el nombre del módulo como prefijo (sin duplicar 'Module')
          const routePrefix = module.name.toLowerCase().replace('module', '');
          router.use(`/${routePrefix}`, moduleRoutes);
          
          if (config.enableLogging) {
            logger.debug(`🛣️  Mounted ${module.name} routes at /${config.globalPrefix}/${routePrefix}`);
          }
        }
      } catch (error) {
        logger.error(`❌ Failed to mount routes for ${module.name}:`, error);
        
        // En desarrollo, continuar con otros módulos
        if (!envConfig.isDevelopment) {
          throw error;
        }
      }
    });

    return router;
  }

  // ===== INFORMACIÓN DE MÓDULOS =====
  static getModulesInfo(): any[] {
    return this.initializedModules.map(module => ({
      name: module.name,
      routes: module.getRoutes() ? 'enabled' : 'disabled',
      info: module.getInfo ? module.getInfo() : 'no additional info',
    }));
  }

  // ===== OBTENER MÓDULO POR NOMBRE =====
  static getModule(name: string): ModuleInterface | undefined {
    return this.initializedModules.find(
      module => module.name.toLowerCase() === name.toLowerCase()
    );
  }

  // ===== VERIFICAR SI MÓDULO ESTÁ HABILITADO =====
  static isModuleEnabled(name: string): boolean {
    return this.getModule(name) !== undefined;
  }

  // ===== RECARGAR MÓDULOS (ÚTIL PARA DESARROLLO) =====
  static reload(): void {
    if (envConfig.isDevelopment) {
      logger.info('🔄 Reloading AppModule...');
      this.initialize();
    } else {
      logger.warn('⚠️ Module reload is only available in development mode');
    }
  }

  // ===== AGREGAR MÓDULO DINÁMICAMENTE =====
  static addModule(ModuleClass: new () => ModuleInterface): void {
    if (envConfig.isDevelopment) {
      try {
        const moduleInstance = new ModuleClass();
        
        if (moduleInstance.initialize) {
          moduleInstance.initialize();
        }
        
        this.initializedModules.push(moduleInstance);
        logger.info(`✅ Dynamically added module: ${moduleInstance.name}`);
      } catch (error) {
        logger.error(`❌ Failed to add module dynamically:`, error);
      }
    }
  }

  // ===== LOGGING PRIVADO =====
  private static logModulesInfo(): void {
    logger.info('📋 Modules Overview:');
    
    this.initializedModules.forEach((module, index) => {
      const routeInfo = module.getRoutes() ? '✅ Routes enabled' : '❌ No routes';
      const extraInfo = module.getInfo ? module.getInfo() : {};
      
      logger.info(`   ${index + 1}. ${module.name}`);
      logger.info(`      ${routeInfo}`);
      
      if (Object.keys(extraInfo).length > 0) {
        logger.info(`      Extra info:`, extraInfo);
      }
    });
  }

  // ===== HEALTH CHECK DE MÓDULOS =====
  static getHealthCheck(): any {
    return {
      name: 'AppModule',
      status: 'healthy',
      modules: {
        total: this.initializedModules.length,
        expected: this.modules.length,
        list: this.initializedModules.map(m => ({
          name: m.name,
          status: 'active',
          hasRoutes: !!m.getRoutes(),
        })),
      },
      lastInitialized: new Date().toISOString(),
      environment: envConfig.nodeEnv,
    };
  }

  // ===== SINGLETON PATTERN =====
  static getInstance(): AppModule {
    if (!this.instance) {
      this.instance = new AppModule();
    }
    return this.instance;
  }

  // ===== CLEANUP (PARA TESTING O SHUTDOWN) =====
  static cleanup(): void {
    logger.info('🧹 Cleaning up AppModule...');
    this.initializedModules = [];
    this.instance = null;
    this.config = null;
    logger.info('✅ AppModule cleanup completed');
  }
}

// ===== TIPOS EXPORTADOS =====
export { ModuleInterface };

// ===== AUTO-INICIALIZACIÓN EN DESARROLLO =====
if (envConfig.isDevelopment && require.main !== module) {
  // Solo para debugging, el main.ts debe llamar initialize() explícitamente
  logger.debug('🔧 AppModule loaded in development mode');
}