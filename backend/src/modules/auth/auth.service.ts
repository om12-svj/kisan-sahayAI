import { prisma, env } from '../../config';
import {
    hashPassword,
    comparePassword,
    generateOTP,
    hashOTP,
    compareOTP
} from '../../shared/utils/hash';
import {
    generateTokenPair,
    hashToken,
    verifyRefreshToken,
    calculateExpiryDate
} from '../../shared/utils/jwt';
import { ApiError } from '../../shared/middleware/error.middleware';
import { SafeFarmer, TokenPair, LoginResponse } from '../../shared/types';
import { RegisterInput, LoginInput, OTPSendInput, OTPVerifyInput } from './auth.schema';

/**
 * Register a new farmer
 */
export async function registerFarmer(input: RegisterInput): Promise<SafeFarmer> {
    // Check if mobile already exists
    const existing = await prisma.farmer.findUnique({
        where: { mobile: input.mobile },
    });

    if (existing) {
        throw new ApiError(409, 'ALREADY_EXISTS', 'हा मोबाईल नंबर आधीच नोंदणीकृत आहे');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create farmer
    const farmer = await prisma.farmer.create({
        data: {
            name: input.name,
            mobile: input.mobile,
            village: input.village,
            taluka: input.taluka,
            district: input.district,
            farmSize: input.farmSize,
            passwordHash,
            preferredLang: input.preferredLang as any,
        },
    });

    // Return without password hash
    const { passwordHash: _, ...safeFarmer } = farmer;
    return safeFarmer as SafeFarmer;
}

/**
 * Login farmer with mobile and password
 */
export async function loginFarmer(input: LoginInput): Promise<LoginResponse> {
    // Find farmer by mobile
    const farmer = await prisma.farmer.findUnique({
        where: { mobile: input.mobile },
    });

    if (!farmer) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'हा मोबाईल नंबर नोंदणीकृत नाही');
    }

    if (!farmer.passwordHash) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'कृपया OTP द्वारे लॉगिन करा');
    }

    // Verify password
    const isValid = await comparePassword(input.password, farmer.passwordHash);
    if (!isValid) {
        throw new ApiError(401, 'INVALID_CREDENTIALS', 'चुकीचा पासवर्ड');
    }

    // Generate tokens
    const tokens = generateTokenPair(farmer.id, 'farmer');

    // Store refresh token
    await storeRefreshToken(farmer.id, 'farmer', tokens.refreshToken);

    // Update last active
    await prisma.farmer.update({
        where: { id: farmer.id },
        data: { lastActiveAt: new Date() },
    });

    // Return response
    const { passwordHash: _, ...safeFarmer } = farmer;
    return {
        ...tokens,
        farmer: safeFarmer as SafeFarmer,
    };
}

/**
 * Send OTP via SMS or WhatsApp
 */
export async function sendOTP(input: OTPSendInput): Promise<{ expiresIn: number }> {
    const { mobile, channel } = input;

    // Check rate limit - max 3 OTPs per hour per mobile
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentOTPs = await prisma.oTPLog.count({
        where: {
            mobile,
            createdAt: { gte: oneHourAgo },
        },
    });

    if (recentOTPs >= 3) {
        throw new ApiError(429, 'OTP_MAX_ATTEMPTS', 'प्रति तास 3 OTP पेक्षा जास्त पाठवता येत नाहीत');
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP
    await prisma.oTPLog.create({
        data: {
            mobile,
            otpHash,
            channel,
            expiresAt,
        },
    });

    // Send OTP (mock for now - integrate with MSG91/Twilio later)
    if (env.isDevelopment) {
        console.log(`📱 [DEV] OTP for ${mobile}: ${otp}`);
    } else {
        // TODO: Integrate with SMS/WhatsApp provider
        await sendOTPViaProvider(mobile, otp, channel);
    }

    return { expiresIn: env.OTP_EXPIRY_MINUTES * 60 };
}

/**
 * Verify OTP and login/register
 */
export async function verifyOTP(input: OTPVerifyInput): Promise<LoginResponse & { isNewUser: boolean }> {
    const { mobile, otp } = input;

    // Find valid OTP
    const otpLog = await prisma.oTPLog.findFirst({
        where: {
            mobile,
            verified: false,
            expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!otpLog) {
        throw new ApiError(401, 'OTP_EXPIRED', 'OTP कालबाह्य झाला आहे. कृपया नवीन OTP मागवा');
    }

    // Check attempts
    if (otpLog.attempts >= env.OTP_MAX_ATTEMPTS) {
        throw new ApiError(401, 'OTP_MAX_ATTEMPTS', 'जास्तीत जास्त प्रयत्न ओलांडले. कृपया नवीन OTP मागवा');
    }

    // Verify OTP
    const isValid = await compareOTP(otp, otpLog.otpHash);

    if (!isValid) {
        // Increment attempts
        await prisma.oTPLog.update({
            where: { id: otpLog.id },
            data: { attempts: { increment: 1 } },
        });
        throw new ApiError(401, 'INVALID_OTP', 'चुकीचा OTP. कृपया पुन्हा प्रयत्न करा');
    }

    // Mark as verified
    await prisma.oTPLog.update({
        where: { id: otpLog.id },
        data: { verified: true },
    });

    // Find or create farmer
    let farmer = await prisma.farmer.findUnique({
        where: { mobile },
    });

    let isNewUser = false;

    if (!farmer) {
        // Create new farmer with minimal info (OTP user)
        farmer = await prisma.farmer.create({
            data: {
                name: 'शेतकरी',
                mobile,
                village: '',
                taluka: '',
                district: '',
                farmSize: 0,
                isOTPUser: true,
            },
        });
        isNewUser = true;
    }

    // Generate tokens
    const tokens = generateTokenPair(farmer.id, 'farmer');

    // Store refresh token
    await storeRefreshToken(farmer.id, 'farmer', tokens.refreshToken);

    // Update last active
    await prisma.farmer.update({
        where: { id: farmer.id },
        data: { lastActiveAt: new Date() },
    });

    const { passwordHash: _, ...safeFarmer } = farmer;
    return {
        ...tokens,
        farmer: safeFarmer as SafeFarmer,
        isNewUser,
    };
}

/**
 * Refresh access token
 */
export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
    // Verify token
    const payload = verifyRefreshToken(refreshToken);

    // Check if token exists and not revoked
    const tokenHash = hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt) {
        throw new ApiError(401, 'TOKEN_INVALID', 'Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
        throw new ApiError(401, 'TOKEN_EXPIRED', 'Refresh token expired');
    }

    // Revoke old token
    await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const newTokens = generateTokenPair(payload.sub, payload.type, payload.role);

    // Store new refresh token
    await storeRefreshToken(payload.sub, payload.type, newTokens.refreshToken);

    return newTokens;
}

/**
 * Logout - revoke refresh token
 */
export async function logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
    });
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllTokens(userId: string, userType: 'farmer' | 'admin'): Promise<void> {
    if (userType === 'farmer') {
        await prisma.refreshToken.updateMany({
            where: { farmerId: userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    } else {
        await prisma.refreshToken.updateMany({
            where: { adminUserId: userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
}

// ============================================
// Helper Functions
// ============================================

async function storeRefreshToken(
    userId: string,
    userType: 'farmer' | 'admin',
    token: string
): Promise<void> {
    const tokenHash = hashToken(token);
    const expiresAt = calculateExpiryDate(env.JWT_REFRESH_EXPIRY);

    await prisma.refreshToken.create({
        data: {
            tokenHash,
            expiresAt,
            ...(userType === 'farmer' ? { farmerId: userId } : { adminUserId: userId }),
        },
    });
}

async function sendOTPViaProvider(
    mobile: string,
    otp: string,
    channel: string
): Promise<void> {
    // TODO: Implement actual SMS/WhatsApp sending
    // For SMS (MSG91):
    // const msg91 = require('msg91').default;
    // await msg91.send(mobile, otp);

    // For WhatsApp (Twilio):
    // const twilio = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: `Your Kisan Sahay OTP is: ${otp}`,
    //   from: env.TWILIO_WHATSAPP_FROM,
    //   to: `whatsapp:+91${mobile}`
    // });

    console.log(`[${channel.toUpperCase()}] Would send OTP ${otp} to +91${mobile}`);
}
