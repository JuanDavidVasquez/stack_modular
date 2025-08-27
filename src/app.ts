// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Configuraciones
import { envConfig } from './core/config/env.config';

// Middlewares globales
import { validationMiddleware } from './core/middleware/validation.middleware';
import { i18nMiddleware } from './core/middleware/i18n.middleware';

// Utilidades
import { logger } from './core/utils/logger';

export function createApp(): Application {
  const app: Application = express();

  // ===== CONFIGURACIÓN BÁSICA =====
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // ===== MIDDLEWARES DE SEGURIDAD =====
  app.use(helmet({
    contentSecurityPolicy: envConfig.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

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
      'X-File-Name',
      'X-Language'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,
  }));

  // ===== RATE LIMITING =====
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
    skip: () => false
  });
  app.use('/api/', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: envConfig.isDevelopment ? 100 : 10,
    message: {
      error: 'Too Many Login Attempts',
      message: 'Too many authentication attempts from this IP, please try again later',
      retryAfter: 900,
    },
    skipSuccessfulRequests: true,
  });
  app.use('/api/auth', authLimiter);

  // ===== PARSING =====
  app.use(compression({ level: envConfig.isProduction ? 6 : 1, threshold: 1024 }));
  app.use(express.json({ 
    limit: '10mb',
    verify: (req: any, res, buf) => { req.rawBody = buf; }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ===== MIDDLEWARES PERSONALIZADOS =====
  if (envConfig.isDevelopment) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logMessage = `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
        if (res.statusCode >= 400) logger.warn(logMessage);
        else logger.info(logMessage);
      });
      next();
    });
  }

  app.use(i18nMiddleware);

  app.use((req: any, res: Response, next: NextFunction) => {
    req.id = Math.random().toString(36).substring(2, 15);
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  // ===== ENDPOINTS ESPECIALES (NO MÓDULOS) =====
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

  app.get('/ping', (req: Request, res: Response) => {
    res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  // ===== VALIDATION MIDDLEWARE =====
  app.use('/api', validationMiddleware);
  console.log('📦 Validation middleware applied to /api routes');

  // ===== STATIC FILES =====
  if (envConfig.isDevelopment) {
    app.use('/static', express.static('public', {
      maxAge: '1d',
      etag: false
    }));
  }

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
