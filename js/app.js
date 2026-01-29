/**
 * CARE-AID FRONTEND LOGIC
 * Pure Vanilla JS. No Frameworks.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- PAGE ROUTER (Basic) ---
    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path.endsWith('/');
    const isMonitorPage = path.endsWith('monitoring.html');

    if (isLoginPage) initLogin();
    if (isMonitorPage) initMonitor();
});

/* =========================================
   LOGIN / LANDING LOGIC
   ========================================= */
function initLogin() {
    const form = document.getElementById('loginForm');

    // Check if user is already logged in (Simulated)
    // if (localStorage.getItem('careAidSession')) {
    //     window.location.href = 'monitoring.html';
    // }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const operatorId = document.getElementById('operatorId').value;
        const ethicsChecked = document.getElementById('ethicsCheck').checked;

        if (operatorId && ethicsChecked) {
            // Visual feedback
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "AUTHENTICATING...";
            btn.disabled = true;

            setTimeout(() => {
                localStorage.setItem('careAidSession', 'active');
                window.location.href = 'monitoring.html';
            }, 1500); // 1.5s artificial delay for realism
        }
    });
}

/* =========================================
   MONITORING SIMULATION LOGIC
   ========================================= */
function initMonitor() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('careAidSession');
            window.location.href = 'index.html';
        });
    }

    // STATE
    let distressLevel = 5; // Start at 5%
    let signals = [];
    const MAX_DISTRESS = 100;
    const ALERT_THRESHOLD = 65;

    // DOM ELEMENTS
    const distressValue = document.getElementById('distressValue');
    const distressCircle = document.getElementById('distressCircle');
    const signalFeed = document.getElementById('signalFeed');
    const dispatchBtn = document.getElementById('dispatchBtn');
    const trendIndicator = document.getElementById('trendIndicator');

    // MOCK DATA GENERATOR
    const cues = [
        { type: 'GAZE', text: 'Fixed gaze detected (>4s)', severity: 'low' },
        { type: 'POSTURE', text: 'Rigid body language detected', severity: 'low' },
        { type: 'GROUP', text: 'Abnormal crowding pattern', severity: 'medium' },
        { type: 'SOUND', text: 'Decibel spike (short duration)', severity: 'medium' },
        { type: 'FACE', text: 'Micro-expression: Distress', severity: 'medium' },
        { type: 'BREATH', text: 'Rapid breathing cadence inferred', severity: 'high' }
    ];

    function getRandomCue() {
        return cues[Math.floor(Math.random() * cues.length)];
    }

    function addSignal() {
        // Create random cue
        const cue = getRandomCue();

        // Add timestamp
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });

        // Update State
        signals.unshift(cue); // Add to top

        // Calculate Impact on Distress Level
        let increment = 0;
        if (cue.severity === 'low') increment = 2;
        if (cue.severity === 'medium') increment = 5;
        if (cue.severity === 'high') increment = 8;

        distressLevel = Math.min(distressLevel + increment, MAX_DISTRESS);

        // Render Signal Card
        const card = document.createElement('div');
        let borderClass = 'normal';
        let badgeClass = 'text-accent';

        if (cue.severity === 'medium') { borderClass = 'concern'; badgeClass = 'text-warning'; }
        if (cue.severity === 'high') { borderClass = 'critical'; badgeClass = 'text-danger'; }

        card.className = `signal-card ${borderClass}`;
        card.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span class="badge bg-dark border border-secondary ${badgeClass}">${cue.type}</span>
                <span class="font-monospace small text-muted">${timeString}</span>
            </div>
            <p class="mb-0 small text-light">${cue.text}</p>
        `;

        // Remove empty state if exists
        const emptyState = signalFeed.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        signalFeed.prepend(card); // Add to top of list

        // Keep list tidy (max 20 items)
        if (signalFeed.children.length > 20) {
            signalFeed.removeChild(signalFeed.lastChild);
        }

        updateDashboard();
    }

    function updateDashboard() {
        // Update Meter Visuals
        distressValue.innerText = `${distressLevel}%`;
        distressCircle.style.setProperty('--percent', `${distressLevel}%`);

        // Color Logic for Meter
        let color = 'var(--accent-teal)'; // Safe
        if (distressLevel > 30) color = 'var(--accent-primary)'; // Notice
        if (distressLevel > 50) color = 'var(--accent-warning)'; // Warning
        if (distressLevel > 80) color = 'var(--accent-danger)'; // Critical

        // Direct DOM manipulation for gradient color (simple approach)
        distressCircle.style.background = `conic-gradient(${color} 0% ${distressLevel}%, var(--bg-surface) ${distressLevel}% 100%)`;

        // Update Trend Text via logic
        if (distressLevel > 50) {
            trendIndicator.innerHTML = '<span class="text-warning">▲ RISING</span>';
        } else {
            trendIndicator.innerHTML = '<span class="text-teal">▼ STABLE</span>';
        }

        // Enable Dispatch Button if Critical
        if (distressLevel >= ALERT_THRESHOLD) {
            dispatchBtn.disabled = false;
            dispatchBtn.classList.remove('btn-danger', 'disabled');
            dispatchBtn.classList.add('btn-danger', 'pulse-btn'); // Add pulse effect class if defined, or just keep red
            dispatchBtn.innerHTML = "⚠️ DISPATCH INTERVENTION NOW";
        }
    }

    // SIMULATION LOOP
    // Start slow, then accellerate slightly?
    // For demo, we just add a signal every 3-6 seconds.
    setInterval(() => {
        // 40% chance to add a signal each tick
        if (Math.random() > 0.6) {
            addSignal();
        }

        // Natural decay (distress goes down if nothing happens)
        if (Math.random() > 0.7 && distressLevel > 5) {
            distressLevel -= 1;
            updateDashboard();
        }

    }, 2000);
}