import { Router } from 'express';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SessionRepository } from './session.repository';

import { ModuleInterface } from '@/shared/interfaces/module.interface';
import { createSessionRoutes } from './session.routes';

export class SessionModule implements ModuleInterface {
  name = 'SessionModule';

  private repository!: SessionRepository;
  private service!: SessionService;
  private controller!: SessionController;
  private routes!: Router;

  initialize(): void {
    console.log('🔐 Initializing SessionModule...');

    this.repository = new SessionRepository();
    this.service = new SessionService(this.repository);
    this.controller = new SessionController(this.service);

    this.routes = createSessionRoutes(this.controller);

    console.log('✅ SessionModule initialized');
  }

  getRoutes(): Router {
    return this.routes;
  }

  getService(): SessionService {
    return this.service;
  }

  getRepository(): SessionRepository {
    return this.repository;
  }
}