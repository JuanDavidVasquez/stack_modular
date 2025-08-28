import { BaseRepository } from "@/core/repositories/base.repository";

// Determinar tabla de usuario dinámicamente
const tableName = process.env.AUTH_TABLE_NAME || "users";
const entityName = tableName.toLocaleLowerCase();
console.log(`Using auth table: ${tableName}, entity: ${entityName}`);

// Importar entidad dinámicamente
const UserEntity = require(`@/shared/models/entities/${entityName}.model`)[entityName.charAt(0).toUpperCase() + entityName.slice(1)];
console.log(`Loaded UserEntity: ${UserEntity ? 'success' : 'failed'}`);
/**
 * AuthRepository - Maneja operaciones de autenticación para la entidad de usuario configurada
 * Se enfoca únicamente en operaciones de usuario, delega sesiones al SessionService
 */
export class AuthRepository extends BaseRepository<typeof UserEntity> {
  private readonly authEntity: string;
  
  constructor() {
    super(UserEntity);
    this.authEntity = tableName; // users, admins, vendors
  }

  // ===== MÉTODOS DE BÚSQUEDA DE USUARIO =====

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string) {
    return await this.repository.findOne({
      where: { email }
    });
  }

  /**
   * Buscar usuario por email con password (para login)
   */
  async findByEmailWithPassword(email: string) {
    return await this.repository.findOne({
      where: { email },
      select: [
        'id', 
        'email', 
        'password', 
        'firstName', 
        'lastName', 
        'status', 
        'isEmailVerified', 
        'loginAttempts', 
        'lockedUntil',
        'roles'
      ]
    });
  }

  /**
   * Buscar usuario por username
   */
  async findByUsername(username: string) {
    return await this.repository.findOne({
      where: { username }
    });
  }

  /**
   * Buscar usuario por provider ID (OAuth)
   */
  async findByProviderId(providerId: string, provider: string) {
    return await this.repository.findOne({
      where: { 
        providerId,
        provider
      }
    });
  }

  /**
   * Buscar usuario por token de reset de password
   */
  async findByResetToken(token: string) {
    return await this.repository.findOne({
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() } as any
      }
    });
  }

  /**
   * Buscar usuario por código de verificación de email
   */
  async findByVerificationCode(code: string) {
    return await this.repository.findOne({
      where: { 
        verificationCode: code,
        verificationCodeExpires: { $gt: new Date() } as any
      }
    });
  }

  // ===== MÉTODOS DE VALIDACIÓN =====

  /**
   * Verificar si email ya existe
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.repository.findOne({
      where: { email },
      select: ['id']
    });
    return !!user;
  }

  /**
   * Verificar si username ya existe
   */
  async usernameExists(username: string): Promise<boolean> {
    const user = await this.repository.findOne({
      where: { username },
      select: ['id']
    });
    return !!user;
  }

  // ===== MÉTODOS DE ACTUALIZACIÓN DE SEGURIDAD =====

  /**
   * Actualizar información de login exitoso
   */
  async updateSuccessfulLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const updateData: any = {
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      loginCount: () => 'login_count + 1' // SQL function para incrementar
    };

    if (ipAddress) updateData.lastLoginIp = ipAddress;
    if (userAgent) updateData.lastUserAgent = userAgent;

    await this.repository.update(userId, updateData);
  }

  /**
   * Incrementar intentos de login fallidos
   */
  async incrementLoginAttempts(userId: string): Promise<void> {
    const user = await this.repository.findOne({
      where: { id: userId },
      select: ['loginAttempts']
    });

    if (!user) return;

    const newAttempts = user.loginAttempts + 1;
    const updateData: any = {
      loginAttempts: newAttempts
    };

    // Bloquear usuario después de X intentos (configurable)
    const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
    const LOCK_DURATION_MINUTES = parseInt(process.env.LOCK_DURATION_MINUTES || '15', 10);
    
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + (LOCK_DURATION_MINUTES * 60 * 1000));
    }

    await this.repository.update(userId, updateData);
  }

  /**
   * Actualizar password del usuario
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.repository.update(userId, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });
  }

  /**
   * Verificar email del usuario
   */
  async verifyEmail(userId: string): Promise<void> {
    await this.repository.update(userId, {
      isEmailVerified: true,
      verificationCode: null,
      verificationCodeExpires: null
    });
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Obtener la entidad de autenticación configurada
   */
  getAuthEntity(): string {
    return this.authEntity;
  }

  /**
   * Obtener configuración del módulo
   */
  getModuleConfig() {
    return {
      tableName: this.authEntity,
      entityName: entityName,
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
      lockDurationMinutes: parseInt(process.env.LOCK_DURATION_MINUTES || '15', 10)
    };
  }

  // ===== MÉTODOS ESPECÍFICOS POR ENTIDAD =====

  /**
   * Crear usuario con datos específicos de esta entidad
   */
  async createUser(userData: any) {
    // Agregar datos por defecto según la entidad
    const defaultData = this.getDefaultUserData();
    const completeUserData = { ...defaultData, ...userData };

    return await this.repository.save(completeUserData);
  }

  /**
   * Obtener datos por defecto según la entidad
   */
  private getDefaultUserData(): any {
    // Puedes personalizar según authEntity
    switch (this.authEntity) {
      case 'admins':
        return { adminLevel: 1 };
      case 'vendors':
        return { vendorStatus: 'pending' };
      default:
        return {};
    }
  }
}