import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a random OTP of specified length
 */
export function generateOTP(length: number = 6): string {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}

/**
 * Hash OTP for storage (using same bcrypt)
 */
export async function hashOTP(otp: string): Promise<string> {
    // Use lower salt rounds for OTP since it expires quickly
    return bcrypt.hash(otp, 8);
}

/**
 * Compare OTP with hash
 */
export async function compareOTP(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
}
