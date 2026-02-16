import { z } from 'zod';

/**
 * Update farmer profile schema
 */
export const updateFarmerSchema = z.object({
    name: z.string()
        .min(2, { message: 'नाव किमान 2 अक्षरांचे असावे' })
        .max(100, { message: 'नाव 100 अक्षरांपेक्षा कमी असावे' })
        .trim()
        .optional(),

    village: z.string()
        .min(2, { message: 'गाव किमान 2 अक्षरांचे असावे' })
        .max(100, { message: 'गाव 100 अक्षरांपेक्षा कमी असावे' })
        .trim()
        .optional(),

    taluka: z.string()
        .min(2, { message: 'तालुका किमान 2 अक्षरांचा असावा' })
        .max(100, { message: 'तालुका 100 अक्षरांपेक्षा कमी असावा' })
        .trim()
        .optional(),

    district: z.string()
        .min(2, { message: 'जिल्हा किमान 2 अक्षरांचा असावा' })
        .max(100, { message: 'जिल्हा 100 अक्षरांपेक्षा कमी असावा' })
        .trim()
        .optional(),

    farmSize: z.number()
        .min(0, { message: 'शेताचा आकार 0 पेक्षा मोठा असावा' })
        .max(10000, { message: 'शेताचा आकार 10000 एकरांपेक्षा कमी असावा' })
        .optional(),

    preferredLang: z.enum(['mr', 'hi', 'en', 'te', 'kn', 'pa', 'gu', 'bn']).optional(),
});

export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>;

/**
 * Get check-ins query schema
 */
export const getCheckInsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type GetCheckInsQuery = z.infer<typeof getCheckInsQuerySchema>;

/**
 * Get stats query schema
 */
export const getStatsQuerySchema = z.object({
    period: z.enum(['week', 'month', '3months', 'year']).optional().default('month'),
});

export type GetStatsQuery = z.infer<typeof getStatsQuerySchema>;
