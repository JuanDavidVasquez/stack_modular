import { Router } from 'express';
import { envConfig } from '@config/env.config';
import { logger } from '@core/utils/logger';
import { ModuleInterface } from './shared/interfaces/module.interface';
import { UserModule } from '@modules/user/user.module';

export class AppModule {
  // ----- Módulos predefinidos -----
  private static modules: (new () => ModuleInterface)[] = [
    UserModule,
    // otros módulos
  ];

  private static initializedModules: ModuleInterface[] = [];

  // ===== INICIALIZACIÓN =====
  static initialize(): void {
    if (!this.modules.length) {
      logger.warn('⚠️ No modules registered');
      return;
    }

    this.initializedModules = this.modules.map((ModuleClass) => {
      const moduleInstance = new ModuleClass();
      if (moduleInstance.initialize) {
        moduleInstance.initialize();
      }
      logger.info(`✅ ${moduleInstance.name} initialized`);
      return moduleInstance;
    });
  }

  // ===== OBTENER RUTAS =====
  static getRoutes(globalPrefix = 'api'): Router {
    const router = Router();
    this.initializedModules.forEach((module) => {
      const routes = module.getRoutes();
      if (routes) {
        const routePrefix = module.name.toLowerCase().replace('module', '');
        router.use(`/${globalPrefix}/${routePrefix}`, routes);
        logger.info(`🛣️  Mounted ${module.name} routes at /${globalPrefix}/${routePrefix}`);
      }
    });
    return router;
  }

  // ===== INFORMACIÓN DE MÓDULOS =====
  static getModulesInfo(): { name: string; hasRoutes: boolean }[] {
    return this.initializedModules.map((m) => ({
      name: m.name,
      hasRoutes: !!m.getRoutes(),
    }));
  }
}
