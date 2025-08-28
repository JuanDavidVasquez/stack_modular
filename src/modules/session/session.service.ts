import { SessionRepository } from './session.repository';
import { Session } from '@/shared/models/entities/session.model';
import { generateSessionTokens, verifyToken, getUserFromToken } from '@/shared/utils/jwt.util';
import { UserRepository } from '../user/user.repository';

export class SessionService {
  private sessionRepository: SessionRepository;

  constructor(sessionRepository: SessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  // ===== CREACIÓN Y GESTIÓN DE SESIONES =====

  /**
   * Crear nueva sesión para un usuario
   * Desactiva sesiones previas en la misma entidad (sesión única)
   */
  async createSession(data: {
    userId: string;
    userEmail: string;
    authEntity: string;
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
    deviceType?: string;
    role?: string;
    metadata?: Record<string, any>;
  }): Promise<{ session: Session; tokens: any }> {
    // 1. Desactivar sesiones existentes en esta entidad
    await this.sessionRepository.deactivateUserSessionsInEntity(data.userEmail, data.authEntity);

    // 2. Generar tokens JWT
    const sessionId = this.generateTemporaryId(); // Temporal para generar tokens
    const tokens = await generateSessionTokens(
      data.userId,
      sessionId,
      data.userEmail,
      data.authEntity,
    );

    // 3. Crear sesión en BD
    const session = await this.sessionRepository.createSession({
      userId: data.userId,
      userEmail: data.userEmail,
      authEntity: data.authEntity,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpires: tokens.accessTokenExpires,
      refreshTokenExpires: tokens.refreshTokenExpires,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceName: data.deviceName,
      deviceType: data.deviceType,
      metadata: data.metadata
    });
    const userRepository = new UserRepository();
    const { roles } = await userRepository.findById(session.userId);
    //Actualizar tokens con el ID real de la sesión
    const finalTokens = {
      ...(await generateSessionTokens(
        data.userId,
        session.id,
        data.userEmail,
        data.authEntity,
        roles
      )),
    };
    await this.sessionRepository.updateSessionTokens(
      session.id,
      finalTokens.accessToken,
      finalTokens.refreshToken,
      finalTokens.accessTokenExpires,
      finalTokens.refreshTokenExpires
    );

    return {
      session: await this.sessionRepository.findById(session.id) as Session,
      tokens: finalTokens
    };
  }

  /**
   * Validar sesión activa
   */
  async validateSession(sessionId: string, authEntity: string): Promise<Session | null> {
    const session = await this.sessionRepository.findActiveSessionById(sessionId);
    
    if (!session || session.authEntity !== authEntity) {
      return null;
    }

    if (!session.isValidSession()) {
      await this.sessionRepository.deactivateSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Validar token y sesión
   */
  async validateTokenAndSession(token: string): Promise<{ session: Session; tokenData: any } | null> {
    try {
      // 1. Verificar token JWT
      const tokenData = await getUserFromToken(token);
      if (!tokenData || !tokenData.sessionId) return null;

      // 2. Validar sesión en BD
      const session = await this.validateSession(tokenData.sessionId, tokenData.authEntity);
      if (!session) return null;

      // 3. Verificar que el token corresponde a la sesión
      if (session.userEmail !== tokenData.email || session.userId !== tokenData.userId) {
        return null;
      }

      // 4. Actualizar actividad
      await this.updateSessionActivity(session.id);

      return { session, tokenData };
    } catch (error) {
      return null;
    }
  }

  // ===== REFRESH TOKEN =====

  /**
   * Renovar tokens usando refresh token
   */
  async refreshTokens(refreshToken: string): Promise<{ tokens: any; session: Session } | null> {
    const session = await this.sessionRepository.findSessionByRefreshToken(refreshToken);
    
    if (!session || !session.isRefreshTokenValid() || !session.isActive) {
      return null;
    }

    // Generar nuevos tokens
    const newTokens = await generateSessionTokens(
      session.userId,
      session.id,
      session.userEmail,
      session.authEntity
    );

    // Actualizar en BD
    await this.sessionRepository.updateSessionTokens(
      session.id,
      newTokens.accessToken,
      newTokens.refreshToken,
      newTokens.accessTokenExpires,
      newTokens.refreshTokenExpires
    );

    const updatedSession = await this.sessionRepository.findById(session.id) as Session;

    return {
      tokens: newTokens,
      session: updatedSession
    };
  }

  // ===== LOGOUT =====

  /**
   * Logout de sesión específica
   */
  async logout(sessionId: string): Promise<boolean> {
    await this.sessionRepository.deactivateSession(sessionId);
    return true;
  }

  /**
   * Logout de usuario en entidad específica
   */
  async logoutUserFromEntity(userEmail: string, authEntity: string): Promise<boolean> {
    await this.sessionRepository.deactivateUserSessionsInEntity(userEmail, authEntity);
    return true;
  }

  /**
   * Logout global del usuario (todas las APIs)
   */
  async logoutUserFromAllEntities(userEmail: string): Promise<boolean> {
    await this.sessionRepository.deactivateAllUserSessions(userEmail);
    return true;
  }

  // ===== CONSULTAS =====

  /**
   * Verificar si usuario tiene sesión activa en entidad
   */
  async hasActiveSession(userEmail: string, authEntity: string): Promise<boolean> {
    return await this.sessionRepository.hasActiveSession(userEmail, authEntity);
  }

  /**
   * Obtener sesión activa del usuario en entidad específica
   */
  async getUserActiveSession(userEmail: string, authEntity: string): Promise<Session | null> {
    return await this.sessionRepository.findActiveSessionByEmailAndEntity(userEmail, authEntity);
  }

  /**
   * Obtener todas las sesiones activas de un usuario
   */
  async getUserAllActiveSessions(userEmail: string): Promise<Session[]> {
    return await this.sessionRepository.getAllUserActiveSessions(userEmail);
  }

  /**
   * Obtener sesiones de usuario por entidad
   */
  async getUserSessionsByEntity(userEmail: string, authEntity: string): Promise<Session[]> {
    return await this.sessionRepository.getUserActiveSessionsByEntity(userEmail, authEntity);
  }

  // ===== ACTUALIZACIÓN =====

  /**
   * Actualizar actividad de sesión
   */
  async updateSessionActivity(sessionId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.sessionRepository.updateSessionActivity(sessionId, ipAddress, userAgent);
  }

  /**
   * Verificar si sesión necesita renovación de token
   */
  async checkTokenRefreshNeeded(sessionId: string, minutesBefore: number = 15): Promise<boolean> {
    const session = await this.sessionRepository.findActiveSessionById(sessionId);
    return session?.needsTokenRefresh(minutesBefore) || false;
  }

  // ===== ESTADÍSTICAS Y ADMINISTRACIÓN =====

  /**
   * Obtener estadísticas de sesiones
   */
  async getSessionStats(authEntity?: string): Promise<{
    totalActiveSessions: number;
    totalUsers: number;
    sessionsByEntity: Record<string, number>;
  }> {
    return await this.sessionRepository.getSessionStats(authEntity);
  }

  /**
   * Contar sesiones activas por entidad
   */
  async countActiveSessionsByEntity(authEntity: string): Promise<number> {
    return await this.sessionRepository.countActiveSessionsByEntity(authEntity);
  }

  /**
   * Limpiar sesiones expiradas
   */
  async cleanExpiredSessions(): Promise<number> {
    return await this.sessionRepository.cleanExpiredSessions();
  }

  /**
   * Limpiar sesiones inactivas antiguas
   */
  async cleanInactiveSessions(daysOld: number = 30): Promise<number> {
    return await this.sessionRepository.cleanInactiveSessions(daysOld);
  }

  // ===== VALIDACIONES =====

  /**
   * Validar propiedad de sesión
   */
  async validateSessionOwnership(sessionId: string, userEmail: string, authEntity: string): Promise<boolean> {
    return await this.sessionRepository.validateSessionOwnership(sessionId, userEmail, authEntity);
  }

  /**
   * Obtener información segura de sesión (sin tokens)
   */
  async getSessionSafeInfo(sessionId: string): Promise<Partial<Session> | null> {
    const session = await this.sessionRepository.findById(sessionId);
    return session?.toSafeObject() || null;
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Generar ID temporal para tokens (se reemplaza con el ID real después)
   */
  private generateTemporaryId(): string {
    return 'temp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Parsear User-Agent para extraer información del dispositivo
   */
  private parseUserAgent(userAgent?: string): { deviceName?: string; deviceType?: string } {
    if (!userAgent) return {};

    // Lógica simple para detectar dispositivos
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);
    
    let deviceType: string;
    if (isTablet) {
      deviceType = 'tablet';
    } else if (isMobile) {
      deviceType = 'mobile';
    } else {
      deviceType = 'desktop';
    }

    // Extraer nombre básico del navegador
    let deviceName = 'Unknown';
    if (userAgent.includes('Chrome')) deviceName = 'Chrome';
    else if (userAgent.includes('Firefox')) deviceName = 'Firefox';
    else if (userAgent.includes('Safari')) deviceName = 'Safari';
    else if (userAgent.includes('Edge')) deviceName = 'Edge';

    return { deviceName, deviceType };
  }

  /**
   * Crear sesión con detección automática de dispositivo
   */
  async createSessionWithDeviceDetection(data: {
    userId: string;
    userEmail: string;
    authEntity: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<{ session: Session; tokens: any }> {
    const deviceInfo = this.parseUserAgent(data.userAgent);
    
    return await this.createSession({
      ...data,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType
    });
  }
}