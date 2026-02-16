import { z } from 'zod';

/**
 * Create check-in schema
 */
export const createCheckInSchema = z.object({
    cropCondition: z.enum(['excellent', 'good', 'moderate', 'poor', 'destroyed'], {
        message: 'अवैध पीक स्थिती',
    }),

    loanPressure: z.enum(['none', 'low', 'medium', 'high', 'severe'], {
        message: 'अवैध कर्ज दबाव',
    }),

    sleepQuality: z.enum(['good', 'fair', 'poor', 'very_poor'], {
        message: 'अवैध झोप गुणवत्ता',
    }),

    familySupport: z.enum(['strong', 'moderate', 'weak', 'none'], {
        message: 'अवैध कुटुंब आधार',
    }),

    hopeLevel: z.number()
        .int({ message: 'आशा स्तर पूर्णांक असावा' })
        .min(1, { message: 'आशा स्तर 1 ते 10 दरम्यान असावा' })
        .max(10, { message: 'आशा स्तर 1 ते 10 दरम्यान असावा' }),

    notes: z.string().max(1000, { message: 'नोट्स 1000 अक्षरांपेक्षा कमी असाव्यात' }).optional(),
});

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;

/**
 * Check-in ID param schema
 */
export const checkInIdSchema = z.object({
    id: z.string().min(1, { message: 'Check-in ID is required' }),
});

export type CheckInIdParam = z.infer<typeof checkInIdSchema>;
