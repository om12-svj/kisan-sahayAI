/**
 * KISAN SAHAY - Admin Controller
 * Request handlers for admin dashboard operations
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { successResponse, createdResponse } from '../../shared/utils/response';
import * as adminService from './admin.service';
import {
    AdminLoginInput,
    AdminRegisterInput,
    AlertFilterInput,
    FarmerFilterInput,
    CheckInFilterInput,
    UpdateAlertInput,
    SendReminderInput,
} from './admin.schema';
import { sendCustomReminder } from '../../services/reminder';

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Admin login
 */
export async function login(req: AuthenticatedRequest, res: Response) {
    const input = req.body as AdminLoginInput;
    const result = await adminService.adminLogin(input);

    return successResponse(res, result, 'Login successful');
}

/**
 * Register new admin (Super Admin only)
 */
export async function register(req: AuthenticatedRequest, res: Response) {
    const input = req.body as AdminRegisterInput;
    const admin = await adminService.registerAdmin(input);

    return createdResponse(res, { admin }, 'Admin created successfully');
}

/**
 * Get current admin info
 */
export async function me(req: AuthenticatedRequest, res: Response) {
    const adminId = req.user?.id;

    if (!adminId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin data should already be attached by auth middleware
    return successResponse(res, {
        id: req.user?.id,
        type: req.user?.type,
        role: req.user?.role,
    });
}

// ============================================
// DASHBOARD
// ============================================

/**
 * Get dashboard statistics
 */
export async function getDashboard(req: AuthenticatedRequest, res: Response) {
    // If district admin, filter by their district
    const adminDistrict = req.user?.role === 'DISTRICT_ADMIN'
        ? (req.admin?.district || undefined)
        : undefined;

    const stats = await adminService.getDashboardStats(adminDistrict);

    return successResponse(res, stats);
}

// ============================================
// FARMERS MANAGEMENT
// ============================================

/**
 * Get farmers list
 */
export async function getFarmers(req: AuthenticatedRequest, res: Response) {
    const filters = req.query as unknown as FarmerFilterInput;
    const adminDistrict = req.user?.role === 'DISTRICT_ADMIN'
        ? (req.admin?.district || undefined)
        : undefined;

    const result = await adminService.getFarmers(filters, adminDistrict);

    return successResponse(res, result);
}

/**
 * Get farmer details
 */
export async function getFarmerDetails(req: AuthenticatedRequest, res: Response) {
    const id = req.params.id as string;
    const farmer = await adminService.getFarmerDetails(id);

    return successResponse(res, farmer);
}

// ============================================
// ALERTS MANAGEMENT
// ============================================

/**
 * Get alerts list
 */
export async function getAlerts(req: AuthenticatedRequest, res: Response) {
    const filters = req.query as unknown as AlertFilterInput;
    const adminId = req.user!.id;
    const adminDistrict = req.user?.role === 'DISTRICT_ADMIN'
        ? (req.admin?.district || undefined)
        : undefined;

    const result = await adminService.getAlerts(filters, adminId, adminDistrict);

    return successResponse(res, result);
}

/**
 * Update alert
 */
export async function updateAlert(req: AuthenticatedRequest, res: Response) {
    const id = req.params.id as string;
    const input = req.body as UpdateAlertInput;
    const adminId = req.user!.id;

    const alert = await adminService.updateAlert(id, input, adminId);

    return successResponse(res, alert, 'Alert updated successfully');
}

// ============================================
// COUNSELOR MANAGEMENT
// ============================================

/**
 * Get counselors list
 */
export async function getCounselors(req: AuthenticatedRequest, res: Response) {
    const { district } = req.query;
    const counselors = await adminService.getCounselors(district as string);

    return successResponse(res, counselors);
}

/**
 * Assign counselor to farmer
 */
export async function assignCounselor(req: AuthenticatedRequest, res: Response) {
    const { farmerId, counselorId } = req.body;
    const result = await adminService.assignCounselor(farmerId, counselorId);

    return successResponse(res, result, 'Counselor assigned successfully');
}

// ============================================
// CHECK-INS & ANALYTICS
// ============================================

/**
 * Get check-ins list
 */
export async function getCheckIns(req: AuthenticatedRequest, res: Response) {
    const filters = req.query as unknown as CheckInFilterInput;
    const adminDistrict = req.user?.role === 'DISTRICT_ADMIN'
        ? (req.admin?.district || undefined)
        : undefined;

    const result = await adminService.getCheckIns(filters, adminDistrict);

    return successResponse(res, result);
}

/**
 * Get risk trends analytics
 */
export async function getRiskTrends(req: AuthenticatedRequest, res: Response) {
    const days = parseInt(req.query.days as string) || 30;
    const district = req.query.district as string;

    const trends = await adminService.getRiskTrends(days, district);

    return successResponse(res, trends);
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Send reminder to farmer(s)
 */
export async function sendReminder(req: AuthenticatedRequest, res: Response) {
    const input = req.body as SendReminderInput;

    const results: { farmerId: string; success: boolean }[] = [];

    // Send to single farmer
    if (input.farmerId) {
        const success = await sendCustomReminder(input.farmerId, input.message, input.channel);
        results.push({ farmerId: input.farmerId, success });
    }

    // Send to multiple farmers
    if (input.farmerIds && input.farmerIds.length > 0) {
        for (const farmerId of input.farmerIds) {
            try {
                const success = await sendCustomReminder(farmerId, input.message, input.channel);
                results.push({ farmerId, success });
            } catch (error) {
                results.push({ farmerId, success: false });
            }
        }
    }

    const successCount = results.filter(r => r.success).length;

    return successResponse(res, {
        sent: successCount,
        failed: results.length - successCount,
        results,
    }, `Sent ${successCount} of ${results.length} reminders`);
}
