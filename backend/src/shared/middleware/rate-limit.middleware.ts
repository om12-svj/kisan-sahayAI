import { Request, Response, NextFunction } from 'express';
import { env } from '../../config';
import { errors } from '../utils/response';

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting middleware
 * In production, use a Redis-based solution like express-rate-limit with rate-limit-redis
 */
export function rateLimit(options?: {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (req: Request) => string;
}) {
    const windowMs = options?.windowMs || env.RATE_LIMIT_WINDOW_MS;
    const maxRequests = options?.maxRequests || env.RATE_LIMIT_MAX_REQUESTS;
    const keyGenerator = options?.keyGenerator || defaultKeyGenerator;

    return (req: Request, res: Response, next: NextFunction): void => {
        const key = keyGenerator(req);
        const now = Date.now();

        const record = requestCounts.get(key);

        if (!record || now > record.resetTime) {
            // Reset or create new record
            requestCounts.set(key, {
                count: 1,
                resetTime: now + windowMs,
            });
            next();
            return;
        }

        if (record.count >= maxRequests) {
            const retryAfter = Math.ceil((record.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfter.toString());
            errors.rateLimited(res);
            return;
        }

        record.count++;
        next();
    };
}

function defaultKeyGenerator(req: Request): string {
    // Use IP address as the key
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
        ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
        : req.ip || req.socket.remoteAddress || 'unknown';
    return `rate-limit:${ip}`;
}

/**
 * Strict rate limiter for auth endpoints
 */
export function authRateLimit() {
    return rateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 5,  // 5 attempts per minute
        keyGenerator: (req) => {
            const ip = req.ip || 'unknown';
            const mobile = req.body?.mobile || '';
            return `auth-rate-limit:${ip}:${mobile}`;
        },
    });
}

/**
 * OTP rate limiter - stricter limits
 */
export function otpRateLimit() {
    return rateLimit({
        windowMs: 3600000, // 1 hour
        maxRequests: 3,    // 3 OTP requests per hour
        keyGenerator: (req) => {
            const mobile = req.body?.mobile || 'unknown';
            return `otp-rate-limit:${mobile}`;
        },
    });
}

// Cleanup old records periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetTime) {
            requestCounts.delete(key);
        }
    }
}, 60000); // Clean up every minute
