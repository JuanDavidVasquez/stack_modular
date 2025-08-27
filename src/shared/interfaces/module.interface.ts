import { Router } from 'express';

export interface ModuleInterface {
  /** Nombre del módulo */
  name: string;

  /** Retorna las rutas del módulo */
  getRoutes(): Router;

  /** Inicialización opcional */
  initialize?(): void;
}
