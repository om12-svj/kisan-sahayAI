import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, ApiError, ErrorCode, PaginatedResponse } from '../types';

/**
 * Send a success response
 */
export function sendSuccess<T>(
    res: Response,
    data: T,
    statusCode: number = 200
): Response {
    const response: ApiResponse<T> = {
        success: true,
        data,
        meta: {
            requestId: (res.req as any).requestId || uuidv4(),
            timestamp: new Date().toISOString(),
        },
    };

    return res.status(statusCode).json(response);
}

/**
 * Send a paginated success response
 */
export function sendPaginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number
): Response {
    const totalPages = Math.ceil(total / limit);

    const data: PaginatedResponse<T> = {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        },
    };

    return sendSuccess(res, data);
}

/**
 * Send an error response
 */
export function sendError(
    res: Response,
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Array<{ field: string; message: string }>
): Response {
    const error: ApiError = {
        code,
        message,
        ...(details && { details }),
    };

    const response: ApiResponse = {
        success: false,
        error,
        meta: {
            requestId: (res.req as any).requestId || uuidv4(),
            timestamp: new Date().toISOString(),
        },
    };

    return res.status(statusCode).json(response);
}

/**
 * Common error responses
 */
export const errors = {
    unauthorized: (res: Response, message: string = 'Unauthorized') =>
        sendError(res, 'UNAUTHORIZED', message, 401),

    forbidden: (res: Response, message: string = 'Forbidden') =>
        sendError(res, 'FORBIDDEN', message, 403),

    notFound: (res: Response, resource: string = 'Resource') =>
        sendError(res, 'NOT_FOUND', `${resource} not found`, 404),

    validation: (res: Response, details: Array<{ field: string; message: string }>) =>
        sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, details),

    internal: (res: Response, message: string = 'Internal server error') =>
        sendError(res, 'INTERNAL_ERROR', message, 500),

    rateLimited: (res: Response) =>
        sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later', 429),
};

/**
 * Helper function for success response with optional message
 */
export function successResponse<T>(
    res: Response,
    data: T,
    message?: string
): Response {
    return sendSuccess(res, message ? { ...data as object, message } : data);
}

/**
 * Helper function for created response (201)
 */
export function createdResponse<T>(
    res: Response,
    data: T,
    message?: string
): Response {
    return sendSuccess(res, message ? { ...data as object, message } : data, 201);
}
