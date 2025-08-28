import * as bcrypt from 'bcrypt';

export interface IBcryptAdapter {
  hash(password: string, saltRounds?: number): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
  generateSalt(rounds?: number): Promise<string>;
  hashSync(password: string, saltRounds?: number): string;
  compareSync(password: string, hashedPassword: string): boolean;
}

export class BcryptAdapter implements IBcryptAdapter {
  private readonly defaultSaltRounds: number;

  constructor(saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10)) {
    this.defaultSaltRounds = saltRounds;
  }

  /**
   * Hash de password de forma asíncrona
   */
  async hash(password: string, saltRounds?: number): Promise<string> {
    const rounds = saltRounds || this.defaultSaltRounds;
    return await bcrypt.hash(password, rounds);
  }

  /**
   * Comparar password con hash de forma asíncrona
   */
  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generar salt de forma asíncrona
   */
  async generateSalt(rounds?: number): Promise<string> {
    const saltRounds = rounds || this.defaultSaltRounds;
    return await bcrypt.genSalt(saltRounds);
  }

  /**
   * Hash de password de forma síncrona (menos recomendado)
   */
  hashSync(password: string, saltRounds?: number): string {
    const rounds = saltRounds || this.defaultSaltRounds;
    return bcrypt.hashSync(password, rounds);
  }

  /**
   * Comparar password con hash de forma síncrona (menos recomendado)
   */
  compareSync(password: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(password, hashedPassword);
  }

  /**
   * Validar fortaleza de password
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Longitud mínima
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Contiene mayúsculas
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Contiene minúsculas
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Contiene números
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Contiene caracteres especiales
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // No contiene espacios
    if (/\s/.test(password)) {
      errors.push('Password cannot contain spaces');
      score -= 1;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.max(0, Math.min(5, score))
    };
  }

  /**
   * Verificar si una password necesita ser rehash (por cambio de salt rounds)
   */
  needsRehash(hashedPassword: string, saltRounds?: number): boolean {
    const targetRounds = saltRounds || this.defaultSaltRounds;
    
    try {
      // Extraer rounds del hash existente
      const currentRounds = bcrypt.getRounds(hashedPassword);
      return currentRounds !== targetRounds;
    } catch {
      // Si no se puede obtener rounds, asumir que necesita rehash
      return true;
    }
  }

  /**
   * Generar password temporal segura
   */
  generateTemporaryPassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    const allChars = uppercase + lowercase + numbers + special;
    
    // Garantizar al menos un carácter de cada tipo
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Completar el resto de forma aleatoria
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  /**
   * Obtener información del hash (para debugging/auditoría)
   */
  getHashInfo(hashedPassword: string): {
    algorithm: string;
    rounds: number;
    isValid: boolean;
  } {
    try {
      const rounds = bcrypt.getRounds(hashedPassword);
      return {
        algorithm: 'bcrypt',
        rounds,
        isValid: true
      };
    } catch {
      return {
        algorithm: 'unknown',
        rounds: 0,
        isValid: false
      };
    }
  }
}