import { Router } from 'express';
import { UserController } from './user.controller';
import { schemaValidation } from '@/core/middleware/validationShema.middleware';
import { paginationSchema } from '@/shared/schemas/pagination.schema';
import { roleGuard } from '@/shared/guards/roles.guard';
import { authGuard } from '@/shared/guards/auth.guard';

export const createUserRoutes = (userController: UserController): Router => {
  const router = Router();

  router.post(
    "/list", 
    schemaValidation(paginationSchema),
    authGuard,
    roleGuard(['admin']),
    userController.listUsers
  );
  router.get("/get/:id",
     authGuard,
    roleGuard(['admin']),
    userController.getUserById);
  router.post("/create",
    authGuard,
    roleGuard(['admin']),
    userController.createUser);
  router.put("/update/:id",
    authGuard,
    roleGuard(['admin']),
    userController.updateUser);
  router.delete("/delete/:id",
    authGuard,
    roleGuard(['admin']),
    userController.deleteUser);

  return router;
};
