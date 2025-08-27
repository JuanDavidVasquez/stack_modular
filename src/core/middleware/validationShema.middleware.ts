import { ValidationOptions } from '@/shared/interfaces/validationOptions.interface';
import { ResponseUtil } from '@/shared/utils/response.util';
import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';



export const schemaValidation = (
    schema: ZodSchema,
    options: ValidationOptions = {}
) => {
    const {
        target = 'body',
        stripUnknown = true
    } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targets = Array.isArray(target) ? target : [target];

            // Validar cada target especificado
            for (const t of targets) {
                const dataToValidate = req[t];

                // Parsear y validar
                const validated = await schema.parseAsync(dataToValidate);
                // Reemplazar el contenido original con el validado
                req[t] = validated;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Formatear errores de Zod de manera legible
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                ResponseUtil.error(
                    req,
                    res,
                    'error.validation',
                    400,
                    undefined,
                    undefined,
                    formattedErrors
                );
            }

            // Si no es un error de Zod, pasar al siguiente error handler
            next(error);
        }
    };
};

// Versión simplificada solo para body
export const validateBody = (schema: ZodSchema) =>
    schemaValidation(schema, { target: 'body' });

// Versión simplificada para query params
export const validateQuery = (schema: ZodSchema) =>
    schemaValidation(schema, { target: 'query' });

// Versión simplificada para route params
export const validateParams = (schema: ZodSchema) =>
    schemaValidation(schema, { target: 'params' });