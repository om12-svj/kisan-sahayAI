import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config';
import { JWTPayload, TokenPair } from '../types';

/**
 * Generate an access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY,
    } as jwt.SignOptions);
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY,
    } as jwt.SignOptions);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, type: 'farmer' | 'admin', role?: string): TokenPair {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
        sub: userId,
        type,
        ...(role && { role }),
    };

    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
}

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate expiry date from JWT expiry string
 */
export function calculateExpiryDate(expiryString: string): Date {
    const match = expiryString.match(/^(\d+)([smhdw])$/);
    if (!match) {
        throw new Error(`Invalid expiry format: ${expiryString}`);
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);
    const now = new Date();

    switch (unit) {
        case 's': // seconds
            now.setSeconds(now.getSeconds() + numValue);
            break;
        case 'm': // minutes
            now.setMinutes(now.getMinutes() + numValue);
            break;
        case 'h': // hours
            now.setHours(now.getHours() + numValue);
            break;
        case 'd': // days
            now.setDate(now.getDate() + numValue);
            break;
        case 'w': // weeks
            now.setDate(now.getDate() + numValue * 7);
            break;
        default:
            throw new Error(`Unknown time unit: ${unit}`);
    }

    return now;
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
}
