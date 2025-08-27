import { Request, Response, NextFunction } from 'express';
import { envConfig } from '@config/env.config';
import { logger } from '@core/utils/logger';

export const errorMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error
  logger.error('Error caught by middleware:', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Respuesta según entorno
  const errorResponse = {
    error: error.name || 'Internal Server Error',
    message: error.message || 'Something went wrong',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(envConfig.isDevelopment && { stack: error.stack }),
  };

  const statusCode = error.statusCode || error.status || 500;
  res.status(statusCode).json(errorResponse);
};