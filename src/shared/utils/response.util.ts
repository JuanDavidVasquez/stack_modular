import { Request, Response } from "express";
import { SupportedLocale } from "@/locales/i18n.config";

export class ResponseUtil {
    private getLocale(req: Request): SupportedLocale {
        const locale = req.get('X-Language') || req.query.lang || 'es';
        return (locale === 'en' || locale === 'es') ? locale : 'es';
    }

    static success(
        req: Request,
        res: Response,
        messageKey: string,
        data?: any,
        code: number = 200,
        meta?: any,
        headers?: Record<string, string>
    ): Response {
        // Set custom headers si existen
        if (headers) {
            Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
        }

        const locale = new ResponseUtil().getLocale(req);
        return res.status(code).json({
            status: 'success',
            message: messageKey,
            data,
            meta
        });
    }

    static error(
        req: Request,
        res: Response,
        messageKey: string,
        code: number = 500,
        data?: any,
        meta?: any,
        errors?: any[],
        headers?: Record<string, string>
    ): Response {
        // Set custom headers si existen
        if (headers) {
            Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
        }

        const locale = new ResponseUtil().getLocale(req);
        return res.status(code).json({
            status: 'error',
            message: messageKey,
            data,
            meta,
            errors
        });
    }
}
