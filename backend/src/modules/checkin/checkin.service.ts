import { prisma } from '../../config';
import { Prisma } from '@prisma/client';
import { CheckInResponse, RiskAssessmentInput } from '../../shared/types';
import { ApiError } from '../../shared/middleware/error.middleware';
import { assessRisk, shouldTriggerAlert, getAlertSeverity } from './risk-assessment';
import { CreateCheckInInput } from './checkin.schema';
import { analyzeRiskFromCheckIn } from '../../services/ai';

// Types from Prisma
type CheckIn = Prisma.CheckInGetPayload<{}>;
type Alert = Prisma.AlertGetPayload<{}>;

// ============================================
// RESPONSE MESSAGES
// ============================================

const MESSAGES = {
    LOW: {
        greeting: 'नमस्कार! तुमची स्थिती चांगली दिसत आहे.',
        body: 'तुम्ही योग्य मार्गावर आहात. असेच चांगले काम सुरू ठेवा आणि स्वतःची काळजी घ्या.',
        closing: 'आम्ही तुमच्या सोबत आहोत! 💚',
    },
    MODERATE: {
        greeting: 'नमस्कार! आम्ही तुमची काळजी घेतो.',
        body: 'काही आव्हाने असू शकतात, पण तुम्ही एकटे नाही. शेजारी, मित्र किंवा कुटुंबाशी बोला.',
        closing: 'छोट्या पावलांनी मोठा बदल होतो! 💛',
    },
    HIGH: {
        greeting: 'प्रिय शेतकरी बंधू/भगिनी,',
        body: 'तुम्ही कठीण परिस्थितीतून जात आहात हे आम्हाला समजते. कृपया खाली दिलेल्या हेल्पलाइनवर संपर्क साधा. मदत उपलब्ध आहे.',
        closing: 'तुम्ही महत्वाचे आहात! मदत मागण्यात कोणतीही लाज नाही! 🧡',
    },
    CRITICAL: {
        greeting: '🆘 प्रिय शेतकरी बंधू/भगिनी,',
        body: 'तुम्ही खूप कठीण परिस्थितीत आहात. आत्ताच मदत मिळवणे खूप महत्वाचे आहे. कृपया लगेच हेल्पलाइनवर कॉल करा: 1800-233-4000',
        closing: 'तुमचे जीवन मौल्यवान आहे! आम्ही तुमच्या सोबत आहोत! ❤️',
    },
};

const SUGGESTIONS = {
    crop_poor: {
        icon: '🌾',
        title: 'कृषी विभाग संपर्क',
        desc: 'पीक विमा आणि नुकसान भरपाईसाठी तालुका कृषी अधिकाऱ्यांशी संपर्क साधा',
    },
    loan_high: {
        icon: '💰',
        title: 'कर्ज पुनर्रचना',
        desc: 'बँकेत कर्ज पुनर्रचनेसाठी अर्ज करा. सरकारी योजनांचा लाभ घ्या',
    },
    sleep_poor: {
        icon: '😴',
        title: 'झोप सुधारणा',
        desc: 'रात्री उशिरा मोबाइल वापर टाळा. नियमित वेळेत झोपा',
    },
    family_weak: {
        icon: '👨‍👩‍👧‍👦',
        title: 'कुटुंब संवाद',
        desc: 'कुटुंबातील सदस्यांशी मोकळेपणाने बोला. एकत्र वेळ घालवा',
    },
    hope_low: {
        icon: '💪',
        title: 'सकारात्मक विचार',
        desc: 'कठीण काळ नक्की संपतो. यशस्वी शेतकऱ्यांच्या कथा वाचा',
    },
    agriculture: {
        icon: '🌱',
        title: 'कृषी सल्ला',
        desc: 'नवीन पिक पद्धती आणि शेती तंत्रज्ञानाबद्दल जाणून घ्या',
    },
    government: {
        icon: '🏛️',
        title: 'सरकारी योजना',
        desc: 'पीएम किसान, विमा योजना आणि इतर लाभ मिळवा',
    },
};

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Create a new check-in
 */
export async function createCheckIn(
    farmerId: string,
    input: CreateCheckInInput
): Promise<{ checkIn: CheckIn; response: CheckInResponse }> {
    // Get farmer's preferred language for AI analysis
    const farmer = await prisma.farmer.findUnique({
        where: { id: farmerId },
        select: { preferredLang: true },
    });

    // Build assessment input
    const assessmentInput: RiskAssessmentInput = {
        cropCondition: input.cropCondition as any,
        loanPressure: input.loanPressure as any,
        sleepQuality: input.sleepQuality as any,
        familySupport: input.familySupport as any,
        hopeLevel: input.hopeLevel,
        notes: input.notes,
    };

    // Assess risk using structured questions
    const assessment = assessRisk(assessmentInput);

    // AI-enhanced: Analyze notes for additional risk indicators
    const aiAnalysis = analyzeRiskFromCheckIn(
        input.hopeLevel,
        input.notes,
        farmer?.preferredLang || 'mr'
    );

    // Combine AI insights with structured assessment
    let finalRiskScore = assessment.riskScore + aiAnalysis.additionalRiskScore;
    let finalRiskLevel = assessment.riskLevel;
    const allCriticalFactors = [...assessment.criticalFactors, ...aiAnalysis.indicators];

    // Upgrade risk level if AI detected crisis keywords
    if (aiAnalysis.indicators.includes('crisis_keywords_detected')) {
        finalRiskScore = Math.min(100, finalRiskScore + 20);
        if (finalRiskLevel === 'LOW') finalRiskLevel = 'MODERATE';
        if (finalRiskLevel === 'MODERATE') finalRiskLevel = 'HIGH';
        if (finalRiskLevel === 'HIGH') finalRiskLevel = 'CRITICAL';
    }

    // Recalculate risk level based on final score
    if (finalRiskScore >= 80) finalRiskLevel = 'CRITICAL';
    else if (finalRiskScore >= 60) finalRiskLevel = 'HIGH';
    else if (finalRiskScore >= 40) finalRiskLevel = 'MODERATE';
    else finalRiskLevel = 'LOW';

    // Create check-in record (criticalFactors stored as JSON string for SQLite)
    const checkIn = await prisma.checkIn.create({
        data: {
            farmerId,
            cropCondition: input.cropCondition,
            loanPressure: input.loanPressure,
            sleepQuality: input.sleepQuality,
            familySupport: input.familySupport,
            hopeLevel: input.hopeLevel,
            notes: input.notes,
            riskScore: finalRiskScore,
            riskLevel: finalRiskLevel,
            criticalFactors: JSON.stringify(allCriticalFactors),
            alertTriggered: shouldTriggerAlert(finalRiskLevel),
        },
    });

    // Create alert if needed
    if (shouldTriggerAlert(finalRiskLevel)) {
        await createAlert(farmerId, checkIn.id, finalRiskLevel);
    }

    // Update farmer's last active time
    await prisma.farmer.update({
        where: { id: farmerId },
        data: {
            lastActiveAt: new Date(),
            // Set critical watch if risk is high/critical
            ...(finalRiskLevel === 'CRITICAL' && { status: 'critical_watch' }),
        },
    });

    // Generate response
    const response = generateResponse(finalRiskLevel, allCriticalFactors);

    return { checkIn, response };
}

/**
 * Get check-in by ID
 */
export async function getCheckInById(
    checkInId: string,
    farmerId: string
): Promise<CheckIn | null> {
    const checkIn = await prisma.checkIn.findFirst({
        where: {
            id: checkInId,
            farmerId, // Ensure farmer can only access their own check-ins
        },
    });

    return checkIn;
}

/**
 * Create an alert for high/critical risk check-ins
 */
async function createAlert(
    farmerId: string,
    checkInId: string,
    riskLevel: string
): Promise<Alert> {
    const severity = getAlertSeverity(riskLevel);

    if (!severity) {
        throw new Error('Cannot create alert for non-high/critical risk level');
    }

    // Find assigned counselor for the farmer
    const farmer = await prisma.farmer.findUnique({
        where: { id: farmerId },
        select: { counselorId: true },
    });

    const alert = await prisma.alert.create({
        data: {
            farmerId,
            checkInId,
            severity,
            assignedToId: farmer?.counselorId,
        },
    });

    // Mark check-in as having triggered an alert
    await prisma.checkIn.update({
        where: { id: checkInId },
        data: {
            alertTriggered: true,
            counselorNotified: !!farmer?.counselorId,
        },
    });

    // TODO: Send notification to counselor
    if (farmer?.counselorId) {
        console.log(`[ALERT] Notifying counselor ${farmer.counselorId} about high-risk check-in`);
    }

    return alert;
}

/**
 * Generate response message and suggestions
 */
function generateResponse(
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
    criticalFactors: string[]
): CheckInResponse {
    const message = MESSAGES[riskLevel];

    // Build suggestions based on critical factors
    const suggestions: CheckInResponse['suggestions'] = [];

    for (const factor of criticalFactors) {
        const suggestion = SUGGESTIONS[factor as keyof typeof SUGGESTIONS];
        if (suggestion) {
            suggestions.push(suggestion);
        }
    }

    // Add general suggestions if needed
    if (suggestions.length < 2) {
        suggestions.push(SUGGESTIONS.agriculture);
    }
    if (riskLevel !== 'LOW' && suggestions.length < 3) {
        suggestions.push(SUGGESTIONS.government);
    }

    return {
        message,
        suggestions: suggestions.slice(0, 4), // Max 4 suggestions
        showEmergency: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
    };
}
