import {
    RiskAssessmentInput,
    RiskAssessmentResult,
    CropCondition,
    LoanPressure,
    SleepQuality,
    FamilySupport
} from '../../shared/types';

// ============================================
// RISK WEIGHTS (same as frontend)
// ============================================

const RISK_WEIGHTS = {
    crop: {
        excellent: 0,
        good: 1,
        moderate: 2,
        poor: 3,
        destroyed: 5
    } as Record<CropCondition, number>,

    loan: {
        none: 0,
        low: 1,
        medium: 2,
        high: 4,
        severe: 5
    } as Record<LoanPressure, number>,

    sleep: {
        good: 0,
        fair: 1,
        poor: 3,
        very_poor: 5
    } as Record<SleepQuality, number>,

    family: {
        strong: 0,
        moderate: 1,
        weak: 3,
        none: 5
    } as Record<FamilySupport, number>,
};

// ============================================
// RISK LEVELS
// ============================================

const RISK_LEVELS = {
    LOW: { min: 0, max: 6, label: 'LOW' as const },
    MODERATE: { min: 7, max: 12, label: 'MODERATE' as const },
    HIGH: { min: 13, max: 18, label: 'HIGH' as const },
    CRITICAL: { min: 19, max: 30, label: 'CRITICAL' as const },
};

// ============================================
// ASSESSMENT FUNCTION
// ============================================

/**
 * Assess risk based on input data
 * This mirrors the frontend logic for consistency
 */
export function assessRisk(input: RiskAssessmentInput): RiskAssessmentResult {
    const factors = {
        crop: RISK_WEIGHTS.crop[input.cropCondition] || 0,
        loan: RISK_WEIGHTS.loan[input.loanPressure] || 0,
        sleep: RISK_WEIGHTS.sleep[input.sleepQuality] || 0,
        family: RISK_WEIGHTS.family[input.familySupport] || 0,
        // Hope level inverse scoring (low hope = high risk)
        hope: Math.max(0, 5 - Math.floor(input.hopeLevel / 2)),
    };

    // Calculate total score
    const riskScore = Object.values(factors).reduce((a, b) => a + b, 0);

    // Determine risk level
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';

    for (const level of Object.values(RISK_LEVELS)) {
        if (riskScore >= level.min && riskScore <= level.max) {
            riskLevel = level.label;
            break;
        }
    }

    // Identify critical factors
    const criticalFactors = identifyCriticalFactors(input);

    return {
        riskScore,
        riskLevel,
        criticalFactors,
        factors,
    };
}

/**
 * Identify critical factors that need attention
 */
function identifyCriticalFactors(input: RiskAssessmentInput): string[] {
    const critical: string[] = [];

    if (input.cropCondition === 'poor' || input.cropCondition === 'destroyed') {
        critical.push('crop_poor');
    }

    if (input.loanPressure === 'high' || input.loanPressure === 'severe') {
        critical.push('loan_high');
    }

    if (input.sleepQuality === 'poor' || input.sleepQuality === 'very_poor') {
        critical.push('sleep_poor');
    }

    if (input.familySupport === 'weak' || input.familySupport === 'none') {
        critical.push('family_weak');
    }

    if (input.hopeLevel <= 4) {
        critical.push('hope_low');
    }

    return critical;
}

/**
 * Determine if an alert should be triggered
 */
export function shouldTriggerAlert(riskLevel: string): boolean {
    return riskLevel === 'HIGH' || riskLevel === 'CRITICAL';
}

/**
 * Determine alert severity
 */
export function getAlertSeverity(riskLevel: string): 'high' | 'critical' | null {
    if (riskLevel === 'CRITICAL') return 'critical';
    if (riskLevel === 'HIGH') return 'high';
    return null;
}
