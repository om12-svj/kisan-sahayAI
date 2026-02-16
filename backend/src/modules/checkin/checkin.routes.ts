import { Router } from 'express';
import * as checkInController from './checkin.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, farmerOnly } from '../../shared/middleware/auth.middleware';
import { createCheckInSchema, checkInIdSchema } from './checkin.schema';

const router = Router();

// All routes require farmer authentication
router.use(authenticate, farmerOnly);

/**
 * @route POST /checkins
 * @desc Create a new check-in assessment
 * @access Private (Farmer)
 */
router.post(
    '/',
    validate(createCheckInSchema),
    checkInController.createCheckIn
);

/**
 * @route GET /checkins/:id
 * @desc Get check-in by ID
 * @access Private (Farmer - own check-ins only)
 */
router.get(
    '/:id',
    validate(checkInIdSchema, 'params'),
    checkInController.getCheckIn
);

export default router;
