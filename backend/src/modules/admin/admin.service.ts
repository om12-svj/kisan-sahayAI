/**
 * KISAN SAHAY - Admin Service
 * Business logic for admin dashboard operations
 */

import { prisma } from '../../config';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../../shared/utils/jwt';
import { AdminLoginInput, AdminRegisterInput, AlertFilterInput, FarmerFilterInput, CheckInFilterInput, UpdateAlertInput } from './admin.schema';

// ============================================
// CONSTANTS
// ============================================

const SALT_ROUNDS = 12;

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Admin login
 */
export async function adminLogin(input: AdminLoginInput) {
    const admin = await prisma.adminUser.findUnique({
        where: { email: input.email },
    });

    if (!admin) {
        throw new Error('Invalid credentials');
    }

    if (!admin.isActive) {
        throw new Error('Account is deactivated');
    }

    const isValid = await bcrypt.compare(input.password, admin.passwordHash);
    if (!isValid) {
        throw new Error('Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
        sub: admin.id,
        type: 'admin',
        role: admin.role,
    });

    const refreshToken = generateRefreshToken({
        sub: admin.id,
        type: 'admin',
        role: admin.role,
    });

    return {
        accessToken,
        refreshToken,
        admin: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            district: admin.district,
        },
    };
}

/**
 * Register new admin (Super Admin only)
 */
export async function registerAdmin(input: AdminRegisterInput) {
    const existing = await prisma.adminUser.findUnique({
        where: { email: input.email },
    });

    if (existing) {
        throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const admin = await prisma.adminUser.create({
        data: {
            email: input.email,
            passwordHash,
            name: input.name,
            role: input.role,
            district: input.district,
        },
    });

    return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        district: admin.district,
    };
}

// ============================================
// DASHBOARD
// ============================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(district?: string | null) {
    const where = district ? { district } : {};

    // Total farmers
    const totalFarmers = await prisma.farmer.count({ where });

    // Active farmers (active in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeFarmers = await prisma.farmer.count({
        where: {
            ...where,
            lastActiveAt: { gte: sevenDaysAgo },
        },
    });

    // Pending alerts
    const pendingAlerts = await prisma.alert.count({
        where: {
            status: 'pending',
            farmer: where,
        },
    });

    // Check-ins today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const checkInsToday = await prisma.checkIn.count({
        where: {
            createdAt: { gte: todayStart },
            farmer: where,
        },
    });

    // Risk distribution
    const riskDistribution = await prisma.checkIn.groupBy({
        by: ['riskLevel'],
        _count: true,
        where: {
            createdAt: { gte: sevenDaysAgo },
            farmer: where,
        },
    });

    // High-risk farmers (critical_watch status)
    const highRiskFarmers = await prisma.farmer.count({
        where: {
            ...where,
            status: 'critical_watch',
        },
    });

    return {
        totalFarmers,
        activeFarmers,
        pendingAlerts,
        checkInsToday,
        highRiskFarmers,
        riskDistribution: riskDistribution.map(r => ({
            level: r.riskLevel,
            count: r._count,
        })),
    };
}

// ============================================
// FARMERS MANAGEMENT
// ============================================

/**
 * Get farmers list with filters
 */
export async function getFarmers(filters: FarmerFilterInput, adminDistrict?: string | null) {
    const where: any = {};

    if (adminDistrict) {
        where.district = adminDistrict;
    } else if (filters.district) {
        where.district = filters.district;
    }

    if (filters.riskLevel) {
        where.checkIns = {
            some: {
                riskLevel: filters.riskLevel,
            },
        };
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search } },
            { mobile: { contains: filters.search } },
            { village: { contains: filters.search } },
        ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [farmers, total] = await Promise.all([
        prisma.farmer.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                checkIns: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: { checkIns: true, alerts: true },
                },
            },
        }),
        prisma.farmer.count({ where }),
    ]);

    return {
        farmers: farmers.map(f => ({
            id: f.id,
            name: f.name,
            mobile: f.mobile,
            village: f.village,
            taluka: f.taluka,
            district: f.district,
            status: f.status,
            lastActiveAt: f.lastActiveAt,
            lastCheckIn: f.checkIns[0] || null,
            checkInsCount: f._count.checkIns,
            alertsCount: f._count.alerts,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get farmer details by ID
 */
export async function getFarmerDetails(farmerId: string) {
    const farmer = await prisma.farmer.findUnique({
        where: { id: farmerId },
        include: {
            checkIns: {
                orderBy: { createdAt: 'desc' },
                take: 10,
            },
            alerts: {
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    assignedTo: {
                        select: { name: true, email: true },
                    },
                },
            },
        },
    });

    if (!farmer) {
        throw new Error('Farmer not found');
    }

    return farmer;
}

// ============================================
// ALERTS MANAGEMENT
// ============================================

/**
 * Get alerts list with filters
 */
export async function getAlerts(filters: AlertFilterInput, adminId: string, adminDistrict?: string | null) {
    const where: any = {};

    if (adminDistrict) {
        where.farmer = { district: adminDistrict };
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (filters.severity) {
        where.severity = filters.severity;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
        prisma.alert.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                farmer: {
                    select: { name: true, mobile: true, district: true },
                },
                checkIn: {
                    select: { riskLevel: true, riskScore: true, createdAt: true },
                },
                assignedTo: {
                    select: { name: true, email: true },
                },
            },
        }),
        prisma.alert.count({ where }),
    ]);

    return {
        alerts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Update alert status
 */
export async function updateAlert(alertId: string, input: UpdateAlertInput, adminId: string) {
    const alert = await prisma.alert.findUnique({
        where: { id: alertId },
    });

    if (!alert) {
        throw new Error('Alert not found');
    }

    const updateData: any = {};

    if (input.status) {
        updateData.status = input.status;
        if (input.status === 'acknowledged') {
            updateData.acknowledgedAt = new Date();
        } else if (input.status === 'resolved') {
            updateData.resolvedAt = new Date();
        }
    }

    if (input.resolution) {
        updateData.resolution = input.resolution;
    }

    if (input.assignedToId) {
        updateData.assignedToId = input.assignedToId;
    } else if (!alert.assignedToId) {
        // Auto-assign to current admin if not already assigned
        updateData.assignedToId = adminId;
    }

    return prisma.alert.update({
        where: { id: alertId },
        data: updateData,
        include: {
            farmer: {
                select: { name: true, mobile: true, district: true },
            },
        },
    });
}

// ============================================
// COUNSELOR MANAGEMENT
// ============================================

/**
 * Get counselors list
 */
export async function getCounselors(district?: string) {
    const where: any = {
        role: 'COUNSELOR',
        isActive: true,
    };

    if (district) {
        where.district = district;
    }

    return prisma.adminUser.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            district: true,
            _count: {
                select: { assignedAlerts: true },
            },
        },
    });
}

/**
 * Assign counselor to farmer
 */
export async function assignCounselor(farmerId: string, counselorId: string) {
    // Verify counselor exists
    const counselor = await prisma.adminUser.findUnique({
        where: { id: counselorId, role: 'COUNSELOR' },
    });

    if (!counselor) {
        throw new Error('Counselor not found');
    }

    // Assign to any unassigned alerts for this farmer
    await prisma.alert.updateMany({
        where: {
            farmerId,
            assignedToId: null,
            status: 'pending',
        },
        data: { assignedToId: counselorId },
    });

    return { success: true, counselor: counselor.name };
}

// ============================================
// CHECK-INS & ANALYTICS
// ============================================

/**
 * Get check-ins list with filters
 */
export async function getCheckIns(filters: CheckInFilterInput, adminDistrict?: string | null) {
    const where: any = {};

    if (adminDistrict) {
        where.farmer = { district: adminDistrict };
    }

    if (filters.farmerId) {
        where.farmerId = filters.farmerId;
    }

    if (filters.riskLevel) {
        where.riskLevel = filters.riskLevel;
    }

    if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
            where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
            where.createdAt.lte = new Date(filters.dateTo);
        }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [checkIns, total] = await Promise.all([
        prisma.checkIn.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                farmer: {
                    select: { name: true, mobile: true, district: true },
                },
            },
        }),
        prisma.checkIn.count({ where }),
    ]);

    return {
        checkIns,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get risk trends over time
 */
export async function getRiskTrends(days: number = 30, district?: string) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
        createdAt: { gte: startDate },
    };

    if (district) {
        where.farmer = { district };
    }

    const checkIns = await prisma.checkIn.findMany({
        where,
        select: {
            riskLevel: true,
            riskScore: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailyStats: Record<string, { low: number; moderate: number; high: number; critical: number; avgScore: number; count: number }> = {};

    for (const checkIn of checkIns) {
        const date = checkIn.createdAt.toISOString().split('T')[0];
        if (!dailyStats[date]) {
            dailyStats[date] = { low: 0, moderate: 0, high: 0, critical: 0, avgScore: 0, count: 0 };
        }

        const level = checkIn.riskLevel.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical';
        dailyStats[date][level]++;
        dailyStats[date].avgScore += checkIn.riskScore;
        dailyStats[date].count++;
    }

    // Calculate averages
    const trends = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats,
        avgScore: stats.count > 0 ? Math.round(stats.avgScore / stats.count) : 0,
    }));

    return { trends, totalCheckIns: checkIns.length };
}

export default {
    adminLogin,
    registerAdmin,
    getDashboardStats,
    getFarmers,
    getFarmerDetails,
    getAlerts,
    updateAlert,
    getCounselors,
    assignCounselor,
    getCheckIns,
    getRiskTrends,
};

