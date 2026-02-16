/**
 * KISAN SAHAY - Encryption Utilities
 * Secure encryption/decryption for sensitive data
 */

import crypto from 'crypto';
import { env } from '../../config';

// ============================================
// CONFIGURATION
// ============================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// Derive encryption key from secret
function deriveKey(secret: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256');
}

// Get encryption secret (use JWT secret as fallback)
function getSecret(): string {
    return process.env.ENCRYPTION_SECRET || env.JWT_ACCESS_SECRET;
}

// ============================================
// ENCRYPTION FUNCTIONS
// ============================================

/**
 * Encrypt sensitive data
 * Returns base64 encoded string: salt:iv:authTag:ciphertext
 */
export function encryptData(plaintext: string): string {
    const secret = getSecret();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(secret, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
    ciphertext += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine all parts: salt + iv + authTag + ciphertext
    const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(ciphertext, 'base64'),
    ]);

    return combined.toString('base64');
}

/**
 * Decrypt encrypted data
 */
export function decryptData(encryptedData: string): string {
    const secret = getSecret();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract parts
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = deriveKey(secret, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);

    return plaintext.toString('utf8');
}

// ============================================
// DATA MASKING UTILITIES
// ============================================

/**
 * Mask mobile number for display
 * Example: 9876543210 -> 98****3210
 */
export function maskMobile(mobile: string): string {
    if (!mobile || mobile.length < 10) return mobile;
    return mobile.slice(0, 2) + '****' + mobile.slice(-4);
}

/**
 * Mask email for display
 * Example: user@example.com -> u***@example.com
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 1) return email;
    return local[0] + '***@' + domain;
}

/**
 * Mask sensitive notes content
 * Only show first few words
 */
export function maskNotes(notes: string, wordLimit: number = 5): string {
    if (!notes) return '';
    const words = notes.split(' ');
    if (words.length <= wordLimit) return notes;
    return words.slice(0, wordLimit).join(' ') + '...';
}

// ============================================
// SECURE RANDOM GENERATORS
// ============================================

/**
 * Generate a cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a secure numeric code (for OTP, etc.)
 */
export function generateSecureOTP(length: number = 6): string {
    const max = Math.pow(10, length);
    const randomNumber = crypto.randomInt(0, max);
    return randomNumber.toString().padStart(length, '0');
}

// ============================================
// HASH UTILITIES
// ============================================

/**
 * Create a SHA-256 hash of data
 */
export function hashSHA256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create HMAC signature
 */
export function createHMAC(data: string, secret?: string): string {
    const key = secret || getSecret();
    return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = createHMAC(data, secret);
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// ============================================
// AUDIT LOG DATA
// ============================================

/**
 * Create audit-safe version of sensitive data
 * Encrypts the data and returns both encrypted and masked versions
 */
export function prepareForAudit(sensitiveData: {
    mobile?: string;
    email?: string;
    notes?: string;
}): {
    encrypted: string;
    masked: {
        mobile?: string;
        email?: string;
        notes?: string;
    };
} {
    const dataToEncrypt = JSON.stringify(sensitiveData);

    return {
        encrypted: encryptData(dataToEncrypt),
        masked: {
            mobile: sensitiveData.mobile ? maskMobile(sensitiveData.mobile) : undefined,
            email: sensitiveData.email ? maskEmail(sensitiveData.email) : undefined,
            notes: sensitiveData.notes ? maskNotes(sensitiveData.notes) : undefined,
        },
    };
}

export default {
    encryptData,
    decryptData,
    maskMobile,
    maskEmail,
    maskNotes,
    generateSecureToken,
    generateSecureOTP,
    hashSHA256,
    createHMAC,
    verifyHMAC,
    prepareForAudit,
};
