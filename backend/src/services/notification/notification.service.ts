/**
 * KISAN SAHAY - Notification Service
 * Handles SMS, Email, and WhatsApp notifications
 */

import { env } from '../../config';

// ============================================
// TYPES
// ============================================

export interface NotificationResult {
    success: boolean;
    provider: string;
    messageId?: string;
    error?: string;
}

export interface ReminderPayload {
    farmerId: string;
    farmerName: string;
    mobile: string;
    language: string;
    type: 'weekly_checkin' | 'follow_up' | 'appointment' | 'custom';
    customMessage?: string;
}

// ============================================
// MESSAGE TEMPLATES (Multi-language)
// ============================================

const REMINDER_TEMPLATES = {
    weekly_checkin: {
        mr: '🌾 नमस्कार {name}, आठवड्याची तब्येत तपासणी करण्याची वेळ झाली! किसान सहाय मध्ये चेक-इन करा.',
        hi: '🌾 नमस्ते {name}, साप्ताहिक स्वास्थ्य जांच का समय! किसान सहाय में चेक-इन करें।',
        en: '🌾 Hello {name}, time for your weekly wellness check-in! Check in on Kisan Sahay.',
    },
    follow_up: {
        mr: '💚 {name}, आम्ही तुमची काळजी घेतो. तुमची तब्येत कशी आहे? किसान सहाय मध्ये भेट द्या.',
        hi: '💚 {name}, हम आपकी परवाह करते हैं। आप कैसे हैं? किसान सहाय पर विजिट करें।',
        en: '💚 {name}, we care about you. How are you feeling? Visit Kisan Sahay.',
    },
    appointment: {
        mr: '📅 {name}, तुमची समुपदेशन भेट उद्या आहे. कृपया वेळेवर या.',
        hi: '📅 {name}, आपकी परामर्श मुलाकात कल है। कृपया समय पर आएं।',
        en: '📅 {name}, your counseling appointment is tomorrow. Please be on time.',
    },
    custom: {
        mr: '{message}',
        hi: '{message}',
        en: '{message}',
    },
};

const OTP_TEMPLATES = {
    mr: 'तुमचा किसान सहाय OTP {otp} आहे. 5 मिनिटांत वापरा. कोणाशीही शेअर करू नका.',
    hi: 'आपका किसान सहाय OTP {otp} है। 5 मिनट में उपयोग करें। किसी से साझा न करें।',
    en: 'Your Kisan Sahay OTP is {otp}. Use within 5 minutes. Do not share with anyone.',
};

// ============================================
// SMS SERVICE (MSG91)
// ============================================

async function sendSMS(mobile: string, message: string): Promise<NotificationResult> {
    if (!env.MSG91_AUTH_KEY) {
        console.log(`📱 [SMS Mock] To: +91${mobile} - ${message}`);
        return { success: true, provider: 'mock', messageId: `mock-${Date.now()}` };
    }

    try {
        const response = await fetch('https://api.msg91.com/api/v5/flow/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authkey': env.MSG91_AUTH_KEY,
            },
            body: JSON.stringify({
                template_id: env.MSG91_TEMPLATE_ID,
                short_url: '0',
                recipients: [
                    {
                        mobiles: `91${mobile}`,
                        message: message,
                    },
                ],
            }),
        });

        const data = await response.json() as { type?: string; request_id?: string; message?: string };

        if (response.ok && data.type === 'success') {
            return { success: true, provider: 'msg91', messageId: data.request_id };
        } else {
            return { success: false, provider: 'msg91', error: data.message || 'Failed to send SMS' };
        }
    } catch (error) {
        console.error('SMS sending error:', error);
        return { success: false, provider: 'msg91', error: (error as Error).message };
    }
}

// ============================================
// WHATSAPP SERVICE (Twilio)
// ============================================

async function sendWhatsApp(mobile: string, message: string): Promise<NotificationResult> {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
        console.log(`📲 [WhatsApp Mock] To: +91${mobile} - ${message}`);
        return { success: true, provider: 'mock', messageId: `mock-${Date.now()}` };
    }

    try {
        const authHeader = Buffer.from(
            `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`
        ).toString('base64');

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${authHeader}`,
                },
                body: new URLSearchParams({
                    From: env.TWILIO_WHATSAPP_FROM,
                    To: `whatsapp:+91${mobile}`,
                    Body: message,
                }),
            }
        );

        const data = await response.json() as { sid?: string; message?: string };

        if (response.ok) {
            return { success: true, provider: 'twilio', messageId: data.sid };
        } else {
            return { success: false, provider: 'twilio', error: data.message || 'Failed to send WhatsApp' };
        }
    } catch (error) {
        console.error('WhatsApp sending error:', error);
        return { success: false, provider: 'twilio', error: (error as Error).message };
    }
}

// ============================================
// EMAIL SERVICE (Future - nodemailer)
// ============================================

async function sendEmail(
    email: string,
    subject: string,
    body: string
): Promise<NotificationResult> {
    // TODO: Integrate with nodemailer or SendGrid
    console.log(`📧 [Email Mock] To: ${email} - Subject: ${subject} - Body: ${body}`);
    return { success: true, provider: 'mock', messageId: `mock-${Date.now()}` };
}

// ============================================
// PUBLIC NOTIFICATION API
// ============================================

/**
 * Send OTP via specified channel
 */
export async function sendOTPNotification(
    mobile: string,
    otp: string,
    channel: 'sms' | 'whatsapp',
    language: string = 'mr'
): Promise<NotificationResult> {
    const lang = (language as 'mr' | 'hi' | 'en') || 'mr';
    const template = OTP_TEMPLATES[lang] || OTP_TEMPLATES.mr;
    const message = template.replace('{otp}', otp);

    if (channel === 'whatsapp') {
        return sendWhatsApp(mobile, message);
    }
    return sendSMS(mobile, message);
}

/**
 * Send reminder notification
 */
export async function sendReminderNotification(
    payload: ReminderPayload,
    channel: 'sms' | 'whatsapp' = 'sms'
): Promise<NotificationResult> {
    const lang = (payload.language as 'mr' | 'hi' | 'en') || 'mr';
    const templateSet = REMINDER_TEMPLATES[payload.type];
    let template = templateSet[lang] || templateSet.mr;

    // Replace placeholders
    let message = template
        .replace('{name}', payload.farmerName)
        .replace('{message}', payload.customMessage || '');

    if (channel === 'whatsapp') {
        return sendWhatsApp(payload.mobile, message);
    }
    return sendSMS(payload.mobile, message);
}

/**
 * Send alert notification to counselor/admin
 */
export async function sendAlertNotification(
    mobile: string,
    farmerName: string,
    riskLevel: string,
    district: string
): Promise<NotificationResult> {
    const message = `🚨 ALERT: Farmer ${farmerName} (${district}) has submitted a ${riskLevel} risk check-in. Please review immediately.`;
    return sendSMS(mobile, message);
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
    email: string,
    subject: string,
    body: string
): Promise<NotificationResult> {
    return sendEmail(email, subject, body);
}

export default {
    sendOTPNotification,
    sendReminderNotification,
    sendAlertNotification,
    sendEmailNotification,
};
