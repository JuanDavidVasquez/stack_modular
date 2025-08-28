import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedException } from "@/shared/exceptions/UnauthorizedException";
import { SupportedLocale, t } from "@/locales/i18n.config";
import { getLocale } from "../utils/getLocale.util";

export function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers["authorization"];
    const locale: SupportedLocale = getLocale(req);

    if (!authHeader) throw new UnauthorizedException(t("auth.messages.tokenMissing", locale));

    const token = authHeader.split(" ")[1];
    if (!token) throw new UnauthorizedException(t("auth.messages.tokenInvalid", locale));

    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = payload; // attach user to request

    next();
  } catch (error) {
    next(new UnauthorizedException(t("auth.messages.tokenInvalid", getLocale(req))));
  }
}
