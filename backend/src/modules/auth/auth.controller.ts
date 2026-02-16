import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { sendSuccess } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import * as authService from './auth.service';
import {
    RegisterInput,
    LoginInput,
    OTPSendInput,
    OTPVerifyInput,
    RefreshTokenInput
} from './auth.schema';

/**
 * Register a new farmer
 * POST /auth/register
 */
export const register = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const input: RegisterInput = req.body;
    const farmer = await authService.registerFarmer(input);

    sendSuccess(res, {
        message: 'नोंदणी यशस्वी! कृपया लॉगिन करा',
        farmer,
    }, 201);
});

/**
 * Login with mobile and password
 * POST /auth/login
 */
export const login = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const input: LoginInput = req.body;
    const result = await authService.loginFarmer(input);

    sendSuccess(res, {
        message: 'लॉगिन यशस्वी!',
        ...result,
    });
});

/**
 * Send OTP via SMS or WhatsApp
 * POST /auth/otp/send
 */
export const sendOTP = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const input: OTPSendInput = req.body;
    const result = await authService.sendOTP(input);

    const channelName = input.channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
    sendSuccess(res, {
        message: `${channelName} द्वारे OTP पाठवला!`,
        expiresIn: result.expiresIn,
    });
});

/**
 * Verify OTP and login
 * POST /auth/otp/verify
 */
export const verifyOTP = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const input: OTPVerifyInput = req.body;
    const result = await authService.verifyOTP(input);

    sendSuccess(res, {
        message: 'सत्यापन यशस्वी!',
        ...result,
    });
});

/**
 * Refresh access token
 * POST /auth/refresh
 */
export const refresh = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const { refreshToken }: RefreshTokenInput = req.body;
    const tokens = await authService.refreshTokens(refreshToken);

    sendSuccess(res, tokens);
});

/**
 * Logout - revoke refresh token
 * POST /auth/logout
 */
export const logout = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        await authService.logout(refreshToken);
    }

    sendSuccess(res, {
        message: 'तुम्ही यशस्वीपणे लॉगआउट झालात!',
    });
});

/**
 * Get current user info
 * GET /auth/me
 */
export const me = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    if (req.farmer) {
        const { passwordHash, ...safeFarmer } = req.farmer;
        sendSuccess(res, { farmer: safeFarmer });
    } else if (req.admin) {
        const { passwordHash, ...safeAdmin } = req.admin;
        sendSuccess(res, { admin: safeAdmin });
    } else {
        sendSuccess(res, { user: req.user });
    }
});
