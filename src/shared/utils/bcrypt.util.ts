import { BcryptAdapter } from "@/core/adapters/lib/bcrypt.adapter";


// Crear una instancia singleton del adaptador
const bcryptAdapter = new BcryptAdapter();

/**
 * Hash de password
 * @param password - Password en texto plano
 * @param saltRounds - Número de rounds para el salt (opcional)
 * @returns Promise con el hash generado
 */
export const hashPassword = async (password: string, saltRounds?: number): Promise<string> => {
  return await bcryptAdapter.hash(password, saltRounds);
};

/**
 * Comparar password con hash
 * @param password - Password en texto plano
 * @param hashedPassword - Hash almacenado
 * @returns Promise<boolean> indicando si coinciden
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcryptAdapter.compare(password, hashedPassword);
};

/**
 * Validar fortaleza de password
 * @param password - Password a validar
 * @returns Objeto con validación y errores
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} => {
  return bcryptAdapter.validatePasswordStrength(password);
};

/**
 * Generar password temporal segura
 * @param length - Longitud de la password (default: 12)
 * @returns Password temporal generada
 */
export const generateTemporaryPassword = (length: number = 12): string => {
  return bcryptAdapter.generateTemporaryPassword(length);
};

/**
 * Verificar si un hash necesita ser actualizado
 * @param hashedPassword - Hash actual
 * @param saltRounds - Rounds objetivo (opcional)
 * @returns boolean indicando si necesita rehash
 */
export const needsPasswordRehash = (hashedPassword: string, saltRounds?: number): boolean => {
  return bcryptAdapter.needsRehash(hashedPassword, saltRounds);
};

/**
 * Obtener información del hash para auditoría
 * @param hashedPassword - Hash a analizar
 * @returns Información del algoritmo y rounds
 */
export const getHashInfo = (hashedPassword: string): {
  algorithm: string;
  rounds: number;
  isValid: boolean;
} => {
  return bcryptAdapter.getHashInfo(hashedPassword);
};

/**
 * Generar salt personalizado
 * @param rounds - Número de rounds para el salt
 * @returns Promise con el salt generado
 */
export const generateSalt = async (rounds?: number): Promise<string> => {
  return await bcryptAdapter.generateSalt(rounds);
};