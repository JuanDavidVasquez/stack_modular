import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ResponseUtil } from '@/shared/utils/response.util';
import { extractTokenFromHeader, getUserFromToken } from '@/shared/utils/jwt.util';
import { LoginData, RegisterData } from '@/shared/interfaces/auth.interface';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // ===== REGISTRO =====

  /**
   * Registrar nuevo usuario
   * POST /auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterData = req.body;
      
      // Validar datos requeridos
      if (!registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
        ResponseUtil.validationError(req, res, 'validation.required');
        return;
      }

      const sessionInfo = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceName: req.body.deviceName,
        deviceType: req.body.deviceType
      };

      const result = await this.authService.register(registerData, sessionInfo);

      ResponseUtil.success(
        req,
        res,
        'messages.created',
        {
          user: result.user,
          session: result.session,
          tokens: result.tokens,
          passwordScore: result.passwordScore
        },
        201
      );
    } catch (error: any) {
      if (error.message.includes('Email already registered')) {
        ResponseUtil.conflict(req, res, 'validation.alreadyExists.text.email');
        return;
      }
      
      if (error.message.includes('Username already taken')) {
        ResponseUtil.conflict(req, res, 'validation.alreadyExists.text.username');
        return;
      }

      if (error.message.includes('Weak password')) {
        ResponseUtil.validationError(req, res, 'validation.invalidType', [error.message]);
        return;
      }

      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  // ===== LOGIN =====

  /**
   * Autenticar usuario
   * POST /auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, rememberMe, deviceName, deviceType } = req.body;

      if (!email || !password) {
        ResponseUtil.validationError(req, res, 'validation.credentials.required');
        return;
      }

      const loginData: LoginData = {
        email,
        password,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceName,
        deviceType,
        rememberMe
      };

      const result = await this.authService.login(loginData);

      ResponseUtil.success(
        req,
        res,
        'messages.loginSuccess',
        {
          user: result.user,
          session: result.session,
          tokens: result.tokens
        }
      );
    } catch (error: any) {
      if (error.message.includes('Invalid credentials')) {
        ResponseUtil.unauthorized(req, res, 'validation.credentials.invalid');
        return;
      }

      if (error.message.includes('Account locked')) {
        ResponseUtil.unauthorized(req, res, 'messages.forbidden');
        return;
      }

      if (error.message.includes('Account is not active')) {
        ResponseUtil.forbidden(req, res, 'messages.forbidden');
        return;
      }

      ResponseUtil.error(req, res, 'messages.loginFailed', 500);
    }
  };

  // ===== LOGOUT =====

  /**
   * Cerrar sesión actual
   * POST /auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenMissing');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData || !tokenData.sessionId) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenInvalid');
        return;
      }

      await this.authService.logout(tokenData.sessionId);

      ResponseUtil.success(req, res, 'messages.logoutSuccess');
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  // ===== REFRESH TOKEN =====

  /**
   * Renovar tokens de autenticación
   * POST /auth/refresh
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        ResponseUtil.validationError(req, res, 'validation.required');
        return;
      }

      const result = await this.authService.refreshTokens(refreshToken);
      if (!result) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenInvalid');
        return;
      }

      ResponseUtil.success(
        req,
        res,
        'messages.updated',
        {
          tokens: result.tokens,
          session: result.session.toSafeObject()
        }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  // ===== PERFIL =====

  /**
   * Obtener perfil del usuario autenticado
   * GET /auth/profile
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenMissing');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenInvalid');
        return;
      }

      const profile = await this.authService.getUserProfile(tokenData.email);
      if (!profile) {
        ResponseUtil.notFound(req, res, 'validation.notFound');
        return;
      }

      ResponseUtil.success(req, res, 'messages.fetched', profile);
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  /**
   * Actualizar perfil del usuario
   * PUT /auth/profile
   */
  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenMissing');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenInvalid');
        return;
      }

      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        timezone: req.body.timezone,
        locale: req.body.locale
      };

      // Filtrar campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const updatedUser = await this.authService.updateProfile(tokenData.email, updateData);

      ResponseUtil.success(req, res, 'messages.updated', updatedUser);
    } catch (error: any) {
      if (error.message === 'User not found') {
        ResponseUtil.notFound(req, res, 'validation.notFound');
        return;
      }
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  // ===== RECUPERACIÓN DE CONTRASEÑA =====

  /**
   * Solicitar reset de contraseña
   * POST /auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        ResponseUtil.validationError(req, res, 'validation.required');
        return;
      }

      const resetToken = await this.authService.requestPasswordReset(email);
      
      // Siempre responder éxito por seguridad (no revelar si el email existe)
      ResponseUtil.success(
        req,
        res,
        'messages.updated',
        { message: 'If the email exists, a reset link will be sent' }
      );
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  /**
   * Reset de contraseña usando token
   * POST /auth/reset-password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        ResponseUtil.validationError(req, res, 'validation.required');
        return;
      }

      const success = await this.authService.resetPassword(token, newPassword);
      
      if (!success) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenInvalid');
        return;
      }

      ResponseUtil.success(req, res, 'messages.updated');
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  // ===== VERIFICACIÓN DE EMAIL =====

  /**
   * Solicitar verificación de email
   * POST /auth/request-verification
   */
  requestVerification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        ResponseUtil.validationError(req, res, 'validation.required');
        return;
      }

      const verificationCode = await this.authService.requestEmailVerification(email);
      
      if (!verificationCode) {
        ResponseUtil.success(req, res, 'messages.updated', { 
          message: 'If the email exists and is not verified, a code will be sent' 
        });
        return;
      }

      ResponseUtil.success(req, res, 'messages.updated');
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  /**
   * Verificar email con código
   * POST /auth/verify-email
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.body;

      if (!code) {
        ResponseUtil.validationError(req, res, 'validation.required');
        return;
      }

      const success = await this.authService.verifyEmail(code);
      
      if (!success) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenInvalid');
        return;
      }

      ResponseUtil.success(req, res, 'messages.updated');
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  // ===== CAMBIO DE CONTRASEÑA =====

  /**
   * Cambiar contraseña del usuario autenticado
   * POST /auth/change-password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenMissing');
        return;
      }

      const tokenData = await getUserFromToken(token);
      if (!tokenData) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenInvalid');
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        ResponseUtil.validationError(req, res, 'validation.required');
        return;
      }

      const success = await this.authService.changePassword(
        tokenData.email,
        currentPassword,
        newPassword
      );

      if (!success) {
        ResponseUtil.unauthorized(req, res, 'validation.credentials.invalid');
        return;
      }

      ResponseUtil.success(req, res, 'messages.updated');
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  // ===== VALIDACIÓN =====

  /**
   * Validar token actual
   * GET /auth/validate
   */
  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = extractTokenFromHeader(req.headers.authorization);
      if (!token) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenMissing');
        return;
      }

      const result = await this.authService.validateToken(token);
      if (!result) {
        ResponseUtil.unauthorized(req, res, 'messages.tokenInvalid');
        return;
      }

      ResponseUtil.success(req, res, 'messages.fetched', {
        user: result.user,
        session: result.session,
        isValid: true
      });
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  // ===== UTILIDADES =====

  /**
   * Validar fortaleza de contraseña
   * POST /auth/validate-password
   */
  validatePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;

      if (!password) {
        ResponseUtil.validationError(req, res, 'validation.required');
        return;
      }

      const validation = this.authService.validatePasswordStrength(password);

      ResponseUtil.success(req, res, 'messages.fetched', validation);
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };

  /**
   * Obtener información del módulo de autenticación
   * GET /auth/info
   */
  getModuleInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const info = this.authService.getModuleInfo();
      const config = await this.authService.checkConfiguration();

      ResponseUtil.success(req, res, 'messages.fetched', {
        ...info,
        configuration: config
      });
    } catch (error) {
      ResponseUtil.error(req, res, 'messages.serverError', 500);
    }
  };
}