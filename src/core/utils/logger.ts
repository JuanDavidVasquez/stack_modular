import winston from 'winston';
import { envConfig } from '@config/env.config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: envConfig.logging.level,
  format: logFormat,
  defaultMeta: { service: 'api-main' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: envConfig.isDevelopment 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : logFormat
    }),
    
    // File transport (solo si existe la carpeta logs)
    ...(envConfig.isDevelopment ? [] : [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ]),
  ],
});