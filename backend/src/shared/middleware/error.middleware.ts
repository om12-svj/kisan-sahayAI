import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { env } from '../../config';
import { sendError, errors } from '../utils/response';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: Array<{ field: string; message: string }>
    ) {
        super(message);
        this.name = 'ApiError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    const requestId = uuidv4();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}

/**
 * Error handler middleware - centralized error handling
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error(`[${(req as any).requestId}] Error:`, err);

    // Handle Zod validation errors
    if (err instanceof z.ZodError) {
        const details = err.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        errors.validation(res, details);
        return;
    }

    // Handle custom API errors
    if (err instanceof ApiError) {
        sendError(res, err.code as any, err.message, err.statusCode, err.details);
        return;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        sendError(res, 'TOKEN_INVALID', 'Invalid token', 401);
        return;
    }

    if (err.name === 'TokenExpiredError') {
        sendError(res, 'TOKEN_EXPIRED', 'Token has expired', 401);
        return;
    }

    // Handle Prisma errors
    if (err.constructor.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;
        if (prismaError.code === 'P2002') {
            const field = prismaError.meta?.target?.[0] || 'field';
            sendError(res, 'ALREADY_EXISTS', `${field} already exists`, 409);
            return;
        }
        if (prismaError.code === 'P2025') {
            sendError(res, 'NOT_FOUND', 'Record not found', 404);
            return;
        }
    }

    // Default error response
    const message = env.isDevelopment ? err.message : 'Internal server error';
    errors.internal(res, message);
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
    errors.notFound(res, `Route ${req.method} ${req.path}`);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
