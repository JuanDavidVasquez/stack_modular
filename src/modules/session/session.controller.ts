import { Request, Response } from 'express';
import { SessionService } from './session.service';
import { ResponseUtil } from '@/shared/utils/response.util';
import { extractTokenFromHeader, getUserFromToken } from '@/shared/utils/jwt.util';

export class SessionController {
  private sessionService: SessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  // ===== GESTIÓN DE SESIONES =====

  /**
   * Obtener información de la sesión actual
   * GET /sessions/me
   */
  getCurrentSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const result = await this.sessionService.validateTokenAndSession(token);
      if (!result) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidSession');
        return;
      }

      ResponseUtil.success(
        req, 
        res, 
        'sessions.success.retrieved',
        {
          session: result.session.toSafeObject(),
          user: {
            id: result.tokenData.userId,
            email: result.tokenData.email,
            authEntity: result.tokenData.authEntity
          }
        }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Renovar tokens de sesión
   * POST /sessions/refresh
   */
  refreshSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        ResponseUtil.validationError(req, res, 'auth.errors.refreshTokenRequired');
        return;
      }

      const result = await this.sessionService.refreshTokens(refreshToken);
      if (!result) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidRefreshToken');
        return;
      }

      ResponseUtil.success(
        req,
        res,
        'sessions.success.tokensRefreshed',
        {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: result.tokens.accessTokenExpires,
          session: result.session.toSafeObject()
        }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Cerrar sesión actual
   * POST /sessions/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData || !tokenData.sessionId) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidToken');
        return;
      }

      await this.sessionService.logout(tokenData.sessionId);

      ResponseUtil.success(req, res, 'sessions.success.loggedOut');
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Cerrar todas las sesiones del usuario en esta entidad
   * POST /sessions/logout-all
   */
  logoutFromEntity = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidToken');
        return;
      }

      await this.sessionService.logoutUserFromEntity(tokenData.email, tokenData.authEntity);

      ResponseUtil.success(req, res, 'sessions.success.allSessionsLoggedOut');
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Cerrar todas las sesiones del usuario en TODAS las entidades
   * POST /sessions/logout-global
   */
  logoutGlobal = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidToken');
        return;
      }

      await this.sessionService.logoutUserFromAllEntities(tokenData.email);

      ResponseUtil.success(req, res, 'sessions.success.globalLogout');
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  // ===== CONSULTAS =====

  /**
   * Obtener todas las sesiones activas del usuario
   * GET /sessions/my-sessions
   */
  getMyActiveSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidToken');
        return;
      }

      const sessions = await this.sessionService.getUserAllActiveSessions(tokenData.email);
      const safeSessions = sessions.map(session => session.toSafeObject());

      ResponseUtil.success(
        req,
        res,
        'sessions.success.sessionsRetrieved',
        safeSessions,
        200,
        { total: safeSessions.length }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Obtener sesiones por entidad específica
   * GET /sessions/entity/:authEntity
   */
  getSessionsByEntity = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidToken');
        return;
      }

      const { authEntity } = req.params;
      const sessions = await this.sessionService.getUserSessionsByEntity(tokenData.email, authEntity);
      const safeSessions = sessions.map(session => session.toSafeObject());

      ResponseUtil.success(
        req,
        res,
        'sessions.success.entitySessionsRetrieved',
        safeSessions,
        200,
        { authEntity, total: safeSessions.length }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  // ===== ADMINISTRACIÓN =====

  /**
   * Obtener estadísticas de sesiones (solo para admins)
   * GET /sessions/stats
   */
  getSessionStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { authEntity } = req.query;
      const stats = await this.sessionService.getSessionStats(authEntity as string);

      ResponseUtil.success(
        req,
        res,
        'sessions.success.statsRetrieved',
        stats
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Limpiar sesiones expiradas
   * DELETE /sessions/cleanup/expired
   */
  cleanExpiredSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedCount = await this.sessionService.cleanExpiredSessions();

      ResponseUtil.success(
        req,
        res,
        'sessions.success.expiredCleaned',
        { deletedSessions: deletedCount }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Limpiar sesiones inactivas antiguas
   * DELETE /sessions/cleanup/inactive
   */
  cleanInactiveSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { days = 30 } = req.query;
      const daysOld = parseInt(days as string, 10);
      
      if (isNaN(daysOld) || daysOld < 1) {
        ResponseUtil.validationError(req, res, 'sessions.errors.invalidDays');
        return;
      }

      const deletedCount = await this.sessionService.cleanInactiveSessions(daysOld);

      ResponseUtil.success(
        req,
        res,
        'sessions.success.inactiveCleaned',
        { deletedSessions: deletedCount, daysOld }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Cerrar sesión específica por ID
   * DELETE /sessions/:sessionId
   */
  terminateSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidToken');
        return;
      }

      const { sessionId } = req.params;

      // Validar que la sesión pertenece al usuario
      const isOwner = await this.sessionService.validateSessionOwnership(
        sessionId, 
        tokenData.email, 
        tokenData.authEntity
      );

      if (!isOwner) {
        ResponseUtil.forbidden(req, res, 'sessions.errors.sessionNotOwned');
        return;
      }

      await this.sessionService.logout(sessionId);

      ResponseUtil.success(req, res, 'sessions.success.sessionTerminated');
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Actualizar actividad de sesión (heartbeat)
   * PUT /sessions/activity
   */
  updateActivity = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const result = await this.sessionService.validateTokenAndSession(token);
      if (!result) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.invalidSession');
        return;
      }

      // La actividad ya se actualiza en validateTokenAndSession
      // Pero podemos actualizar información adicional si viene en el body
      const { metadata } = req.body;
      if (metadata) {
        await this.sessionService.updateSessionActivity(
          result.session.id,
          req.ip,
          req.get('User-Agent')
        );
      }

      ResponseUtil.success(req, res, 'sessions.success.activityUpdated');
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };

  /**
   * Verificar estado de sesión (healthcheck)
   * GET /sessions/health
   */
  checkSessionHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.tokenRequired');
        return;
      }

      const result = await this.sessionService.validateTokenAndSession(token);
      if (!result) {
        ResponseUtil.unauthorized(req, res, 'auth.errors.sessionExpired');
        return;
      }

      const needsRefresh = await this.sessionService.checkTokenRefreshNeeded(result.session.id);

      ResponseUtil.success(
        req,
        res,
        'sessions.success.healthChecked',
        {
          isValid: true,
          needsRefresh,
          expiresAt: result.session.accessTokenExpires,
          lastActivity: result.session.lastActivity
        }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'common.errors.internal', 500);
    }
  };
}