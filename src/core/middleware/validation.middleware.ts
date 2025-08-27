import { Request, Response, NextFunction } from 'express';

export const validationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Validación básica del content-type para POSTs
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (!contentType?.includes('application/json') && !contentType?.includes('multipart/form-data')) {
            return res.status(400).json({
                error: 'Invalid Content-Type',
                message: 'Expected application/json or multipart/form-data',
            });
        }
    }

    next();
};