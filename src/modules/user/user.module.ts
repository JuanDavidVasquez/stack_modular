import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

import { ModuleInterface } from '@/shared/interfaces/module.interface';
import { createUserRoutes } from './user.routes';

export class UserModule implements ModuleInterface {
  name = 'UserModule';

  private repository!: UserRepository;
  private service!: UserService;
  private controller!: UserController;
  private routes!: Router;

  initialize(): void {
    console.log('👤 Initializing UserModule...');

    this.repository = new UserRepository();
    this.service = new UserService(this.repository);
    this.controller = new UserController(this.service);

    this.routes = createUserRoutes(this.controller);

    console.log('✅ UserModule initialized');
  }

  getRoutes(): Router {
    return this.routes;
  }
}

