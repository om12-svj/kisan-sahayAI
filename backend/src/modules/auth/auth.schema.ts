import { z } from 'zod';

// Indian mobile number validation
const mobileRegex = /^[6-9]\d{9}$/;

/**
 * Registration schema
 */
export const registerSchema = z.object({
    name: z.string()
        .min(2, 'नाव किमान 2 अक्षरांचे असावे')
        .max(100, 'नाव 100 अक्षरांपेक्षा कमी असावे')
        .trim(),

    mobile: z.string()
        .regex(mobileRegex, 'कृपया वैध 10 अंकी मोबाईल नंबर टाका'),

    village: z.string()
        .min(2, 'गाव किमान 2 अक्षरांचे असावे')
        .max(100, 'गाव 100 अक्षरांपेक्षा कमी असावे')
        .trim(),

    taluka: z.string()
        .min(2, 'तालुका किमान 2 अक्षरांचा असावा')
        .max(100, 'तालुका 100 अक्षरांपेक्षा कमी असावा')
        .trim(),

    district: z.string()
        .min(2, 'जिल्हा किमान 2 अक्षरांचा असावा')
        .max(100, 'जिल्हा 100 अक्षरांपेक्षा कमी असावा')
        .trim(),

    farmSize: z.number()
        .min(0, 'शेताचा आकार 0 पेक्षा मोठा असावा')
        .max(10000, 'शेताचा आकार 10000 एकरांपेक्षा कमी असावा'),

    password: z.string()
        .min(6, 'पासवर्ड किमान 6 अक्षरांचा असावा')
        .max(100, 'पासवर्ड 100 अक्षरांपेक्षा कमी असावा'),

    confirmPassword: z.string(),

    preferredLang: z.enum(['mr', 'hi', 'en', 'te', 'kn', 'pa', 'gu', 'bn']).optional().default('mr'),
}).refine(data => data.password === data.confirmPassword, {
    message: 'पासवर्ड जुळत नाही',
    path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login schema
 */
export const loginSchema = z.object({
    mobile: z.string()
        .regex(mobileRegex, 'कृपया वैध 10 अंकी मोबाईल नंबर टाका'),

    password: z.string()
        .min(1, 'पासवर्ड आवश्यक आहे'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * OTP request schema
 */
export const otpSendSchema = z.object({
    mobile: z.string()
        .regex(mobileRegex, 'कृपया वैध 10 अंकी मोबाईल नंबर टाका'),

    channel: z.enum(['sms', 'whatsapp']).optional().default('sms'),
});

export type OTPSendInput = z.infer<typeof otpSendSchema>;

/**
 * OTP verification schema
 */
export const otpVerifySchema = z.object({
    mobile: z.string()
        .regex(mobileRegex, 'कृपया वैध 10 अंकी मोबाईल नंबर टाका'),

    otp: z.string()
        .length(6, 'OTP 6 अंकांचा असावा')
        .regex(/^\d{6}$/, 'OTP फक्त अंकांचा असावा'),
});

export type OTPVerifyInput = z.infer<typeof otpVerifySchema>;

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Admin login schema
 */
export const adminLoginSchema = z.object({
    email: z.string()
        .email('कृपया वैध ईमेल टाका'),

    password: z.string()
        .min(1, 'पासवर्ड आवश्यक आहे'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
