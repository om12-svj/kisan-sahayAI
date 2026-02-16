/**
 * KISAN SAHAY - Admin Routes
 * API routes for admin dashboard
 */

import { Router } from 'express';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import { validate } from '../../shared/middleware/validate.middleware';
import { requireAuth, requireAdmin, requireRole } from '../../shared/middleware/auth.middleware';
import * as adminController from './admin.controller';
import {
    adminLoginSchema,
    adminRegisterSchema,
    alertFilterSchema,
    farmerFilterSchema,
    checkInFilterSchema,
    updateAlertSchema,
    assignCounselorSchema,
    sendReminderSchema,
} from './admin.schema';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Admin login
router.post(
    '/login',
    validate(adminLoginSchema),
    asyncHandler(adminController.login)
);

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

// Get current admin info
router.get(
    '/me',
    requireAuth,
    requireAdmin,
    asyncHandler(adminController.me)
);

// ============================================
// DASHBOARD
// ============================================

router.get(
    '/dashboard',
    requireAuth,
    requireAdmin,
    asyncHandler(adminController.getDashboard)
);

// ============================================
// FARMERS MANAGEMENT
// ============================================

router.get(
    '/farmers',
    requireAuth,
    requireAdmin,
    validate(farmerFilterSchema, 'query'),
    asyncHandler(adminController.getFarmers)
);

router.get(
    '/farmers/:id',
    requireAuth,
    requireAdmin,
    asyncHandler(adminController.getFarmerDetails)
);

// ============================================
// ALERTS MANAGEMENT
// ============================================

router.get(
    '/alerts',
    requireAuth,
    requireAdmin,
    validate(alertFilterSchema, 'query'),
    asyncHandler(adminController.getAlerts)
);

router.patch(
    '/alerts/:id',
    requireAuth,
    requireAdmin,
    validate(updateAlertSchema),
    asyncHandler(adminController.updateAlert)
);

// ============================================
// COUNSELORS
// ============================================

router.get(
    '/counselors',
    requireAuth,
    requireAdmin,
    asyncHandler(adminController.getCounselors)
);

router.post(
    '/counselors/assign',
    requireAuth,
    requireAdmin,
    validate(assignCounselorSchema),
    asyncHandler(adminController.assignCounselor)
);

// ============================================
// CHECK-INS & ANALYTICS
// ============================================

router.get(
    '/checkins',
    requireAuth,
    requireAdmin,
    validate(checkInFilterSchema, 'query'),
    asyncHandler(adminController.getCheckIns)
);

router.get(
    '/analytics/trends',
    requireAuth,
    requireAdmin,
    asyncHandler(adminController.getRiskTrends)
);

// ============================================
// NOTIFICATIONS
// ============================================

router.post(
    '/notifications/send',
    requireAuth,
    requireAdmin,
    validate(sendReminderSchema),
    asyncHandler(adminController.sendReminder)
);

// ============================================
// SUPER ADMIN ONLY
// ============================================

// Register new admin
router.post(
    '/register',
    requireAuth,
    requireAdmin,
    requireRole('SUPER_ADMIN'),
    validate(adminRegisterSchema),
    asyncHandler(adminController.register)
);

export default router;
