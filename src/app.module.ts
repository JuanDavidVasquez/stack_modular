import { Router } from 'express';
import { envConfig } from '@config/env.config';
import { logger } from '@core/utils/logger';
import { ModuleInterface } from './shared/interfaces/module.interface';
import { UserModule } from '@modules/user/user.module';
import { SessionModule } from './modules/session/session.module';
import { AuthModule } from './modules/auth/auth.module';

export class AppModule {
  // ----- Módulos predefinidos -----
  private static modules: (new () => ModuleInterface)[] = [
    UserModule,
    SessionModule,
    AuthModule
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
      const fullPath = `/${globalPrefix}/${routePrefix}`;
      router.use(fullPath, routes);
      logger.info(`🛣️  Mounted ${module.name} routes at ${fullPath}`);

      // 🔍 DEBUG: listar rutas de este módulo
      console.log(`   Routes for ${module.name}:`);
      routes.stack.forEach((layer: any) => {
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
          console.log(`      ${methods} -> ${fullPath}${layer.route.path}`);
        }
      });
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
