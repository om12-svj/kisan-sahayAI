import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authRateLimit, otpRateLimit } from '../../shared/middleware/rate-limit.middleware';
import {
    registerSchema,
    loginSchema,
    otpSendSchema,
    otpVerifySchema,
    refreshTokenSchema,
} from './auth.schema';

const router = Router();

/**
 * @route POST /auth/register
 * @desc Register a new farmer
 * @access Public
 */
router.post(
    '/register',
    authRateLimit(),
    validate(registerSchema),
    authController.register
);

/**
 * @route POST /auth/login
 * @desc Login with mobile and password
 * @access Public
 */
router.post(
    '/login',
    authRateLimit(),
    validate(loginSchema),
    authController.login
);

/**
 * @route POST /auth/otp/send
 * @desc Send OTP via SMS or WhatsApp
 * @access Public
 */
router.post(
    '/otp/send',
    otpRateLimit(),
    validate(otpSendSchema),
    authController.sendOTP
);

/**
 * @route POST /auth/otp/verify
 * @desc Verify OTP and login
 * @access Public
 */
router.post(
    '/otp/verify',
    authRateLimit(),
    validate(otpVerifySchema),
    authController.verifyOTP
);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token
 * @access Public (with valid refresh token)
 */
router.post(
    '/refresh',
    validate(refreshTokenSchema),
    authController.refresh
);

/**
 * @route POST /auth/logout
 * @desc Logout and revoke refresh token
 * @access Public
 */
router.post(
    '/logout',
    authController.logout
);

/**
 * @route GET /auth/me
 * @desc Get current user info
 * @access Private
 */
router.get(
    '/me',
    authenticate,
    authController.me
);

export default router;
