import { envConfig } from '../config/env.config';

/**
 * Logger simple para la aplicación
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = envConfig.isDevelopment;
  }

  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();