import { Response, NextFunction } from 'express';
import { prisma } from '../../config';
import { AuthenticatedRequest } from '../types';
import { verifyAccessToken, extractBearerToken } from '../utils/jwt';
import { errors } from '../utils/response';

/**
 * Authentication middleware - verifies JWT and attaches user to request
 */
export async function authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = extractBearerToken(req.headers.authorization);

        if (!token) {
            errors.unauthorized(res, 'No token provided');
            return;
        }

        const payload = verifyAccessToken(token);

        req.user = {
            id: payload.sub,
            type: payload.type,
            role: payload.role,
        };

        // Optionally load full user object
        if (payload.type === 'farmer') {
            const farmer = await prisma.farmer.findUnique({
                where: { id: payload.sub },
            });

            if (!farmer) {
                errors.unauthorized(res, 'User not found');
                return;
            }

            req.farmer = farmer;
        } else if (payload.type === 'admin') {
            const admin = await prisma.adminUser.findUnique({
                where: { id: payload.sub },
            });

            if (!admin || !admin.isActive) {
                errors.unauthorized(res, 'Admin not found or inactive');
                return;
            }

            req.admin = admin;
        }

        next();
    } catch (error) {
        if ((error as Error).name === 'TokenExpiredError') {
            errors.unauthorized(res, 'Token has expired');
            return;
        }
        if ((error as Error).name === 'JsonWebTokenError') {
            errors.unauthorized(res, 'Invalid token');
            return;
        }
        next(error);
    }
}

/**
 * Optional authentication - attaches user if token is valid, but doesn't fail
 */
export async function optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const token = extractBearerToken(req.headers.authorization);

        if (!token) {
            return next();
        }

        const payload = verifyAccessToken(token);

        req.user = {
            id: payload.sub,
            type: payload.type,
            role: payload.role,
        };

        next();
    } catch {
        // Token is invalid, but we continue without authentication
        next();
    }
}

/**
 * Authorization middleware - requires specific roles
 */
export function requireRole(...allowedRoles: string[]) {
    return (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): void => {
        if (!req.user) {
            errors.unauthorized(res);
            return;
        }

        if (req.user.type !== 'admin') {
            errors.forbidden(res, 'Admin access required');
            return;
        }

        if (!req.user.role || !allowedRoles.includes(req.user.role)) {
            errors.forbidden(res, `Required roles: ${allowedRoles.join(', ')}`);
            return;
        }

        next();
    };
}

/**
 * Farmer-only middleware
 */
export function farmerOnly(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    if (!req.user || req.user.type !== 'farmer') {
        errors.forbidden(res, 'Farmer access only');
        return;
    }
    next();
}

/**
 * Admin-only middleware
 */
export function adminOnly(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    if (!req.user || req.user.type !== 'admin') {
        errors.forbidden(res, 'Admin access only');
        return;
    }
    next();
}

// Convenience aliases
export const requireAuth = authenticate;
export const requireAdmin = adminOnly;
