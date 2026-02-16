/**
 * KISAN SAHAY - Reminder Service
 * Automated reminders for weekly check-ins, follow-ups, and appointments
 */

import { prisma } from '../../config';
import { sendReminderNotification, sendAlertNotification } from '../notification';

// ============================================
// TYPES
// ============================================

interface ReminderStats {
    sent: number;
    failed: number;
    skipped: number;
}

// ============================================
// REMINDER FUNCTIONS
// ============================================

/**
 * Send weekly check-in reminders to all active farmers
 * Should be called by a cron job every week (e.g., every Sunday evening)
 */
export async function sendWeeklyCheckInReminders(): Promise<ReminderStats> {
    const stats: ReminderStats = { sent: 0, failed: 0, skipped: 0 };

    // Get all active farmers who haven't checked in this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const farmers = await prisma.farmer.findMany({
        where: {
            status: 'active',
        },
        select: {
            id: true,
            name: true,
            mobile: true,
            preferredLang: true,
            checkIns: {
                where: {
                    createdAt: { gte: oneWeekAgo },
                },
                take: 1,
            },
        },
    });

    for (const farmer of farmers) {
        // Skip if farmer has checked in this week
        if (farmer.checkIns.length > 0) {
            stats.skipped++;
            continue;
        }

        try {
            const result = await sendReminderNotification(
                {
                    farmerId: farmer.id,
                    farmerName: farmer.name,
                    mobile: farmer.mobile,
                    language: farmer.preferredLang,
                    type: 'weekly_checkin',
                },
                'sms'
            );

            if (result.success) {
                stats.sent++;
            } else {
                stats.failed++;
            }
        } catch (error) {
            console.error(`Failed to send reminder to farmer ${farmer.id}:`, error);
            stats.failed++;
        }
    }

    console.log(`[Weekly Reminders] Sent: ${stats.sent}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
    return stats;
}

/**
 * Send follow-up reminders to farmers with high/critical risk in past week
 * Should be called every 2-3 days
 */
export async function sendFollowUpReminders(): Promise<ReminderStats> {
    const stats: ReminderStats = { sent: 0, failed: 0, skipped: 0 };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Get farmers who had high/critical check-ins in the past week
    // but haven't checked in the last 2 days
    const farmersNeedingFollowUp = await prisma.farmer.findMany({
        where: {
            status: { in: ['active', 'critical_watch'] },
            checkIns: {
                some: {
                    riskLevel: { in: ['HIGH', 'CRITICAL'] },
                    createdAt: { gte: oneWeekAgo },
                },
            },
        },
        select: {
            id: true,
            name: true,
            mobile: true,
            preferredLang: true,
            checkIns: {
                where: {
                    createdAt: { gte: twoDaysAgo },
                },
                take: 1,
            },
        },
    });

    for (const farmer of farmersNeedingFollowUp) {
        // Skip if farmer has checked in recently
        if (farmer.checkIns.length > 0) {
            stats.skipped++;
            continue;
        }

        try {
            const result = await sendReminderNotification(
                {
                    farmerId: farmer.id,
                    farmerName: farmer.name,
                    mobile: farmer.mobile,
                    language: farmer.preferredLang,
                    type: 'follow_up',
                },
                'whatsapp' // Use WhatsApp for high-priority follow-ups
            );

            if (result.success) {
                stats.sent++;
            } else {
                stats.failed++;
            }
        } catch (error) {
            console.error(`Failed to send follow-up to farmer ${farmer.id}:`, error);
            stats.failed++;
        }
    }

    console.log(`[Follow-up Reminders] Sent: ${stats.sent}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
    return stats;
}

/**
 * Send alerts to counselors for pending high-risk cases
 * Should be called daily
 */
export async function sendCounselorAlerts(): Promise<ReminderStats> {
    const stats: ReminderStats = { sent: 0, failed: 0, skipped: 0 };

    // Get pending alerts with assigned counselors
    const pendingAlerts = await prisma.alert.findMany({
        where: {
            status: 'pending',
            assignedToId: { not: null },
        },
        include: {
            farmer: {
                select: {
                    name: true,
                    district: true,
                },
            },
            checkIn: {
                select: {
                    riskLevel: true,
                },
            },
            assignedTo: {
                select: {
                    email: true,
                    name: true,
                },
            },
        },
    });

    // Group alerts by counselor
    const alertsByCounselor = new Map<string, typeof pendingAlerts>();

    for (const alert of pendingAlerts) {
        if (!alert.assignedToId) continue;

        const existing = alertsByCounselor.get(alert.assignedToId) || [];
        existing.push(alert);
        alertsByCounselor.set(alert.assignedToId, existing);
    }

    // Send one notification per counselor with all pending cases
    for (const [counselorId, alerts] of alertsByCounselor) {
        const counselor = alerts[0].assignedTo;
        if (!counselor?.email) {
            stats.skipped++;
            continue;
        }

        const alertCount = alerts.length;
        const criticalCount = alerts.filter(a => a.checkIn.riskLevel === 'CRITICAL').length;

        try {
            // In production, send email with detailed list
            console.log(`[Counselor Alert] ${counselor.name}: ${alertCount} pending alerts (${criticalCount} critical)`);
            stats.sent++;
        } catch (error) {
            console.error(`Failed to send alert to counselor ${counselorId}:`, error);
            stats.failed++;
        }
    }

    console.log(`[Counselor Alerts] Sent: ${stats.sent}, Failed: ${stats.failed}, Skipped: ${stats.skipped}`);
    return stats;
}

/**
 * Manual trigger for sending a custom reminder
 */
export async function sendCustomReminder(
    farmerId: string,
    message: string,
    channel: 'sms' | 'whatsapp' = 'sms'
): Promise<boolean> {
    const farmer = await prisma.farmer.findUnique({
        where: { id: farmerId },
        select: {
            id: true,
            name: true,
            mobile: true,
            preferredLang: true,
        },
    });

    if (!farmer) {
        throw new Error('Farmer not found');
    }

    const result = await sendReminderNotification(
        {
            farmerId: farmer.id,
            farmerName: farmer.name,
            mobile: farmer.mobile,
            language: farmer.preferredLang,
            type: 'custom',
            customMessage: message,
        },
        channel
    );

    return result.success;
}

export default {
    sendWeeklyCheckInReminders,
    sendFollowUpReminders,
    sendCounselorAlerts,
    sendCustomReminder,
};
