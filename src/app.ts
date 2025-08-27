// src/app.ts - Configuración de la aplicación Express
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Configuraciones
import { envConfig } from '@config/env.config';

// Middlewares globales
import { errorMiddleware } from '@core/middleware/error.middleware';
import { authMiddleware } from '@core/middleware/auth.middleware';
import { validationMiddleware } from '@core/middleware/validation.middleware';
import { i18nMiddleware } from '@core/middleware/i18n.middleware';

// Utilidades
import { logger } from '@core/utils/logger';

export function createApp(): Application {
  const app: Application = express();

  // ===== CONFIGURACIÓN BÁSICA =====
  
  // Trust proxy (importante para rate limiting y IPs reales)
  app.set('trust proxy', 1);
  
  // Disable powered by Express header (seguridad)
  app.disable('x-powered-by');

  // ===== MIDDLEWARES DE SEGURIDAD =====
  
  // Helmet - Configuración de headers de seguridad
  app.use(helmet({
    contentSecurityPolicy: envConfig.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS - Configuración de Cross-Origin Resource Sharing
  app.use(cors({
    origin: envConfig.cors.origin,
    credentials: envConfig.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'X-File-Name'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 horas
  }));

  // Rate Limiting - Protección contra ataques de fuerza bruta
  const limiter = rateLimit({
    windowMs: envConfig.rateLimit.windowMs,
    max: envConfig.rateLimit.max,
    message: {
      error: 'Too Many Requests',
      message: envConfig.rateLimit.message,
      retryAfter: Math.ceil(envConfig.rateLimit.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Rate limiting más estricto para rutas de autenticación
    skip: (req: Request) => {
      // Skip rate limiting en desarrollo para facilitar testing
      if (envConfig.isDevelopment) return false;
      return false;
    }
  });
  
  // Aplicar rate limiting
  app.use('/api/', limiter);
  
  // Rate limiting más estricto para auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: envConfig.isDevelopment ? 100 : 10, // 10 intentos en producción, 100 en desarrollo
    message: {
      error: 'Too Many Login Attempts',
      message: 'Too many authentication attempts from this IP, please try again later',
      retryAfter: 900, // 15 minutos
    },
    skipSuccessfulRequests: true,
  });
  
  app.use('/api/auth', authLimiter);

  // ===== MIDDLEWARES DE PARSING =====
  
  // Compression - Compresión gzip
  app.use(compression({
    level: envConfig.isProduction ? 6 : 1,
    threshold: 1024, // Solo comprimir respuestas > 1KB
  }));

  // Body parsing
  app.use(express.json({ 
    limit: '10mb',
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Cookie parsing
  app.use(cookieParser());

  // ===== MIDDLEWARES PERSONALIZADOS =====
  
  // Request logging (solo en desarrollo)
  if (envConfig.isDevelopment) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logMessage = `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
        
        if (res.statusCode >= 400) {
          logger.warn(logMessage);
        } else {
          logger.info(logMessage);
        }
      });
      
      next();
    });
  }

  // Middleware de internacionalización
  app.use(i18nMiddleware);

  // Request ID middleware (útil para debugging)
  app.use((req: any, res: Response, next: NextFunction) => {
    req.id = Math.random().toString(36).substring(2, 15);
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // ===== RUTAS ESPECIALES =====
  
  // Health check simple (antes de las rutas principales)
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: envConfig.nodeEnv,
      version: '1.0.0',
    });
  });

  // Ping endpoint
  app.get('/ping', (req: Request, res: Response) => {
    res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  // ===== MIDDLEWARE DE VALIDACIÓN =====
  
  // Aplicar validación a rutas API
  app.use('/api', validationMiddleware);

  // ===== RUTAS ESTÁTICAS (SI LAS HAY) =====
  
  // Servir archivos estáticos si existe la carpeta public
  if (envConfig.isDevelopment) {
    app.use('/static', express.static('public', {
      maxAge: '1d',
      etag: false
    }));
  }

  // ===== MIDDLEWARE DE MANEJO DE 404 =====
  
  app.use('*', (req: Request, res: Response, next: NextFunction) => {
    const error = {
      status: 404,
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
    
    logger.warn(`404 - ${req.method} ${req.originalUrl}`);
    
    res.status(404).json({
      error: 'Not Found',
      ...error,
    });
  });

  // ===== MIDDLEWARE DE MANEJO DE ERRORES =====
  
  // Debe ser el último middleware
  app.use(errorMiddleware);

  // ===== INFORMACIÓN DE DEBUG =====
  
  if (envConfig.isDevelopment) {
    console.log('📦 Express app configured with:');
    console.log(`   🛡️  Security: Helmet, CORS, Rate Limiting`);
    console.log(`   📦 Parsing: JSON, URL-encoded, Cookies`);
    console.log(`   🗜️  Compression: ${envConfig.isProduction ? 'Level 6' : 'Level 1'}`);
    console.log(`   🌍 i18n: Enabled`);
    console.log(`   📊 Logging: Development mode`);
    console.log(`   ⚡ Rate Limiting: ${envConfig.rateLimit.max} requests per ${envConfig.rateLimit.windowMs / 1000}s`);
  }

  return app;
}

// ===== TIPOS PARA REQUEST EXTENDIDO =====

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
      rawBody?: Buffer;
    }
  }
}