import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { errors } from '../utils/response';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = schema.parse(req[source]);
            req[source] = data; // Replace with parsed/sanitized data
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const details = error.issues.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                errors.validation(res, details);
                return;
            }
            next(error);
        }
    };
}

/**
 * Validate multiple sources at once
 */
export function validateRequest(schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const allDetails: Array<{ field: string; message: string }> = [];

        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                allDetails.push(...error.issues.map((e) => ({
                    field: `body.${e.path.join('.')}`,
                    message: e.message,
                })));
            }
        }

        try {
            if (schemas.query) {
                req.query = schemas.query.parse(req.query) as any;
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                allDetails.push(...error.issues.map((e) => ({
                    field: `query.${e.path.join('.')}`,
                    message: e.message,
                })));
            }
        }

        try {
            if (schemas.params) {
                req.params = schemas.params.parse(req.params) as any;
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                allDetails.push(...error.issues.map((e) => ({
                    field: `params.${e.path.join('.')}`,
                    message: e.message,
                })));
            }
        }

        if (allDetails.length > 0) {
            errors.validation(res, allDetails);
            return;
        }

        next();
    };
}
