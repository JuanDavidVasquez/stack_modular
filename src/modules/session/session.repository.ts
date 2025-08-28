import { BaseRepository } from "@/core/repositories/base.repository";
import { Session } from "@/shared/models/entities/session.model";

/**
 * SessionRepository - Maneja todas las operaciones de sesiones de forma independiente
 * No tiene dependencias con entidades de usuario específicas
 */
export class SessionRepository extends BaseRepository<Session> {
  
  constructor() {
    super(Session);
  }

  // ===== MÉTODOS CORE DE SESIÓN =====

  /**
   * Crear nueva sesión
   */
  async createSession(sessionData: {
    userId: string;
    authEntity: string;
    userEmail: string;
    accessToken: string;
    refreshToken?: string;
    accessTokenExpires: Date;
    refreshTokenExpires?: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
    deviceType?: string;
    metadata?: Record<string, any>;
  }): Promise<Session> {
    const session = this.repository.create({
      ...sessionData,
      expiresAt: sessionData.refreshTokenExpires || new Date(Date.now() + 7 * 24 * 3600000),
      isActive: true
    });

    return await this.repository.save(session);
  }

  /**
   * Buscar sesión activa por email + entidad (CONTROL DE SESIÓN ÚNICA)
   */
  async findActiveSessionByEmailAndEntity(userEmail: string, authEntity: string): Promise<Session | null> {
    return await this.repository.findOne({
      where: {
        userEmail,
        authEntity,
        isActive: true
      }
    });
  }

  /**
   * Buscar sesión activa por ID
   */
  async findActiveSessionById(sessionId: string): Promise<Session | null> {
    return await this.repository.findOne({
      where: {
        id: sessionId,
        isActive: true
      }
    });
  }

  /**
   * Buscar sesión por refresh token
   */
  async findSessionByRefreshToken(refreshToken: string): Promise<Session | null> {
    return await this.repository.findOne({
      where: { refreshToken }
    });
  }

  // ===== MÉTODOS DE GESTIÓN DE SESIONES =====

  /**
   * Desactivar todas las sesiones de un usuario en una entidad específica
   * (Para login único por entidad)
   */
  async deactivateUserSessionsInEntity(userEmail: string, authEntity: string): Promise<void> {
    await this.repository.update(
      {
        userEmail,
        authEntity,
        isActive: true
      },
      {
        isActive: false,
        lastActivity: new Date()
      }
    );
  }

  /**
   * Desactivar todas las sesiones de un usuario (logout global todas las APIs)
   */
  async deactivateAllUserSessions(userEmail: string): Promise<void> {
    await this.repository.update(
      {
        userEmail,
        isActive: true
      },
      {
        isActive: false,
        lastActivity: new Date()
      }
    );
  }

  /**
   * Desactivar sesión específica
   */
  async deactivateSession(sessionId: string): Promise<void> {
    await this.repository.update(sessionId, {
      isActive: false,
      lastActivity: new Date()
    });
  }

  // ===== MÉTODOS DE ACTUALIZACIÓN =====

  /**
   * Actualizar tokens de sesión
   */
  async updateSessionTokens(
    sessionId: string,
    accessToken: string,
    refreshToken?: string,
    accessTokenExpires?: Date,
    refreshTokenExpires?: Date
  ): Promise<void> {
    const updateData: any = {
      accessToken,
      lastActivity: new Date()
    };

    if (accessTokenExpires) {
      updateData.accessTokenExpires = accessTokenExpires;
    }

    if (refreshToken) {
      updateData.refreshToken = refreshToken;
    }

    if (refreshTokenExpires) {
      updateData.refreshTokenExpires = refreshTokenExpires;
      updateData.expiresAt = refreshTokenExpires;
    }

    await this.repository.update(sessionId, updateData);
  }

  /**
   * Actualizar actividad de sesión
   */
  async updateSessionActivity(sessionId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const updateData: any = {
      lastActivity: new Date()
    };

    if (ipAddress) updateData.ipAddress = ipAddress;
    if (userAgent) updateData.userAgent = userAgent;

    await this.repository.update(sessionId, updateData);
  }

  // ===== MÉTODOS DE CONSULTA =====

  /**
   * Obtener todas las sesiones activas de un usuario por entidad
   */
  async getUserActiveSessionsByEntity(userEmail: string, authEntity: string): Promise<Session[]> {
    return await this.repository.find({
      where: {
        userEmail,
        authEntity,
        isActive: true
      },
      order: {
        lastActivity: 'DESC'
      }
    });
  }

  /**
   * Obtener todas las sesiones activas de un usuario (todas las entidades/APIs)
   */
  async getAllUserActiveSessions(userEmail: string): Promise<Session[]> {
    return await this.repository.find({
      where: {
        userEmail,
        isActive: true
      },
      order: {
        authEntity: 'ASC',
        lastActivity: 'DESC'
      }
    });
  }

  /**
   * Contar sesiones activas por entidad
   */
  async countActiveSessionsByEntity(authEntity: string): Promise<number> {
    return await this.repository.count({
      where: {
        authEntity,
        isActive: true
      }
    });
  }

  /**
   * Verificar si existe sesión activa para usuario + entidad
   */
  async hasActiveSession(userEmail: string, authEntity: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        userEmail,
        authEntity,
        isActive: true
      }
    });
    return count > 0;
  }

  /**
   * Validar que una sesión pertenece a un usuario específico
   */
  async validateSessionOwnership(sessionId: string, userEmail: string, authEntity: string): Promise<boolean> {
    const session = await this.repository.findOne({
      where: {
        id: sessionId,
        userEmail,
        authEntity,
        isActive: true
      }
    });
    return !!session;
  }

  // ===== MÉTODOS DE MANTENIMIENTO =====

  /**
   * Limpiar sesiones expiradas
   */
  async cleanExpiredSessions(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: { $lt: new Date() } as any
    });
    return result.affected || 0;
  }

  /**
   * Limpiar sesiones inactivas más antiguas que X días
   */
  async cleanInactiveSessions(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    
    const result = await this.repository.delete({
      isActive: false,
      lastActivity: { $lt: cutoffDate } as any
    });
    
    return result.affected || 0;
  }

  /**
   * Obtener estadísticas de sesiones por entidad
   */
  async getSessionStats(authEntity?: string): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    sessionsByEntity: Record<string, number>;
  }> {
    const whereClause = authEntity ? { authEntity, isActive: true } : { isActive: true };
    
    const [totalActiveSessions, sessions] = await Promise.all([
      this.repository.count({ where: whereClause }),
      this.repository.find({ where: whereClause, select: ['authEntity', 'userEmail'] })
    ]);

    // Contar usuarios únicos
    const uniqueUsers = new Set(sessions.map(s => s.userEmail)).size;

    // Agrupar por entidad
    const sessionsByEntity = sessions.reduce((acc, session) => {
      acc[session.authEntity] = (acc[session.authEntity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActiveSessions,
      totalUsers: uniqueUsers,
      sessionsByEntity
    };
  }
}