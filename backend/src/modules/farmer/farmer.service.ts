import { prisma } from '../../config';
import { SafeFarmer, PaginatedResponse } from '../../shared/types';
import { Prisma } from '@prisma/client';
import { UpdateFarmerInput, GetCheckInsQuery, GetStatsQuery } from './farmer.schema';

// Type for CheckIn from Prisma
type CheckIn = Prisma.CheckInGetPayload<{}>;

/**
 * Get farmer by ID
 */
export async function getFarmerById(id: string): Promise<SafeFarmer | null> {
    const farmer = await prisma.farmer.findUnique({
        where: { id },
    });

    if (!farmer) return null;

    const { passwordHash, ...safeFarmer } = farmer;
    return safeFarmer as SafeFarmer;
}

/**
 * Update farmer profile
 */
export async function updateFarmer(id: string, input: UpdateFarmerInput): Promise<SafeFarmer> {
    const farmer = await prisma.farmer.update({
        where: { id },
        data: {
            ...input,
            ...(input.preferredLang && { preferredLang: input.preferredLang as any }),
        },
    });

    const { passwordHash, ...safeFarmer } = farmer;
    return safeFarmer as SafeFarmer;
}

/**
 * Get farmer's check-in history
 */
export async function getFarmerCheckIns(
    farmerId: string,
    query: GetCheckInsQuery
): Promise<PaginatedResponse<CheckIn>> {
    const { page, limit, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CheckInWhereInput = { farmerId };

    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp = { ...where.timestamp as object, gte: new Date(startDate) };
        if (endDate) where.timestamp = { ...where.timestamp as object, lte: new Date(endDate) };
    }

    const [checkIns, total] = await Promise.all([
        prisma.checkIn.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            skip,
            take: limit,
        }),
        prisma.checkIn.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        items: checkIns,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
        },
    };
}

/**
 * Get farmer statistics
 */
export async function getFarmerStats(farmerId: string, query: GetStatsQuery) {
    const { period } = query;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        case '3months':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        default:
            startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get check-ins in the period
    const checkIns = await prisma.checkIn.findMany({
        where: {
            farmerId,
            timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'asc' },
    });

    if (checkIns.length === 0) {
        return {
            averageRiskScore: 0,
            checkInCount: 0,
            riskTrend: 'stable' as const,
            commonCriticalFactors: [],
            period,
        };
    }

    // Calculate average risk score
    const averageRiskScore = Math.round(
        checkIns.reduce((sum: number, c: CheckIn) => sum + c.riskScore, 0) / checkIns.length
    );

    // Calculate risk trend
    let riskTrend: 'improving' | 'stable' | 'declining' = 'stable';

    if (checkIns.length >= 2) {
        const firstHalf = checkIns.slice(0, Math.floor(checkIns.length / 2));
        const secondHalf = checkIns.slice(Math.floor(checkIns.length / 2));

        const firstAvg = firstHalf.reduce((sum: number, c: CheckIn) => sum + c.riskScore, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum: number, c: CheckIn) => sum + c.riskScore, 0) / secondHalf.length;

        const diff = secondAvg - firstAvg;
        if (diff > 2) riskTrend = 'declining';
        else if (diff < -2) riskTrend = 'improving';
    }

    // Find common critical factors (criticalFactors is stored as JSON string in SQLite)
    const factorCounts: Record<string, number> = {};
    checkIns.forEach((c: CheckIn) => {
        const factors: string[] = JSON.parse(c.criticalFactors || '[]');
        factors.forEach((f: string) => {
            factorCounts[f] = (factorCounts[f] || 0) + 1;
        });
    });

    const commonCriticalFactors = Object.entries(factorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([factor]) => factor);

    return {
        averageRiskScore,
        checkInCount: checkIns.length,
        riskTrend,
        commonCriticalFactors,
        period,
    };
}
