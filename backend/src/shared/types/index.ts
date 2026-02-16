// Shared types for the KISAN SAHAY backend

import { Request } from 'express';
import { Farmer, AdminUser } from '@prisma/client';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta: {
        requestId: string;
        timestamp: string;
    };
}

export interface ApiError {
    code: string;
    message: string;
    details?: Array<{
        field: string;
        message: string;
    }>;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

// ============================================
// Authentication Types
// ============================================

export interface JWTPayload {
    sub: string;       // User ID
    type: 'farmer' | 'admin';
    role?: string;     // For admin users
    iat: number;
    exp: number;
}

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        type: 'farmer' | 'admin';
        role?: string;
    };
    farmer?: Farmer;
    admin?: AdminUser;
    requestId?: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface LoginResponse extends TokenPair {
    farmer?: SafeFarmer;
    admin?: SafeAdminUser;
}

// ============================================
// Safe Types (without sensitive data)
// ============================================

export type SafeFarmer = Omit<Farmer, 'passwordHash'>;

export type SafeAdminUser = Omit<AdminUser, 'passwordHash'>;

// ============================================
// Risk Assessment Types
// ============================================

export type CropCondition = 'excellent' | 'good' | 'moderate' | 'poor' | 'destroyed';
export type LoanPressure = 'none' | 'low' | 'medium' | 'high' | 'severe';
export type SleepQuality = 'good' | 'fair' | 'poor' | 'very_poor';
export type FamilySupport = 'strong' | 'moderate' | 'weak' | 'none';

export interface RiskAssessmentInput {
    cropCondition: CropCondition;
    loanPressure: LoanPressure;
    sleepQuality: SleepQuality;
    familySupport: FamilySupport;
    hopeLevel: number;
    notes?: string;
}

export interface RiskAssessmentResult {
    riskScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    criticalFactors: string[];
    factors: {
        crop: number;
        loan: number;
        sleep: number;
        family: number;
        hope: number;
    };
}

export interface CheckInResponse {
    message: {
        greeting: string;
        body: string;
        closing: string;
    };
    suggestions: Array<{
        icon: string;
        title: string;
        desc: string;
    }>;
    showEmergency: boolean;
}

// ============================================
// Error Codes
// ============================================

export const ErrorCodes = {
    // Auth errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',

    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_MOBILE: 'INVALID_MOBILE',
    INVALID_OTP: 'INVALID_OTP',
    OTP_EXPIRED: 'OTP_EXPIRED',
    OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS',

    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',

    // Server errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
