import { Request, Response } from "express";
import { t, SupportedLocale } from "@/locales/i18n.config";
import { getLocale } from "@/shared/utils/getLocale.util";

export class ResponseUtil {
    /**
     * Respuesta exitosa estandarizada
     */
    static success(
        req: Request,
        res: Response,
        messageKey: string,
        data?: any,
        code: number = 200,
        meta?: any,
        headers?: Record<string, string>
    ): Response {
        const locale: SupportedLocale = getLocale(req);

        // Set custom headers si existen
        if (headers) {
            Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
        }

        return res.status(code).json({
            status: 'success',
            message: t(messageKey, locale),
            data,
            meta
        });
    }

    /**
     * Respuesta de error estandarizada
     */
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
        const locale: SupportedLocale = getLocale(req);

        // Set custom headers si existen
        if (headers) {
            Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
        }

        return res.status(code).json({
            status: 'error',
            message: t(messageKey, locale),
            data,
            meta,
            errors
        });
    }

    /**
     * Respuesta de validación con errores específicos
     */
    static validationError(
        req: Request,
        res: Response,
        messageKey: string = 'common.errors.validation',
        validationErrors: any[] = [],
        code: number = 400
    ): Response {
        const locale: SupportedLocale = getLocale(req);

        return res.status(code).json({
            status: 'error',
            message: t(messageKey, locale),
            errors: validationErrors
        });
    }

    /**
     * Respuesta de recurso no encontrado
     */
    static notFound(
        req: Request,
        res: Response,
        messageKey: string = 'common.errors.notFound'
    ): Response {
        const locale: SupportedLocale = getLocale(req);

        return res.status(404).json({
            status: 'error',
            message: t(messageKey, locale)
        });
    }

    /**
     * Respuesta de conflicto (recurso ya existe)
     */
    static conflict(
        req: Request,
        res: Response,
        messageKey: string = 'common.errors.conflict'
    ): Response {
        const locale: SupportedLocale = getLocale(req);

        return res.status(409).json({
            status: 'error',
            message: t(messageKey, locale)
        });
    }

    /**
     * Respuesta de no autorizado
     */
    static unauthorized(
        req: Request,
        res: Response,
        messageKey: string = 'common.errors.unauthorized'
    ): Response {
        const locale: SupportedLocale = getLocale(req);

        return res.status(401).json({
            status: 'error',
            message: t(messageKey, locale)
        });
    }

    /**
     * Respuesta de prohibido
     */
    static forbidden(
        req: Request,
        res: Response,
        messageKey: string = 'common.errors.forbidden'
    ): Response {
        const locale: SupportedLocale = getLocale(req);

        return res.status(403).json({
            status: 'error',
            message: t(messageKey, locale)
        });
    }

    /**
     * Respuesta con paginación
     */
    static paginated(
        req: Request,
        res: Response,
        messageKey: string,
        data: any[],
        rows: number,
        page: number,
        limit: number,
        code: number = 200
    ): Response {
        const locale: SupportedLocale = getLocale(req);
        const totalPages = Math.ceil(rows / limit);
        const newPage = page+1;

        return res.status(code).json({
            status: 'success',
            message: t(messageKey, locale),
            data,
            meta: {
                pagination: {
                    page:newPage,
                    limit,
                    rows,
                    totalPages,
                    hasNext: page < totalPages - 1,
                    hasPrevious: page > 0
                }
            }
        });
    }
}