/**
 * KISAN SAHAY - Authentication System
 * Handles login, registration, OTP verification
 */

// ============================================
// CONFIGURATION
// ============================================

const AUTH_CONFIG = {
    OTP_LENGTH: 6,
    OTP_TIMEOUT: 60, // seconds
    MIN_PASSWORD_LENGTH: 6,
    STORAGE_KEY: 'kisan_farmers',
    SESSION_KEY: 'kisan_session'
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeForms();
    initializeOTPInputs();
    checkExistingSession();
});

function initializeTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

function initializeForms() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegistration);
    document.getElementById('otp-form').addEventListener('submit', handleOTPVerification);

    // Mobile number input validation
    const mobileInputs = document.querySelectorAll('input[type="tel"]');
    mobileInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    });
}

function initializeOTPInputs() {
    const otpInputs = document.querySelectorAll('.otp-digit');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;

            if (value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
            for (let i = 0; i < Math.min(pastedData.length, otpInputs.length); i++) {
                otpInputs[i].value = pastedData[i];
            }
            otpInputs[Math.min(pastedData.length, otpInputs.length) - 1].focus();
        });
    });
}

function checkExistingSession() {
    const session = getSession();
    if (session) {
        // Redirect to main app if already logged in
        window.location.href = 'index.html';
    }
}

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    const targetForm = document.getElementById(`${tabName}-form`);
    if (targetForm) {
        targetForm.classList.add('active');
    }
}

// ============================================
// LOGIN HANDLING
// ============================================

async function handleLogin(e) {
    e.preventDefault();

    const mobile = document.getElementById('login-mobile').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    if (!validateMobile(mobile)) {
        showToast('कृपया वैध 10 अंकी मोबाईल नंबर टाका', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('.auth-btn');
    submitBtn.classList.add('loading');

    // Simulate API call
    await delay(1000);

    const farmer = findFarmer(mobile);

    if (!farmer) {
        submitBtn.classList.remove('loading');
        showToast('हा मोबाईल नंबर नोंदणीकृत नाही', 'error');
        return;
    }

    if (farmer.password !== hashPassword(password)) {
        submitBtn.classList.remove('loading');
        showToast('चुकीचा पासवर्ड', 'error');
        return;
    }

    // Create session
    createSession(farmer, rememberMe);

    submitBtn.classList.remove('loading');
    showToast('लॉगिन यशस्वी! 🎉', 'success');

    // Redirect to main app
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// ============================================
// REGISTRATION HANDLING
// ============================================

async function handleRegistration(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('reg-name').value.trim(),
        mobile: document.getElementById('reg-mobile').value,
        village: document.getElementById('reg-village').value.trim(),
        taluka: document.getElementById('reg-taluka').value.trim(),
        district: document.getElementById('reg-district').value,
        farmSize: parseFloat(document.getElementById('reg-farm-size').value),
        password: document.getElementById('reg-password').value,
        confirmPassword: document.getElementById('reg-confirm').value,
        agreedTerms: document.getElementById('agree-terms').checked
    };

    // Validation
    if (!validateMobile(formData.mobile)) {
        showToast('कृपया वैध 10 अंकी मोबाईल नंबर टाका', 'error');
        return;
    }

    if (formData.password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
        showToast('पासवर्ड किमान 6 अक्षरांचा असावा', 'error');
        return;
    }

    if (formData.password !== formData.confirmPassword) {
        showToast('पासवर्ड जुळत नाही', 'error');
        return;
    }

    if (!formData.agreedTerms) {
        showToast('कृपया अटी व शर्ती मान्य करा', 'error');
        return;
    }

    // Check if already registered
    if (findFarmer(formData.mobile)) {
        showToast('हा मोबाईल नंबर आधीच नोंदणीकृत आहे', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('.auth-btn');
    submitBtn.classList.add('loading');

    // Simulate API call
    await delay(1500);

    // Save farmer
    const farmer = {
        id: generateId(),
        name: formData.name,
        mobile: formData.mobile,
        village: formData.village,
        taluka: formData.taluka,
        district: formData.district,
        farmSize: formData.farmSize,
        password: hashPassword(formData.password),
        createdAt: new Date().toISOString(),
        checkIns: []
    };

    saveFarmer(farmer);

    submitBtn.classList.remove('loading');
    showToast('नोंदणी यशस्वी! कृपया लॉगिन करा', 'success');

    // Switch to login tab
    setTimeout(() => {
        switchTab('login');
        document.getElementById('login-mobile').value = formData.mobile;
        document.getElementById('register-form').reset();
    }, 1000);
}

// ============================================
// OTP HANDLING
// ============================================

let otpTimer = null;
let otpMobile = '';
let otpChannel = 'sms';

function loginWithOTP(channel = 'sms') {
    const mobile = document.getElementById('login-mobile').value;

    if (!validateMobile(mobile)) {
        showToast('कृपया प्रथम वैध मोबाईल नंबर टाका', 'error');
        document.getElementById('login-mobile').focus();
        return;
    }

    otpMobile = mobile;
    otpChannel = channel;

    // Show OTP form
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById('otp-form').classList.add('active');

    // Update display with channel indicator
    const channelEmoji = channel === 'whatsapp' ? '💬' : '📱';
    const channelName = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
    document.getElementById('otp-mobile').innerHTML = `
        <span class="otp-channel-badge ${channel}">${channelEmoji} ${channelName}</span><br>
        +91 ${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)} वर पाठवलेला OTP टाका
    `;

    // Clear OTP inputs
    document.querySelectorAll('.otp-digit').forEach(input => input.value = '');
    document.querySelector('.otp-digit').focus();

    // Start timer
    startOTPTimer();

    // Simulate OTP sent via channel
    if (channel === 'whatsapp') {
        showToast('WhatsApp वर OTP पाठवला! (Demo: 123456)', 'success');
        simulateWhatsAppNotification(mobile);
    } else {
        showToast('SMS द्वारे OTP पाठवला! (Demo: 123456)', 'success');
        simulateSMSNotification(mobile);
    }
}

// Simulate SMS notification (for demo)
function simulateSMSNotification(mobile) {
    console.log(`📱 SMS sent to +91 ${mobile}`);
    console.log(`Message: "तुमचा किसान सहाय्य OTP आहे: 123456. हा OTP 5 मिनिटांत वापरा. - Kisan Sahay"`);
}

// Simulate WhatsApp notification (for demo)
function simulateWhatsAppNotification(mobile) {
    console.log(`💬 WhatsApp message sent to +91 ${mobile}`);
    console.log(`Message: "🌾 *किसान सहाय्य*\n\nनमस्कार!\n\nतुमचा लॉगिन OTP आहे: *123456*\n\nहा OTP 5 मिनिटांत वापरा.\n\n_या संदेशाला उत्तर देऊ नका._"`);
}

function startOTPTimer() {
    let timeLeft = AUTH_CONFIG.OTP_TIMEOUT;
    const timerDisplay = document.getElementById('timer');
    const resendBtn = document.getElementById('resend-btn');

    resendBtn.disabled = true;

    if (otpTimer) clearInterval(otpTimer);

    otpTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            resendBtn.disabled = false;
            timerDisplay.textContent = '00:00';
        }
    }, 1000);
}

function resendOTP() {
    startOTPTimer();
    showToast('नवीन OTP पाठवला! (Demo: 123456)', 'success');
}

async function handleOTPVerification(e) {
    e.preventDefault();

    const otpInputs = document.querySelectorAll('.otp-digit');
    let otp = '';
    otpInputs.forEach(input => otp += input.value);

    if (otp.length !== AUTH_CONFIG.OTP_LENGTH) {
        showToast('कृपया पूर्ण OTP टाका', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('.auth-btn');
    submitBtn.classList.add('loading');

    await delay(1000);

    // Demo OTP verification
    if (otp === '123456') {
        let farmer = findFarmer(otpMobile);

        if (!farmer) {
            // Create new farmer with OTP login
            farmer = {
                id: generateId(),
                name: 'शेतकरी',
                mobile: otpMobile,
                village: '',
                taluka: '',
                district: '',
                farmSize: 0,
                password: '',
                createdAt: new Date().toISOString(),
                checkIns: [],
                isOTPUser: true
            };
            saveFarmer(farmer);
        }

        createSession(farmer, true);

        submitBtn.classList.remove('loading');
        showToast('सत्यापन यशस्वी! 🎉', 'success');

        if (otpTimer) clearInterval(otpTimer);

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        submitBtn.classList.remove('loading');
        showToast('चुकीचा OTP. कृपया पुन्हा प्रयत्न करा', 'error');
    }
}

function backToLogin() {
    if (otpTimer) clearInterval(otpTimer);
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    document.getElementById('login-form').classList.add('active');
}

function showForgotPassword() {
    showToast('कृपया 1800-233-4000 वर कॉल करा', 'warning');
}

// ============================================
// DATA STORAGE (Local Storage for Demo)
// ============================================

function getFarmers() {
    const data = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveFarmer(farmer) {
    const farmers = getFarmers();
    farmers.push(farmer);
    localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(farmers));
}

function findFarmer(mobile) {
    const farmers = getFarmers();
    return farmers.find(f => f.mobile === mobile);
}

function updateFarmer(updatedFarmer) {
    const farmers = getFarmers();
    const index = farmers.findIndex(f => f.id === updatedFarmer.id);
    if (index !== -1) {
        farmers[index] = updatedFarmer;
        localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(farmers));
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

function createSession(farmer, remember = false) {
    const session = {
        farmerId: farmer.id,
        name: farmer.name,
        mobile: farmer.mobile,
        village: farmer.village,
        district: farmer.district,
        loginTime: new Date().toISOString()
    };

    if (remember) {
        localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
    } else {
        sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(session));
    }
}

function getSession() {
    const session = localStorage.getItem(AUTH_CONFIG.SESSION_KEY) ||
        sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

function clearSession() {
    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}

function hashPassword(password) {
    // Simple hash for demo (use proper hashing in production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

function generateId() {
    return 'farmer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icons = { success: '✓', error: '✕', warning: '⚠' };

    toast.className = `toast ${type}`;
    toast.querySelector('.toast-icon').textContent = icons[type] || '✓';
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Expose functions globally
window.togglePassword = togglePassword;
window.loginWithOTP = loginWithOTP;
window.resendOTP = resendOTP;
window.backToLogin = backToLogin;
window.showForgotPassword = showForgotPassword;

// Export for use in main app
window.KisanAuth = {
    getSession,
    clearSession,
    getFarmers,
    findFarmer,
    updateFarmer
};
