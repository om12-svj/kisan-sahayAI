/**
 * KISAN SAHAY - Internationalization Service
 * Multi-language support for Marathi, Hindi, English
 */

// Supported languages
export type LanguageCode = 'mr' | 'hi' | 'en' | 'te' | 'kn' | 'pa' | 'gu' | 'bn';

export const SUPPORTED_LANGUAGES: Record<LanguageCode, string> = {
    mr: 'मराठी',
    hi: 'हिंदी',
    en: 'English',
    te: 'తెలుగు',
    kn: 'ಕನ್ನಡ',
    pa: 'ਪੰਜਾਬੀ',
    gu: 'ગુજરાતી',
    bn: 'বাংলা',
};

// Translation keys and values
const translations: Record<string, Record<LanguageCode, string>> = {
    // Greetings
    'greeting.hello': {
        mr: 'नमस्कार',
        hi: 'नमस्ते',
        en: 'Hello',
        te: 'హలో', kn: 'ಹಲೋ', pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', gu: 'નમસ્તે', bn: 'হ্যালো',
    },
    'greeting.welcome': {
        mr: 'स्वागत आहे',
        hi: 'स्वागत है',
        en: 'Welcome',
        te: 'స్వాగతం', kn: 'ಸ್ವಾಗತ', pa: 'ਜੀ ਆਇਆਂ ਨੂੰ', gu: 'સ્વાગત છે', bn: 'স্বাগতম',
    },

    // Check-in messages
    'checkin.reminder': {
        mr: 'तुमची साप्ताहिक तब्येत चेक-इन करण्याची वेळ झाली!',
        hi: 'आपकी साप्ताहिक स्वास्थ्य जांच का समय है!',
        en: 'Time for your weekly wellness check-in!',
        te: 'మీ వారపు ఆరోగ్య తనిఖీ సమయం!', kn: 'ನಿಮ್ಮ ವಾರದ ಯೋಗಕ್ಷೇಮ ಪರಿಶೀಲನೆ ಸಮಯ!', pa: 'ਤੁਹਾਡੀ ਹਫ਼ਤਾਵਾਰੀ ਸਿਹਤ ਜਾਂਚ ਦਾ ਸਮਾਂ!', gu: 'તમારી સાપ્તાહિક સ્વાસ્થ્ય તપાસનો સમય!', bn: 'আপনার সাপ্তাহিক স্বাস্থ্য পরীক্ষার সময়!',
    },
    'checkin.thankyou': {
        mr: 'धन्यवाद! तुमची माहिती सुरक्षित नोंदवली गेली.',
        hi: 'धन्यवाद! आपकी जानकारी सुरक्षित रूप से दर्ज की गई.',
        en: 'Thank you! Your information has been safely recorded.',
        te: 'ధన్యవాదాలు! మీ సమాచారం సురక్షితంగా నమోదు చేయబడింది.', kn: 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಮಾಹಿತಿ ಸುರಕ್ಷಿತವಾಗಿ ದಾಖಲಾಗಿದೆ.', pa: 'ਧੰਨਵਾਦ! ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਦਰਜ ਕੀਤੀ ਗਈ.', gu: 'આભાર! તમારી માહિતી સુરક્ષિત રીતે નોંધાયેલ છે.', bn: 'ধন্যবাদ! আপনার তথ্য নিরাপদে রেকর্ড করা হয়েছে.',
    },

    // Risk messages
    'risk.low': {
        mr: 'तुमची स्थिती चांगली दिसते! असेच चालू ठेवा.',
        hi: 'आपकी स्थिति अच्छी लग रही है! ऐसे ही जारी रखें.',
        en: 'Your situation looks good! Keep it up.',
        te: 'మీ పరిస్థితి బాగుంది! అలాగే కొనసాగించండి.', kn: 'ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿ ಚೆನ್ನಾಗಿ ಕಾಣುತ್ತಿದೆ! ಇದನ್ನು ಮುಂದುವರಿಸಿ.', pa: 'ਤੁਹਾਡੀ ਸਥਿਤੀ ਚੰਗੀ ਲੱਗ ਰਹੀ ਹੈ! ਇਸੇ ਤਰ੍ਹਾਂ ਜਾਰੀ ਰੱਖੋ.', gu: 'તમારી સ્થિતિ સારી લાગે છે! આમ જ ચાલુ રાખો.', bn: 'আপনার অবস্থা ভালো দেখাচ্ছে! এভাবে চালিয়ে যান.',
    },
    'risk.moderate': {
        mr: 'आमच्या लक्षात आले की काही गोष्टी कठीण आहेत. आम्ही तुमच्यासोबत आहोत.',
        hi: 'हमने देखा कि कुछ चीजें कठिन हैं. हम आपके साथ हैं.',
        en: 'We noticed some things are challenging. We are with you.',
        te: 'కొన్ని విషయాలు కష్టంగా ఉన్నాయని మేము గమనించాము. మేము మీతో ఉన్నాము.', kn: 'ಕೆಲವು ವಿಷಯಗಳು ಕಷ್ಟಕರವಾಗಿದೆ ಎಂದು ನಾವು ಗಮನಿಸಿದ್ದೇವೆ. ನಾವು ನಿಮ್ಮೊಂದಿಗಿದ್ದೇವೆ.', pa: 'ਅਸੀਂ ਦੇਖਿਆ ਕਿ ਕੁਝ ਚੀਜ਼ਾਂ ਔਖੀਆਂ ਹਨ. ਅਸੀਂ ਤੁਹਾਡੇ ਨਾਲ ਹਾਂ.', gu: 'અમે જોયું કે કેટલીક વસ્તુઓ મુશ્કેલ છે. અમે તમારી સાથે છીએ.', bn: 'আমরা লক্ষ্য করেছি কিছু জিনিস কঠিন। আমরা আপনার সাথে আছি।',
    },
    'risk.high': {
        mr: 'तुम्हाला सध्या अनेक आव्हानांचा सामना करावा लागत आहे. कृपया मदतीसाठी संपर्क साधा.',
        hi: 'आप वर्तमान में कई चुनौतियों का सामना कर रहे हैं. कृपया मदद के लिए संपर्क करें.',
        en: 'You are currently facing many challenges. Please reach out for help.',
        te: 'మీరు ప్రస్తుతం అనేక సవాళ్లను ఎదుర్కొంటున్నారు. దయచేసి సహాయం కోసం సంప్రదించండి.', kn: 'ನೀವು ಪ್ರಸ್ತುತ ಅನೇಕ ಸವಾಲುಗಳನ್ನು ಎದುರಿಸುತ್ತಿದ್ದೀರಿ. ದಯವಿಟ್ಟು ಸಹಾಯಕ್ಕಾಗಿ ಸಂಪರ್ಕಿಸಿ.', pa: 'ਤੁਸੀਂ ਇਸ ਵੇਲੇ ਬਹੁਤ ਸਾਰੀਆਂ ਚੁਣੌਤੀਆਂ ਦਾ ਸਾਹਮਣਾ ਕਰ ਰਹੇ ਹੋ. ਕਿਰਪਾ ਕਰਕੇ ਮਦਦ ਲਈ ਸੰਪਰਕ ਕਰੋ.', gu: 'તમે હાલમાં ઘણા પડકારોનો સામનો કરી રહ્યા છો. કૃપા કરીને મદદ માટે સંપર્ક કરો.', bn: 'আপনি বর্তমানে অনেক চ্যালেঞ্জের মুখোমুখি হচ্ছেন। দয়া করে সাহায্যের জন্য যোগাযোগ করুন।',
    },
    'risk.critical': {
        mr: 'तुमची परिस्थिती गंभीर दिसत आहे. आम्ही तातडीने तुमच्याशी संपर्क साधू. कृपया धीर धरा.',
        hi: 'आपकी स्थिति गंभीर दिख रही है. हम तुरंत आपसे संपर्क करेंगे. कृपया धैर्य रखें.',
        en: 'Your situation appears critical. We will contact you urgently. Please hold on.',
        te: 'మీ పరిస్థితి తీవ్రంగా కనిపిస్తోంది. మేము అత్యవసరంగా మిమ్మల్ని సంప్రదిస్తాము. దయచేసి ఆగండి.', kn: 'ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿ ತೀವ್ರವಾಗಿ ಕಾಣುತ್ತಿದೆ. ನಾವು ತುರ್ತಾಗಿ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತೇವೆ. ದಯವಿಟ್ಟು ಹಿಡಿದಿಡಿ.', pa: 'ਤੁਹਾਡੀ ਸਥਿਤੀ ਗੰਭੀਰ ਦਿਖਾਈ ਦੇ ਰਹੀ ਹੈ. ਅਸੀਂ ਜ਼ਰੂਰੀ ਤੌਰ \'ਤੇ ਤੁਹਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰਾਂਗੇ. ਕਿਰਪਾ ਕਰਕੇ ਧੀਰਜ ਰੱਖੋ.', gu: 'તમારી સ્થિતિ ગંભીર દેખાય છે. અમે તાત્કાલિક તમારો સંપર્ક કરીશું. કૃપા કરીને ધીરજ રાખો.', bn: 'আপনার অবস্থা গুরুতর দেখাচ্ছে। আমরা জরুরিভাবে আপনার সাথে যোগাযোগ করব। দয়া করে ধৈর্য ধরুন।',
    },

    // Helpline
    'helpline.message': {
        mr: 'मदतीसाठी हेल्पलाइन: 1800-233-4000',
        hi: 'मदद के लिए हेल्पलाइन: 1800-233-4000',
        en: 'Helpline for assistance: 1800-233-4000',
        te: 'సహాయం కోసం హెల్ప్‌లైన్: 1800-233-4000', kn: 'ಸಹಾಯಕ್ಕಾಗಿ ಹೆಲ್ಪ್‌ಲೈನ್: 1800-233-4000', pa: 'ਮਦਦ ਲਈ ਹੈਲਪਲਾਈਨ: 1800-233-4000', gu: 'સહાય માટે હેલ્પલાઈન: 1800-233-4000', bn: 'সাহায্যের জন্য হেল্পলাইন: 1800-233-4000',
    },
};

/**
 * Get translation for key
 */
export function t(key: string, lang: LanguageCode = 'mr'): string {
    const translation = translations[key];
    if (!translation) return key;
    return translation[lang] || translation['mr'] || key;
}

/**
 * Get translation with variable substitution
 */
export function tWithVars(key: string, vars: Record<string, string>, lang: LanguageCode = 'mr'): string {
    let text = t(key, lang);
    for (const [varKey, value] of Object.entries(vars)) {
        text = text.replace(`{${varKey}}`, value);
    }
    return text;
}

/**
 * Get all translations for a language
 */
export function getAllTranslations(lang: LanguageCode = 'mr'): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, translation] of Object.entries(translations)) {
        result[key] = translation[lang] || translation['mr'] || key;
    }
    return result;
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(lang: string): lang is LanguageCode {
    return lang in SUPPORTED_LANGUAGES;
}

export default {
    t,
    tWithVars,
    getAllTranslations,
    isLanguageSupported,
    SUPPORTED_LANGUAGES,
};
