import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { sendSuccess, errors } from '../../shared/utils/response';
import { asyncHandler } from '../../shared/middleware/error.middleware';
import * as checkInService from './checkin.service';
import { CreateCheckInInput, CheckInIdParam } from './checkin.schema';

/**
 * Create a new check-in
 * POST /checkins
 */
export const createCheckIn = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const input: CreateCheckInInput = req.body;
    const result = await checkInService.createCheckIn(req.user!.id, input);

    sendSuccess(res, {
        message: 'तपासणी यशस्वीरित्या जतन केली',
        checkIn: {
            id: result.checkIn.id,
            timestamp: result.checkIn.timestamp,
            riskScore: result.checkIn.riskScore,
            riskLevel: result.checkIn.riskLevel,
            criticalFactors: result.checkIn.criticalFactors,
        },
        response: result.response,
    }, 201);
});

/**
 * Get check-in by ID
 * GET /checkins/:id
 */
export const getCheckIn = asyncHandler(async (
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction
) => {
    const { id } = req.params as unknown as CheckInIdParam;
    const checkIn = await checkInService.getCheckInById(id, req.user!.id);

    if (!checkIn) {
        errors.notFound(res, 'Check-in');
        return;
    }

    sendSuccess(res, { checkIn });
});
