// src/core/middleware/validationShema.middleware.ts
import { ValidationOptions } from '@/shared/interfaces/validationOptions.interface';
import { ResponseUtil } from '@/shared/utils/response.util';
import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { getLocale } from '@/shared/utils/getLocale.util';
import { SupportedLocale } from '@/locales/i18n.config';

type SchemaFactory = (locale: SupportedLocale) => ZodSchema;

export const schemaValidation = (
    schemaOrFactory: ZodSchema | SchemaFactory,
    options: ValidationOptions = {}
) => {
    const { target = 'body' } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targets = Array.isArray(target) ? target : [target];

            // 1. Obtener locale desde request (aceptando "Accept-Language", query.)
            const locale = getLocale(req);

            // 2. Si el schema es una función, lo ejecutamos pasando el locale
            const schema =
                typeof schemaOrFactory === "function"
                    ? schemaOrFactory(locale)
                    : schemaOrFactory;

            for (const t of targets) {
                const dataToValidate = req[t];
                const validated = await schema.parseAsync(dataToValidate);
                req[t] = validated;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                ResponseUtil.error(
                    req,
                    res,
                    'common.errors.validation',
                    400,
                    undefined,
                    undefined,
                    formattedErrors
                );
                return;
            }

            next(error);
        }
    };
};

// Helpers
export const validateBody = (schema: ZodSchema | SchemaFactory) =>
    schemaValidation(schema, { target: 'body' });

export const validateQuery = (schema: ZodSchema | SchemaFactory) =>
    schemaValidation(schema, { target: 'query' });

export const validateParams = (schema: ZodSchema | SchemaFactory) =>
    schemaValidation(schema, { target: 'params' });
