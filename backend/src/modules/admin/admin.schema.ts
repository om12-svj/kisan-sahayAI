import { z } from 'zod';

// ============================================
// ADMIN AUTH SCHEMAS
// ============================================

export const adminLoginSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const adminRegisterSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['SUPER_ADMIN', 'DISTRICT_ADMIN', 'COUNSELOR']),
    district: z.string().optional(),
});

// ============================================
// FILTER SCHEMAS
// ============================================

export const alertFilterSchema = z.object({
    status: z.enum(['pending', 'acknowledged', 'resolved', 'escalated']).optional(),
    severity: z.enum(['high', 'critical']).optional(),
    district: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const farmerFilterSchema = z.object({
    status: z.enum(['active', 'inactive', 'critical_watch']).optional(),
    district: z.string().optional(),
    taluka: z.string().optional(),
    riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const checkInFilterSchema = z.object({
    farmerId: z.string().optional(),
    riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================
// UPDATE SCHEMAS
// ============================================

export const updateAlertSchema = z.object({
    status: z.enum(['pending', 'acknowledged', 'resolved', 'escalated']).optional(),
    resolution: z.string().optional(),
    assignedToId: z.string().optional(),
});

export const assignCounselorSchema = z.object({
    farmerId: z.string(),
    counselorId: z.string(),
});

export const sendReminderSchema = z.object({
    farmerId: z.string().optional(),
    farmerIds: z.array(z.string()).optional(),
    message: z.string().min(5, 'Message must be at least 5 characters'),
    channel: z.enum(['sms', 'whatsapp']).default('sms'),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
export type AlertFilterInput = z.infer<typeof alertFilterSchema>;
export type FarmerFilterInput = z.infer<typeof farmerFilterSchema>;
export type CheckInFilterInput = z.infer<typeof checkInFilterSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type AssignCounselorInput = z.infer<typeof assignCounselorSchema>;
export type SendReminderInput = z.infer<typeof sendReminderSchema>;
