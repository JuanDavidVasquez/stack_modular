import { Request, Response, NextFunction } from "express";
import { UnauthorizedException } from "@/shared/exceptions/UnauthorizedException";
import { SupportedLocale, t } from "@/locales/i18n.config";
import { getLocale } from "../utils/getLocale.util";
import { extractTokenFromHeader } from "@/shared/utils/jwt.util";

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const locale: SupportedLocale = getLocale(req);
    const token = extractTokenFromHeader(req.headers.authorization);

    console.log("Extracted Token:", token);
    
    if (!token) {
      throw new UnauthorizedException(t("auth.sessions.errors.tokenRequired", locale));
    }

    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET!);

    (req as any).user = payload;

    next();
} catch (error: any) {
  const locale: SupportedLocale = getLocale(req);
  
  if (error.name === 'TokenExpiredError') {
    return next(new UnauthorizedException(t("auth.sessions.errors.tokenExpired", locale)));
  }
  if (error.name === 'JsonWebTokenError') {
    return next(new UnauthorizedException(t("auth.sessions.errors.invalidToken", locale)));
  }

  return next(new UnauthorizedException(t("auth.errors.unauthorized", locale)));
}
}