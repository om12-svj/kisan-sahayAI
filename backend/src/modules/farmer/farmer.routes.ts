import { Router } from 'express';
import * as farmerController from './farmer.controller';
import { validate } from '../../shared/middleware/validate.middleware';
import { authenticate, farmerOnly } from '../../shared/middleware/auth.middleware';
import { updateFarmerSchema, getCheckInsQuerySchema, getStatsQuerySchema } from './farmer.schema';

const router = Router();

// All routes require farmer authentication
router.use(authenticate, farmerOnly);

/**
 * @route GET /farmers/me
 * @desc Get current farmer profile
 * @access Private (Farmer)
 */
router.get('/me', farmerController.getMe);

/**
 * @route PATCH /farmers/me
 * @desc Update current farmer profile
 * @access Private (Farmer)
 */
router.patch(
    '/me',
    validate(updateFarmerSchema),
    farmerController.updateMe
);

/**
 * @route GET /farmers/me/checkins
 * @desc Get current farmer's check-in history
 * @access Private (Farmer)
 */
router.get(
    '/me/checkins',
    validate(getCheckInsQuerySchema, 'query'),
    farmerController.getMyCheckIns
);

/**
 * @route GET /farmers/me/stats
 * @desc Get current farmer's statistics
 * @access Private (Farmer)
 */
router.get(
    '/me/stats',
    validate(getStatsQuerySchema, 'query'),
    farmerController.getMyStats
);

export default router;
