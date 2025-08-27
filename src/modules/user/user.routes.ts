import { Router } from 'express';
import { UserController } from './user.controller';

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  console.log('Setting up user routes');


  router.post("/list", userController.listUsers);
  router.post("/get", userController.getUserById);
  router.post("/create", userController.createUser);

  return router;
};
