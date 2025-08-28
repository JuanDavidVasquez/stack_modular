import { Router } from 'express';
import { AuthController } from './auth.controller';
import { schemaValidation } from '@/core/middleware/validationShema.middleware';
import { authGuard } from '@/shared/guards/auth.guard';
import { roleGuard } from '@/shared/guards/roles.guard';
import { registerSchema } from '@/shared/schemas/auth/register.schema';
import { loginSchema } from '@/shared/schemas/auth/login.schema';
import { changePasswordSchema, emailSchema, passwordValidationSchema, refreshTokenSchema, resetPasswordSchema, updateProfileSchema } from '@/shared/schemas/auth/autetication.schema';


export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  // ===== RUTAS PÚBLICAS (SIN AUTENTICACIÓN) =====

  /**
   * Registrar nuevo usuario
   * POST /auth/register
   */
  router.post(
    '/register',
    schemaValidation(registerSchema),
    authController.register
  );

  /**
   * Iniciar sesión
   * POST /auth/login
   */
  router.post(
    '/login',
    schemaValidation(loginSchema),
    authController.login
  );

  /**
   * Renovar tokens
   * POST /auth/refresh
   */
  router.post(
    '/refresh',
    schemaValidation(refreshTokenSchema),
    authController.refresh
  );

  /**
   * Solicitar reset de contraseña
   * POST /auth/forgot-password
   */
  router.post(
    '/forgot-password',
    schemaValidation(emailSchema),
    authController.forgotPassword
  );

  /**
   * Reset contraseña con token
   * POST /auth/reset-password
   */
  router.post(
    '/reset-password',
    schemaValidation(resetPasswordSchema),
    authController.resetPassword
  );

  /**
   * Solicitar verificación de email
   * POST /auth/request-verification
   */
  router.post(
    '/request-verification',
    schemaValidation(emailSchema),
    authController.requestVerification
  );

  /**
   * Verificar email con código
   * POST /auth/verify-email
   */
  router.post(
    '/verify-email',
    authController.verifyEmail
  );

  /**
   * Validar fortaleza de contraseña
   * POST /auth/validate-password
   */
  router.post(
    '/validate-password',
    schemaValidation(passwordValidationSchema),
    authController.validatePassword
  );

  // ===== RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN) =====

  /**
   * Cerrar sesión actual
   * POST /auth/logout
   */
  router.post(
    '/logout',
    authGuard,
    authController.logout
  );

  /**
   * Validar token actual
   * GET /auth/validate
   */
  router.get(
    '/validate',
    authGuard,
    authController.validateToken
  );

  /**
   * Obtener perfil del usuario autenticado
   * GET /auth/profile
   */
  router.get(
    '/profile',
    authGuard,
    authController.getProfile
  );

  /**
   * Actualizar perfil del usuario
   * PUT /auth/profile
   */
  router.put(
    '/profile',
    authGuard,
    schemaValidation(updateProfileSchema),
    authController.updateProfile
  );

  /**
   * Cambiar contraseña (usuario autenticado)
   * POST /auth/change-password
   */
  router.post(
    '/change-password',
    authGuard,
    schemaValidation(changePasswordSchema),
    authController.changePassword
  );

  // ===== RUTAS ADMINISTRATIVAS (REQUIEREN PERMISOS) =====

  /**
   * Obtener información del módulo (solo admins)
   * GET /auth/info
   */
  router.get(
    '/info',
    authGuard,
    roleGuard(['admin']),
    authController.getModuleInfo
  );

  return router;
};