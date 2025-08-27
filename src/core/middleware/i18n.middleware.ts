import { Request, Response, NextFunction } from 'express';

export const i18nMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Detectar idioma del header Accept-Language o query param
  const lang = req.query.lang as string || 
               req.get('Accept-Language')?.substring(0, 2) || 
               'en';
  
  // Almacenar idioma en request para uso posterior
  (req as any).language = ['en', 'es'].includes(lang) ? lang : 'en';
  
  next();
};