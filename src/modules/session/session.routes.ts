import { Router } from 'express';
import { SessionController } from './session.controller';

export const createSessionRoutes = (sessionController: SessionController): Router => {
  const router = Router();

  // ===== GESTIÓN DE SESIÓN ACTUAL =====
  
  /**
   * Obtener información de la sesión actual
   * GET /sessions/me
   */
  router.get('/me', sessionController.getCurrentSession);

  /**
   * Renovar tokens de sesión
   * POST /sessions/refresh
   */
  router.post('/refresh', sessionController.refreshSession);

  /**
   * Verificar estado de sesión (healthcheck)
   * GET /sessions/health
   */
  router.get('/health', sessionController.checkSessionHealth);

  /**
   * Actualizar actividad de sesión (heartbeat)
   * PUT /sessions/activity
   */
  router.put('/activity', sessionController.updateActivity);

  // ===== LOGOUT =====

  /**
   * Cerrar sesión actual
   * POST /sessions/logout
   */
  router.post('/logout', sessionController.logout);

  /**
   * Cerrar todas las sesiones del usuario en esta entidad
   * POST /sessions/logout-all
   */
  router.post('/logout-all', sessionController.logoutFromEntity);

  /**
   * Cerrar todas las sesiones del usuario en TODAS las entidades
   * POST /sessions/logout-global
   */
  router.post('/logout-global', sessionController.logoutGlobal);

  // ===== CONSULTAS =====

  /**
   * Obtener todas las sesiones activas del usuario
   * GET /sessions/my-sessions
   */
  router.get('/my-sessions', sessionController.getMyActiveSessions);

  /**
   * Obtener sesiones por entidad específica
   * GET /sessions/entity/:authEntity
   */
  router.get('/entity/:authEntity', sessionController.getSessionsByEntity);

  // ===== GESTIÓN ESPECÍFICA =====

  /**
   * Cerrar sesión específica por ID
   * DELETE /sessions/:sessionId
   */
  router.delete('/:sessionId', sessionController.terminateSession);

  // ===== ADMINISTRACIÓN (Requieren permisos de admin) =====

  /**
   * Obtener estadísticas de sesiones
   * GET /sessions/stats
   */
  router.get('/stats', sessionController.getSessionStats);

  /**
   * Limpiar sesiones expiradas
   * DELETE /sessions/cleanup/expired
   */
  router.delete('/cleanup/expired', sessionController.cleanExpiredSessions);

  /**
   * Limpiar sesiones inactivas antiguas
   * DELETE /sessions/cleanup/inactive?days=30
   */
  router.delete('/cleanup/inactive', sessionController.cleanInactiveSessions);

  return router;
};