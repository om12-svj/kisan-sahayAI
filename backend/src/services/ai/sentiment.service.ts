/**
 * KISAN SAHAY - AI Sentiment Analysis Service
 * Analyzes text sentiment and generates personalized feedback
 */

// ============================================
// TYPES
// ============================================

export interface SentimentResult {
    score: number;           // -1 (negative) to 1 (positive)
    label: 'negative' | 'neutral' | 'positive';
    confidence: number;      // 0 to 1
    keywords: string[];      // Extracted keywords
    riskIndicators: string[];
}

export interface FeedbackResult {
    message: string;
    supportLevel: 'low' | 'moderate' | 'high' | 'critical';
    suggestions: string[];
    resources: string[];
}

// ============================================
// KEYWORD DICTIONARIES (Multi-language)
// ============================================

const NEGATIVE_KEYWORDS = {
    mr: [
        'त्रास', 'दुःख', 'निराशा', 'थकवा', 'चिंता', 'भीती', 'अपयश', 'कर्ज',
        'नुकसान', 'मृत्यू', 'आत्महत्या', 'संपवणे', 'थांबवणे', 'उपाय नाही',
        'झोप नाही', 'भूक नाही', 'एकटे', 'कोणी नाही', 'हरले',
    ],
    hi: [
        'तनाव', 'दुख', 'निराशा', 'थकान', 'चिंता', 'डर', 'असफलता', 'कर्ज',
        'नुकसान', 'मौत', 'आत्महत्या', 'खत्म', 'रोकना', 'कोई उपाय नहीं',
        'नींद नहीं', 'भूख नहीं', 'अकेला', 'कोई नहीं', 'हार गया',
    ],
    en: [
        'stress', 'sadness', 'hopeless', 'tired', 'anxiety', 'fear', 'failure', 'debt',
        'loss', 'death', 'suicide', 'end', 'stop', 'no way', 'no solution',
        'cannot sleep', 'no appetite', 'alone', 'nobody', 'lost',
    ],
};

const CRITICAL_INDICATORS = {
    mr: ['आत्महत्या', 'मरायचे', 'संपवायचे', 'जगायचे नाही', 'फास', 'विष'],
    hi: ['आत्महत्या', 'मरना', 'खत्म करना', 'जीना नहीं', 'फांसी', 'जहर'],
    en: ['suicide', 'kill myself', 'end it', 'dont want to live', 'hanging', 'poison'],
};

const POSITIVE_KEYWORDS = {
    mr: ['आशा', 'आनंद', 'शांती', 'मदत', 'कुटुंब', 'मित्र', 'यश', 'प्रगती'],
    hi: ['आशा', 'खुशी', 'शांति', 'मदद', 'परिवार', 'दोस्त', 'सफलता', 'प्रगति'],
    en: ['hope', 'happy', 'peace', 'help', 'family', 'friend', 'success', 'progress'],
};

// ============================================
// SENTIMENT ANALYSIS
// ============================================

/**
 * Analyze text sentiment using keyword-based analysis
 * (Can be enhanced with ML models in production)
 */
export function analyzeSentiment(
    text: string,
    language: string = 'mr'
): SentimentResult {
    if (!text || text.trim().length === 0) {
        return {
            score: 0,
            label: 'neutral',
            confidence: 1,
            keywords: [],
            riskIndicators: [],
        };
    }

    const lang = (language as 'mr' | 'hi' | 'en') || 'mr';
    const lowerText = text.toLowerCase();

    // Check for critical indicators first
    const criticalWords = CRITICAL_INDICATORS[lang] || CRITICAL_INDICATORS.mr;
    const foundCritical: string[] = [];
    for (const word of criticalWords) {
        if (lowerText.includes(word.toLowerCase())) {
            foundCritical.push(word);
        }
    }

    // Count negative keywords
    const negativeWords = NEGATIVE_KEYWORDS[lang] || NEGATIVE_KEYWORDS.mr;
    const foundNegative: string[] = [];
    for (const word of negativeWords) {
        if (lowerText.includes(word.toLowerCase())) {
            foundNegative.push(word);
        }
    }

    // Count positive keywords
    const positiveWords = POSITIVE_KEYWORDS[lang] || POSITIVE_KEYWORDS.mr;
    const foundPositive: string[] = [];
    for (const word of positiveWords) {
        if (lowerText.includes(word.toLowerCase())) {
            foundPositive.push(word);
        }
    }

    // Calculate sentiment score
    const totalWords = foundNegative.length + foundPositive.length + foundCritical.length;
    let score = 0;

    if (foundCritical.length > 0) {
        score = -1; // Critical indicators always result in most negative score
    } else if (totalWords > 0) {
        const positiveWeight = foundPositive.length;
        const negativeWeight = foundNegative.length * -1;
        score = (positiveWeight + negativeWeight) / totalWords;
    }

    // Determine label
    let label: 'negative' | 'neutral' | 'positive' = 'neutral';
    if (score < -0.3) label = 'negative';
    else if (score > 0.3) label = 'positive';

    // Calculate confidence based on keyword matches
    const confidence = Math.min(1, (totalWords / 5) * 0.8 + 0.2);

    return {
        score: Math.round(score * 100) / 100,
        label,
        confidence: Math.round(confidence * 100) / 100,
        keywords: [...foundPositive, ...foundNegative],
        riskIndicators: foundCritical,
    };
}

/**
 * Analyze risk based on check-in data and notes
 */
export function analyzeRiskFromCheckIn(
    hopeLevel: number,
    notes: string | undefined,
    language: string = 'mr'
): { additionalRiskScore: number; indicators: string[] } {
    let additionalScore = 0;
    const indicators: string[] = [];

    // Analyze notes if provided
    if (notes && notes.trim().length > 0) {
        const sentiment = analyzeSentiment(notes, language);

        // Critical indicators immediately add high risk
        if (sentiment.riskIndicators.length > 0) {
            additionalScore += 30;
            indicators.push('crisis_keywords_detected');
        }

        // Negative sentiment adds moderate risk
        if (sentiment.label === 'negative') {
            additionalScore += 10 * Math.abs(sentiment.score);
        }

        // Add detected keywords as indicators
        indicators.push(...sentiment.riskIndicators);
    }

    // Very low hope level
    if (hopeLevel <= 2) {
        additionalScore += 15;
        indicators.push('very_low_hope');
    }

    return {
        additionalRiskScore: Math.round(additionalScore),
        indicators,
    };
}

// ============================================
// PERSONALIZED FEEDBACK GENERATION
// ============================================

const FEEDBACK_TEMPLATES = {
    critical: {
        mr: {
            message: 'तुम्ही खूप कठीण परिस्थितीतून जात आहात. कृपया आत्ताच मदत घ्या.',
            suggestions: [
                'आत्ताच हेल्पलाइन कॉल करा: 1800-233-4000',
                'जवळच्या व्यक्तीशी बोला',
                'एकटे राहू नका',
            ],
            resources: [
                'iCall: 9152987821',
                'Vandrevala Foundation: 1860-2662-345',
                'जिल्हा रुग्णालय मानसिक आरोग्य विभाग',
            ],
        },
        hi: {
            message: 'आप बहुत कठिन समय से गुजर रहे हैं। कृपया अभी मदद लें।',
            suggestions: [
                'अभी हेल्पलाइन कॉल करें: 1800-233-4000',
                'किसी करीबी से बात करें',
                'अकेले न रहें',
            ],
            resources: [
                'iCall: 9152987821',
                'Vandrevala Foundation: 1860-2662-345',
                'जिला अस्पताल मानसिक स्वास्थ्य विभाग',
            ],
        },
        en: {
            message: 'You are going through a very difficult time. Please seek help now.',
            suggestions: [
                'Call helpline now: 1800-233-4000',
                'Talk to someone close',
                'Do not stay alone',
            ],
            resources: [
                'iCall: 9152987821',
                'Vandrevala Foundation: 1860-2662-345',
                'District Hospital Mental Health Department',
            ],
        },
    },
    high: {
        mr: {
            message: 'आम्हाला तुमची काळजी आहे. कृपया मदत घेण्यास संकोच करू नका.',
            suggestions: [
                'कुटुंबातील सदस्यांशी बोला',
                'जवळच्या प्राथमिक आरोग्य केंद्राला भेट द्या',
                'नियमित झोप आणि आहार घ्या',
            ],
            resources: [
                'किसान कॉल सेंटर: 1551',
                'कृषी विभाग हेल्पलाइन',
            ],
        },
        hi: {
            message: 'हमें आपकी चिंता है। कृपया मदद लेने में संकोच न करें।',
            suggestions: [
                'परिवार के सदस्यों से बात करें',
                'नजदीकी प्राथमिक स्वास्थ्य केंद्र जाएं',
                'नियमित नींद और भोजन लें',
            ],
            resources: [
                'किसान कॉल सेंटर: 1551',
                'कृषि विभाग हेल्पलाइन',
            ],
        },
        en: {
            message: 'We are concerned about you. Please do not hesitate to seek help.',
            suggestions: [
                'Talk to family members',
                'Visit nearest Primary Health Center',
                'Maintain regular sleep and diet',
            ],
            resources: [
                'Kisan Call Center: 1551',
                'Agriculture Department Helpline',
            ],
        },
    },
    moderate: {
        mr: {
            message: 'तुम्ही काही आव्हानांना तोंड देत आहात, पण तुम्ही एकटे नाही.',
            suggestions: [
                'दररोज थोडा वेळ व्यायाम करा',
                'मित्र किंवा शेजाऱ्यांशी बोला',
                'छोट्या यशांचा आनंद घ्या',
            ],
            resources: [],
        },
        hi: {
            message: 'आप कुछ चुनौतियों का सामना कर रहे हैं, लेकिन आप अकेले नहीं हैं।',
            suggestions: [
                'रोज थोड़ा व्यायाम करें',
                'दोस्तों या पड़ोसियों से बात करें',
                'छोटी सफलताओं का आनंद लें',
            ],
            resources: [],
        },
        en: {
            message: 'You are facing some challenges, but you are not alone.',
            suggestions: [
                'Exercise a little every day',
                'Talk to friends or neighbors',
                'Celebrate small wins',
            ],
            resources: [],
        },
    },
    low: {
        mr: {
            message: 'तुमची स्थिती चांगली आहे! असेच सकारात्मक राहा.',
            suggestions: [
                'नियमित चेक-इन सुरू ठेवा',
                'इतर शेतकऱ्यांना प्रेरित करा',
                'नवीन शेती तंत्र शिका',
            ],
            resources: [],
        },
        hi: {
            message: 'आपकी स्थिति अच्छी है! ऐसे ही सकारात्मक रहें।',
            suggestions: [
                'नियमित चेक-इन जारी रखें',
                'अन्य किसानों को प्रेरित करें',
                'नई कृषि तकनीक सीखें',
            ],
            resources: [],
        },
        en: {
            message: 'You are doing well! Keep staying positive.',
            suggestions: [
                'Continue regular check-ins',
                'Inspire other farmers',
                'Learn new farming techniques',
            ],
            resources: [],
        },
    },
};

/**
 * Generate personalized feedback based on risk level
 */
export function generatePersonalizedFeedback(
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL',
    language: string = 'mr'
): FeedbackResult {
    const lang = (language as 'mr' | 'hi' | 'en') || 'mr';
    const level = riskLevel.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical';

    const template = FEEDBACK_TEMPLATES[level][lang] || FEEDBACK_TEMPLATES[level].mr;

    return {
        message: template.message,
        supportLevel: level,
        suggestions: template.suggestions,
        resources: template.resources,
    };
}

/**
 * Detect language from text (basic implementation)
 */
export function detectLanguage(text: string): 'mr' | 'hi' | 'en' {
    // Check for Devanagari script
    const hasDevanagari = /[\u0900-\u097F]/.test(text);

    if (!hasDevanagari) {
        return 'en';
    }

    // Distinguish between Marathi and Hindi (basic - can be enhanced)
    // Marathi-specific words
    const marathiIndicators = ['आहे', 'आहेत', 'होते', 'करतो', 'करते', 'तुम्ही', 'आम्ही'];
    const hindiIndicators = ['है', 'हैं', 'था', 'करता', 'करती', 'आप', 'हम'];

    let marathiScore = 0;
    let hindiScore = 0;

    for (const word of marathiIndicators) {
        if (text.includes(word)) marathiScore++;
    }
    for (const word of hindiIndicators) {
        if (text.includes(word)) hindiScore++;
    }

    return marathiScore >= hindiScore ? 'mr' : 'hi';
}

export default {
    analyzeSentiment,
    analyzeRiskFromCheckIn,
    generatePersonalizedFeedback,
    detectLanguage,
};
