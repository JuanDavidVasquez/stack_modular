import { Request } from "express";
import { SupportedLocale } from "../../locales/i18n.config";

/**
 * Obtener el locale del request
 */
export const getLocale = (req: Request): SupportedLocale => {
    const locale = req.get('X-Language') || req.query.lang || 'es';
    return locale === 'en' || locale === 'es' ? locale : 'es';
};
