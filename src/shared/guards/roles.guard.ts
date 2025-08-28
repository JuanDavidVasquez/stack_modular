import { Request, Response, NextFunction } from "express";
import { ForbiddenException } from "../exceptions/ForbiddenException";
import { SupportedLocale, t } from "@/locales/i18n.config";
import { getLocale } from "../utils/getLocale.util";

export function roleGuard(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const locale: SupportedLocale = getLocale(req);

    if (!user || !allowedRoles.includes(user.role)) {
      return next(new ForbiddenException(t("auth.permissions.accessDenied", locale)));
    }

    next();
  };
}
