import { AuthRepository } from './auth.repository';
import { SessionService } from '../session/session.service';
import { hashPassword, comparePassword, validatePasswordStrength, generateTemporaryPassword } from '@/shared/utils/bcrypt.util';
import { UserStatus } from '@/shared/models/shared/enums/user.enums';
import { LoginData, RegisterData } from '@/shared/interfaces/auth.interface';



export class AuthService {
  private authRepository: AuthRepository;
  private sessionService: SessionService;
  private readonly authEntity: string;

  constructor(authRepository: AuthRepository, sessionService: SessionService) {
    this.authRepository = authRepository;
    this.sessionService = sessionService;
    this.authEntity = authRepository.getAuthEntity();
  }

  // ===== REGISTRO =====

  /**
   * Registrar nuevo usuario
   */
  async register(registerData: RegisterData, sessionInfo?: {
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
    deviceType?: string;
  }) {
    // 1. Validar fortaleza de password
    const passwordValidation = validatePasswordStrength(registerData.password);
    if (!passwordValidation.isValid) {
      throw new Error(`Weak password: ${passwordValidation.errors.join(', ')}`);
    }

    // 2. Validar que email no exista
    const emailExists = await this.authRepository.emailExists(registerData.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // 3. Validar username si se proporciona
    if (registerData.username) {
      const usernameExists = await this.authRepository.usernameExists(registerData.username);
      if (usernameExists) {
        throw new Error('Username already taken');
      }
    }

    // 4. Hash de password
    const hashedPassword = await hashPassword(registerData.password);

    // 5. Crear usuario
    const userData = {
      ...registerData,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      isEmailVerified: false
    };

    const user = await this.authRepository.createUser(userData);

    // 6. Crear sesión inicial si se proporciona información
    let session = null;
    let tokens = null;

    if (sessionInfo) {
      const sessionResult = await this.sessionService.createSession({
        userId: user.id,
        userEmail: user.email,
        authEntity: this.authEntity,
        ...sessionInfo
      });

      session = sessionResult.session;
      tokens = sessionResult.tokens;
    }

    return {
      user: user.toPublic ? user.toPublic() : user,
      session: session?.toSafeObject(),
      tokens,
      authEntity: this.authEntity,
      passwordScore: passwordValidation.score
    };
  }

  // ===== LOGIN =====

  /**
   * Autenticar usuario y crear sesión
   */
  async login(loginData: LoginData) {
    // Buscar usuario por email
    const user = await this.authRepository.findByEmailWithPassword(loginData.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verificar si está bloqueado
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new Error(`Account locked. Try again in ${minutesLeft} minutes`);
    }

    // Verificar status del usuario
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('Account is not active');
    }

    // Validar password
    const isValidPassword = await comparePassword(loginData.password, user.password);
    if (!isValidPassword) {
      await this.authRepository.incrementLoginAttempts(user.id);
      throw new Error('Invalid credentials');
    }

    // Actualizar información de login exitoso
    await this.authRepository.updateSuccessfulLogin(
      user.id,
      loginData.ipAddress,
      loginData.userAgent
    );

    // Crear nueva sesión (desactiva sesiones previas automáticamente)
    const sessionResult = await this.sessionService.createSession({
      userId: user.id,
      userEmail: user.email,
      authEntity: this.authEntity,
      ipAddress: loginData.ipAddress,
      userAgent: loginData.userAgent,
      deviceName: loginData.deviceName,
      deviceType: loginData.deviceType
    });

    return {
      user: user.toPublic ? user.toPublic() : user,
      session: sessionResult.session.toSafeObject(),
      tokens: sessionResult.tokens,
      authEntity: this.authEntity
    };
  }

  // ===== LOGOUT =====

  /**
   * Cerrar sesión actual
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionService.logout(sessionId);
  }

  /**
   * Cerrar todas las sesiones del usuario en esta entidad
   */
  async logoutFromEntity(email: string): Promise<void> {
    await this.sessionService.logoutUserFromEntity(email, this.authEntity);
  }

  /**
   * Cerrar todas las sesiones del usuario en todas las entidades
   */
  async logoutGlobal(email: string): Promise<void> {
    await this.sessionService.logoutUserFromAllEntities(email);
  }

  // ===== VALIDACIÓN DE SESIÓN =====

  /**
   * Validar token y obtener información del usuario
   */
  async validateToken(token: string) {
    const result = await this.sessionService.validateTokenAndSession(token);
    if (!result) return null;

    // Verificar que la sesión pertenece a esta entidad
    if (result.session.authEntity !== this.authEntity) {
      return null;
    }

    // Obtener información completa del usuario
    const user = await this.authRepository.findByEmail(result.tokenData.email);
    if (!user) return null;

    return {
      user: user.toPublic ? user.toPublic() : user,
      session: result.session.toSafeObject(),
      tokenData: result.tokenData
    };
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string) {
    const result = await this.sessionService.refreshTokens(refreshToken);
    if (!result) return null;

    // Verificar que la sesión pertenece a esta entidad
    if (result.session.authEntity !== this.authEntity) {
      return null;
    }

    return result;
  }

  // ===== RECUPERACIÓN DE CONTRASEÑA =====

  /**
   * Solicitar reset de password
   */
  async requestPasswordReset(email: string): Promise<string | null> {
    const user = await this.authRepository.findByEmail(email);
    if (!user) return null; // No revelar si el email existe o no

    // Generar token de reset
    user.setResetPasswordToken();
    await this.authRepository.update(user.id, {
      resetPasswordToken: user.resetPasswordToken,
      resetPasswordExpires: user.resetPasswordExpires
    });

    return user.resetPasswordToken!;
  }

  /**
   * Reset de password usando token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.authRepository.findByResetToken(token);
    if (!user) return false;

    const hashedPassword = await hashPassword(newPassword);
    await this.authRepository.updatePassword(user.id, hashedPassword);

    // Cerrar todas las sesiones del usuario por seguridad
    await this.sessionService.logoutUserFromAllEntities(user.email);

    return true;
  }

  // ===== VERIFICACIÓN DE EMAIL =====

  /**
   * Solicitar verificación de email
   */
  async requestEmailVerification(email: string): Promise<string | null> {
    const user = await this.authRepository.findByEmail(email);
    if (!user || user.isEmailVerified) return null;

    // Generar código de verificación
    user.setVerificationCode();
    await this.authRepository.update(user.id, {
      verificationCode: user.verificationCode,
      verificationCodeExpires: user.verificationCodeExpires
    });

    return user.verificationCode!;
  }

  /**
   * Verificar email usando código
   */
  async verifyEmail(code: string): Promise<boolean> {
    const user = await this.authRepository.findByVerificationCode(code);
    if (!user) return false;

    await this.authRepository.verifyEmail(user.id);
    return true;
  }

  // ===== CAMBIO DE PASSWORD =====

  /**
   * Cambiar password (usuario autenticado)
   */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.authRepository.findByEmailWithPassword(email);
    if (!user) return false;

    // Validar password actual
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) return false;

    // Actualizar password
    const hashedPassword = await hashPassword(newPassword);
    await this.authRepository.updatePassword(user.id, hashedPassword);

    // Cerrar otras sesiones por seguridad (excepto la actual)
    await this.sessionService.logoutUserFromEntity(email, this.authEntity);

    return true;
  }

  // ===== INFORMACIÓN DEL USUARIO =====

  /**
   * Obtener perfil del usuario autenticado
   */
  async getUserProfile(email: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) return null;

    const hasActiveSession = await this.sessionService.hasActiveSession(email, this.authEntity);
    const activeSessions = await this.sessionService.getUserSessionsByEntity(email, this.authEntity);

    return {
      user: user.toPublic ? user.toPublic() : user,
      hasActiveSession,
      totalActiveSessions: activeSessions.length,
      authEntity: this.authEntity
    };
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(email: string, updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    timezone?: string;
    locale?: string;
  }) {
    const user = await this.authRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    const updatedUser = await this.authRepository.update(user.id, updateData);
    return updatedUser.toPublic ? updatedUser.toPublic() : updatedUser;
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Validar fortaleza de password
   */
  validatePasswordStrength(password: string) {
    return validatePasswordStrength(password);
  }

  /**
   * Generar password temporal
   */
  generateTemporaryPassword(length: number = 12): string {
    return generateTemporaryPassword(length);
  }

  /**
   * Verificar si el servicio está configurado correctamente
   */
  async checkConfiguration(): Promise<{
    authEntity: string;
    isConfigured: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Verificar variables de entorno
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET not configured');
    }

    if (!process.env.AUTH_TABLE_NAME) {
      errors.push('AUTH_TABLE_NAME not configured, using default');
    }

    return {
      authEntity: this.authEntity,
      isConfigured: errors.length === 0,
      errors
    };
  }

  /**
   * Obtener configuración del módulo
   */
  getModuleInfo() {
    return this.authRepository.getModuleConfig();
  }
}