import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { SessionService } from '../session/session.service';
import { SessionRepository } from '../session/session.repository';

import { ModuleInterface } from '@/shared/interfaces/module.interface';
import { createAuthRoutes } from './auth.routes';

export class AuthModule implements ModuleInterface {
  name = 'AuthModule';

  private authRepository!: AuthRepository;
  private sessionRepository!: SessionRepository;
  private sessionService!: SessionService;
  private authService!: AuthService;
  private controller!: AuthController;
  private routes!: Router;

  initialize(): void {
    console.log('🔑 Initializing AuthModule...');

    // Instanciar repositorios
    this.authRepository = new AuthRepository();
    this.sessionRepository = new SessionRepository();

    // Instanciar servicios con inyección de dependencias
    this.sessionService = new SessionService(this.sessionRepository);
    this.authService = new AuthService(this.authRepository, this.sessionService);

    // Instanciar controller
    this.controller = new AuthController(this.authService);

    // Crear rutas
    this.routes = createAuthRoutes(this.controller);

    console.log('✅ AuthModule initialized');
  }

  getRoutes(): Router {
    return this.routes;
  }

  getAuthService(): AuthService {
    return this.authService;
  }

  getSessionService(): SessionService {
    return this.sessionService;
  }

  getAuthRepository(): AuthRepository {
    return this.authRepository;
  }
}