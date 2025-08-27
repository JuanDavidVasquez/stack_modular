import { Request, Response, NextFunction } from 'express';

export const validationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    console.log(`[VALIDATION] ${req.method} ${req.originalUrl} | Content-Type: ${req.get('Content-Type')}`);
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');
        if (!contentType?.includes('application/json') && !contentType?.includes('multipart/form-data')) {
            console.log('[VALIDATION] Blocked request due to invalid Content-Type');
            res.status(400).json({
                error: 'Invalid Content-Type',
                message: 'Expected application/json or multipart/form-data',
            });
            return;
        }
    }
    next();
};
