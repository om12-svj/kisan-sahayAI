import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { sendSuccess, sendPaginated } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import * as farmerService from './farmer.service';
import { UpdateFarmerInput, GetCheckInsQuery, GetStatsQuery } from './farmer.schema';

/**
 * Get current farmer profile
 * GET /farmers/me
 */
export const getMe = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const farmer = await farmerService.getFarmerById(req.user!.id);
    sendSuccess(res, { farmer });
});

/**
 * Update current farmer profile
 * PATCH /farmers/me
 */
export const updateMe = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const input: UpdateFarmerInput = req.body;
    const farmer = await farmerService.updateFarmer(req.user!.id, input);

    sendSuccess(res, {
        message: 'प्रोफाइल यशस्वीरित्या अपडेट झाले',
        farmer,
    });
});

/**
 * Get current farmer's check-in history
 * GET /farmers/me/checkins
 */
export const getMyCheckIns = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const query = req.query as unknown as GetCheckInsQuery;
    const result = await farmerService.getFarmerCheckIns(req.user!.id, query);

    sendPaginated(
        res,
        result.items,
        result.pagination.total,
        result.pagination.page,
        result.pagination.limit
    );
});

/**
 * Get current farmer's statistics
 * GET /farmers/me/stats
 */
export const getMyStats = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const query = req.query as unknown as GetStatsQuery;
    const stats = await farmerService.getFarmerStats(req.user!.id, query);

    sendSuccess(res, { stats });
});
