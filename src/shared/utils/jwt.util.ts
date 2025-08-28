
import { JwtAdapter } from '@/core/adapters/lib/jwt.adapter';
import { SignOptions, JwtPayload } from 'jsonwebtoken';

// Crear una instancia singleton del adaptador
const jwtAdapter = new JwtAdapter();

/**
 * Genera un token JWT
 * @param payload - Datos a incluir en el token
 * @param options - Opciones adicionales para el token
 * @returns Promise con el token generado
 */
export const generateToken = async (
  payload: object, 
  options?: SignOptions
): Promise<string> => {
  return await jwtAdapter.sign(payload, options);
};

/**
 * Verifica y decodifica un token JWT
 * @param token - Token JWT a verificar
 * @returns Promise con el payload decodificado
 */
export const verifyToken = async <T extends object = JwtPayload>(
  token: string
): Promise<T> => {
  return await jwtAdapter.verify<T>(token);
};

/**
 * Decodifica un token JWT sin verificar su validez
 * @param token - Token JWT a decodificar
 * @returns Payload decodificado o null si el token es inválido
 */
export const decodeToken = <T extends object = JwtPayload>(
  token: string
): T | null => {
  return jwtAdapter.decode<T>(token);
};

/**
 * Genera un token de acceso con payload específico para usuarios
 * @param userId - ID del usuario
 * @param sessionId - ID de la sesión
 * @param email - Email del usuario
 * @param authEntity - Entidad de autenticación (user, admin, vendor, etc.)
 * @param role - Rol del usuario (opcional)
 * @returns Promise con el token generado
 */
export const generateAccessToken = async (
  userId: string,
  sessionId: string, 
  email: string,
  authEntity: string,
  role?: string
): Promise<string> => {
  const payload = {
    sub: userId,
    sessionId,
    email,
    authEntity,
    ...(role && { role }),
    type: 'access'
  };
  
  return await generateToken(payload, { expiresIn: '1h' });
};

/**
 * Genera un token de refresh con duración extendida
 * @param userId - ID del usuario
 * @param sessionId - ID de la sesión
 * @param authEntity - Entidad de autenticación
 * @returns Promise con el token de refresh
 */
export const generateRefreshToken = async (
  userId: string, 
  sessionId: string,
  authEntity: string
): Promise<string> => {
  const payload = {
    sub: userId,
    sessionId,
    authEntity,
    type: 'refresh'
  };
  
  return await generateToken(payload, { expiresIn: '7d' });
};

/**
 * Genera ambos tokens para una sesión
 * @param userId - ID del usuario
 * @param sessionId - ID de la sesión
 * @param email - Email del usuario
 * @param authEntity - Entidad de autenticación
 * @param role - Rol del usuario (opcional)
 * @returns Promise con ambos tokens y sus fechas de expiración
 */
export const generateSessionTokens = async (
  userId: string,
  sessionId: string,
  email: string,
  authEntity: string,
  role?: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: Date;
  refreshTokenExpires: Date;
}> => {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(userId, sessionId, email, authEntity, role),
    generateRefreshToken(userId, sessionId, authEntity)
  ]);

  return {
    accessToken,
    refreshToken,
    accessTokenExpires: new Date(Date.now() + 3600000), // 1 hora
    refreshTokenExpires: new Date(Date.now() + 7 * 24 * 3600000) // 7 días
  };
};

/**
 * Extrae el token del header Authorization
 * @param authHeader - Header Authorization (Bearer token)
 * @returns Token extraído o null si no es válido
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};

/**
 * Verifica si un token ha expirado
 * @param token - Token JWT a verificar
 * @returns true si el token ha expirado, false en caso contrario
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded !== 'object' || !('exp' in decoded)) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return (decoded as any).exp < currentTime;
  } catch {
    return true;
  }
};

/**
 * Obtiene información del usuario y sesión desde un token válido
 * @param token - Token JWT verificado
 * @returns Información del usuario y sesión o null si el token es inválido
 */
export const getUserFromToken = async (token: string) => {
  try {
    const payload = await verifyToken(token);
    return {
      userId: (payload as any).sub,
      sessionId: (payload as any).sessionId,
      email: (payload as any).email,
      authEntity: (payload as any).authEntity,
      role: (payload as any).role,
      type: (payload as any).type
    };
  } catch {
    return null;
  }
};

/**
 * Verifica que un token pertenezca a una sesión específica y entidad
 * @param token - Token JWT a verificar
 * @param sessionId - ID de la sesión esperada
 * @param authEntity - Entidad de autenticación esperada
 * @returns true si el token pertenece a la sesión y entidad, false en caso contrario
 */
export const verifyTokenSessionAndEntity = async (
  token: string, 
  sessionId: string, 
  authEntity: string
): Promise<boolean> => {
  try {
    const payload = await verifyToken(token);
    return (payload as any).sessionId === sessionId && (payload as any).authEntity === authEntity;
  } catch {
    return false;
  }
};