/**
 * KISAN SAHAY - Check-in History Management
 */

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadHistory();
    }
    initializeFilters();
    displayUserInfo();
});

function checkAuth() {
    const session = window.KisanAuth ? window.KisanAuth.getSession() : null;
    const userMenu = document.getElementById('user-menu');
    const loginBtn = document.getElementById('login-btn');
    const loginRequired = document.getElementById('login-required');
    const contentSections = [
        document.getElementById('page-header'),
        document.getElementById('stats-grid'),
        document.querySelector('.chart-section'),
        document.querySelector('.history-section'),
        document.getElementById('export-section')
    ];

    if (!session) {
        // Not logged in: Show Login Button, Hide User Menu
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');

        // Hide content and show login required message
        contentSections.forEach(el => {
            if (el) el.style.display = 'none';
        });
        if (loginRequired) loginRequired.style.display = 'block';

        return false;
    }

    // Logged in: Hide Login Button, Show User Menu
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');

    // Show content and hide login required message
    if (loginRequired) loginRequired.style.display = 'none';
    // Content sections will be managed by loadHistory()

    return true;
}

function displayUserInfo() {
    const session = window.KisanAuth ? window.KisanAuth.getSession() : null;
    const userName = document.getElementById('user-name');
    if (session && userName) {
        userName.textContent = session.name || 'शेतकरी';
    }
}

// ============================================
// HISTORY MANAGEMENT
// ============================================

function getCheckIns() {
    const session = window.KisanAuth ? window.KisanAuth.getSession() : null;
    if (!session) return [];

    const key = `kisan_checkins_${session.farmerId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveCheckIn(checkIn) {
    const session = window.KisanAuth ? window.KisanAuth.getSession() : null;
    if (!session) return;

    const key = `kisan_checkins_${session.farmerId}`;
    const checkIns = getCheckIns();
    checkIns.unshift(checkIn); // Add to beginning
    localStorage.setItem(key, JSON.stringify(checkIns));
}

function loadHistory() {
    const checkIns = getCheckIns();

    if (checkIns.length === 0) {
        showNoHistory();
        return;
    }

    updateStats(checkIns);
    renderHistoryList(checkIns);
    renderChart(checkIns);

    document.getElementById('export-section').style.display = 'block';
}

function showNoHistory() {
    document.getElementById('no-history').style.display = 'block';
    document.getElementById('history-list').style.display = 'none';
    document.getElementById('export-section').style.display = 'none';
    document.getElementById('no-chart-data').style.display = 'flex';
    document.getElementById('chart-container').querySelector('canvas').style.display = 'none';
}

// ============================================
// STATISTICS
// ============================================

function updateStats(checkIns) {
    // Total check-ins
    document.getElementById('total-checkins').textContent = checkIns.length;

    // Average hope level
    const avgHope = checkIns.reduce((sum, c) => sum + c.hope, 0) / checkIns.length;
    document.getElementById('avg-hope').textContent = avgHope.toFixed(1);

    // Last risk level
    const lastCheckIn = checkIns[0];
    const lastRiskEl = document.getElementById('last-risk');
    const lastRiskCard = document.getElementById('last-risk-card');

    const riskLabels = {
        LOW: 'कमी',
        MODERATE: 'मध्यम',
        HIGH: 'जास्त',
        CRITICAL: 'अत्यंत जास्त'
    };

    lastRiskEl.textContent = riskLabels[lastCheckIn.riskLevel] || lastCheckIn.riskLevel;
    lastRiskCard.className = `stat-card risk-card ${lastCheckIn.riskLevel.toLowerCase()}`;

    // Last check-in date
    const lastDate = new Date(lastCheckIn.timestamp);
    const daysAgo = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    document.getElementById('last-checkin').textContent =
        daysAgo === 0 ? 'आज' :
            daysAgo === 1 ? 'काल' :
                `${daysAgo} दिवसांपूर्वी`;
}

// ============================================
// HISTORY LIST
// ============================================

function renderHistoryList(checkIns, filter = 'all') {
    const listEl = document.getElementById('history-list');

    const filtered = filter === 'all'
        ? checkIns
        : checkIns.filter(c => c.riskLevel === filter);

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="no-history" style="padding: 2rem;">
                <p>या फिल्टरसाठी कोणतेही रेकॉर्ड नाहीत</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = filtered.map((checkIn, index) => {
        const date = new Date(checkIn.timestamp);
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const time = date.toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' });

        const cropLabels = {
            excellent: 'उत्कृष्ट', good: 'चांगली', moderate: 'मध्यम',
            poor: 'खराब', destroyed: 'नुकसान'
        };

        const riskLabels = {
            LOW: 'कमी', MODERATE: 'मध्यम', HIGH: 'जास्त', CRITICAL: 'अत्यंत जास्त'
        };

        return `
            <div class="history-item ${checkIn.riskLevel.toLowerCase()}" 
                 onclick="showDetail(${index})">
                <div class="history-date">
                    <div class="day">${day}</div>
                    <div class="month">${month} ${year}</div>
                </div>
                <div class="history-details">
                    <h4>साप्ताहिक तपासणी</h4>
                    <p>पीक: ${cropLabels[checkIn.crop] || checkIn.crop}</p>
                    <div class="history-meta">
                        <span class="meta-item">🕐 ${time}</span>
                        <span class="meta-item">💪 आशा: ${checkIn.hope}/10</span>
                    </div>
                </div>
                <div class="history-risk">
                    <span class="risk-badge-small ${checkIn.riskLevel.toLowerCase()}">
                        ${riskLabels[checkIn.riskLevel]}
                    </span>
                    <div class="hope-indicator">स्कोर: ${checkIn.score}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// CHART
// ============================================

function renderChart(checkIns) {
    if (checkIns.length < 2) {
        document.getElementById('no-chart-data').style.display = 'flex';
        document.getElementById('chart-container').querySelector('canvas').style.display = 'none';
        return;
    }

    document.getElementById('no-chart-data').style.display = 'none';
    const canvas = document.getElementById('hope-chart');
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    const container = document.getElementById('chart-container');

    // Set canvas size
    canvas.width = container.offsetWidth;
    canvas.height = 280;

    // Prepare data (last 10 check-ins, reversed for chronological order)
    const data = checkIns.slice(0, 10).reverse();
    const labels = data.map(c => {
        const d = new Date(c.timestamp);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const values = data.map(c => c.hope);

    // Chart dimensions
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 10; i += 2) {
        const y = padding + chartHeight - (i / 10 * chartHeight);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#888';
        ctx.font = '12px Poppins';
        ctx.textAlign = 'right';
        ctx.fillText(i.toString(), padding - 10, y + 4);
    }

    // Draw line chart
    const pointSpacing = chartWidth / (values.length - 1);

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
    gradient.addColorStop(0, 'rgba(45, 90, 39, 0.3)');
    gradient.addColorStop(1, 'rgba(45, 90, 39, 0)');

    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);

    values.forEach((val, i) => {
        const x = padding + i * pointSpacing;
        const y = padding + chartHeight - (val / 10 * chartHeight);
        ctx.lineTo(x, y);
    });

    ctx.lineTo(padding + (values.length - 1) * pointSpacing, padding + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#2d5a27';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    values.forEach((val, i) => {
        const x = padding + i * pointSpacing;
        const y = padding + chartHeight - (val / 10 * chartHeight);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw points
    values.forEach((val, i) => {
        const x = padding + i * pointSpacing;
        const y = padding + chartHeight - (val / 10 * chartHeight);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#2d5a27';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // X-axis labels
        ctx.fillStyle = '#888';
        ctx.font = '11px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x, canvas.height - 15);
    });
}

// ============================================
// FILTERS
// ============================================

function initializeFilters() {
    const filterSelect = document.getElementById('risk-filter');
    filterSelect.addEventListener('change', (e) => {
        const checkIns = getCheckIns();
        renderHistoryList(checkIns, e.target.value);
    });
}

// ============================================
// DETAIL MODAL
// ============================================

function showDetail(index) {
    const checkIns = getCheckIns();
    const checkIn = checkIns[index];

    if (!checkIn) return;

    const date = new Date(checkIn.timestamp);
    const dateStr = date.toLocaleDateString('mr-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('mr-IN');

    const labels = {
        crop: { excellent: 'उत्कृष्ट', good: 'चांगली', moderate: 'मध्यम', poor: 'खराब', destroyed: 'पूर्ण नुकसान' },
        loan: { none: 'नाही', low: 'कमी', medium: 'मध्यम', high: 'जास्त', severe: 'अत्यंत जास्त' },
        sleep: { good: 'चांगली', fair: 'ठीक', poor: 'कमी', very_poor: 'अत्यंत कमी' },
        family: { strong: 'मजबूत', moderate: 'मध्यम', weak: 'कमी', none: 'नाही' },
        risk: { LOW: 'कमी', MODERATE: 'मध्यम', HIGH: 'जास्त', CRITICAL: 'अत्यंत जास्त' }
    };

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="modal-header">
            <h3>तपासणी तपशील</h3>
            <p>${dateStr} - ${timeStr}</p>
        </div>
        
        <div class="risk-indicator ${checkIn.riskLevel.toLowerCase()}" style="margin-bottom: 1rem;">
            <div class="risk-icon">${getRiskIcon(checkIn.riskLevel)}</div>
            <div class="risk-details">
                <h3>जोखीम पातळी</h3>
                <div class="risk-badge ${checkIn.riskLevel.toLowerCase()}">
                    ${labels.risk[checkIn.riskLevel]}
                </div>
            </div>
        </div>
        
        <div class="detail-grid">
            <div class="detail-item">
                <label>🌾 पीक स्थिती</label>
                <span>${labels.crop[checkIn.crop] || checkIn.crop}</span>
            </div>
            <div class="detail-item">
                <label>💰 कर्जाचा भार</label>
                <span>${labels.loan[checkIn.loan] || checkIn.loan}</span>
            </div>
            <div class="detail-item">
                <label>😴 झोपेची गुणवत्ता</label>
                <span>${labels.sleep[checkIn.sleep] || checkIn.sleep}</span>
            </div>
            <div class="detail-item">
                <label>👨‍👩‍👧‍👦 कुटुंबाचा आधार</label>
                <span>${labels.family[checkIn.family] || checkIn.family}</span>
            </div>
            <div class="detail-item">
                <label>💪 आशा पातळी</label>
                <span>${checkIn.hope}/10</span>
            </div>
            <div class="detail-item">
                <label>📊 जोखीम स्कोर</label>
                <span>${checkIn.score}</span>
            </div>
        </div>
        
        ${checkIn.notes ? `
            <div class="detail-item" style="margin-top: 1rem;">
                <label>📝 अतिरिक्त टीप</label>
                <span>${checkIn.notes}</span>
            </div>
        ` : ''}
    `;

    document.getElementById('detail-modal').classList.add('active');
}

function getRiskIcon(level) {
    const icons = { LOW: '✅', MODERATE: '⚠️', HIGH: '🔴', CRITICAL: '🆘' };
    return icons[level] || '⚠️';
}

function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

// Close modal on outside click
document.getElementById('detail-modal').addEventListener('click', (e) => {
    if (e.target.id === 'detail-modal') closeModal();
});

// ============================================
// EXPORT FUNCTIONS
// ============================================

function exportToCSV() {
    const checkIns = getCheckIns();
    if (checkIns.length === 0) return;

    const headers = ['Date', 'Time', 'Crop', 'Loan', 'Sleep', 'Family', 'Hope', 'Risk Level', 'Score'];
    const rows = checkIns.map(c => {
        const d = new Date(c.timestamp);
        return [
            d.toLocaleDateString(),
            d.toLocaleTimeString(),
            c.crop,
            c.loan,
            c.sleep,
            c.family,
            c.hope,
            c.riskLevel,
            c.score
        ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `kisan_checkins_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}

function printHistory() {
    window.print();
}

function clearHistory() {
    if (!confirm('तुम्हाला खात्री आहे का? हे सर्व तपासणी रेकॉर्ड कायमचे हटवले जातील।\n(Are you sure? This will permanently delete all check-in records.)')) {
        return;
    }

    const session = window.KisanAuth ? window.KisanAuth.getSession() : null;
    if (session) {
        const key = `kisan_checkins_${session.farmerId}`;
        localStorage.removeItem(key);
    }

    location.reload();
}

// Handle logout
function handleLogout() {
    if (window.KisanAuth) {
        window.KisanAuth.clearSession();
    }
    window.location.href = 'login.html';
}

// Expose functions globally
window.showDetail = showDetail;
window.closeModal = closeModal;
window.exportToCSV = exportToCSV;
window.printHistory = printHistory;
window.clearHistory = clearHistory;
window.handleLogout = handleLogout;

// Export saveCheckIn for use in main app
window.saveCheckIn = saveCheckIn;
