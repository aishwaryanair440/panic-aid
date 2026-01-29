/**
 * CARE-AID REAL-TIME INTELLIGENCE & VISUAL LAYER
 * Powered by TensorFlow.js (YAMNet)
 * Features: Real-time Audio AI & Canvas-based Spatial Analysis
 */

document.addEventListener('DOMContentLoaded', () => {

    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path.endsWith('/');
    const isMonitorPage = path.endsWith('monitoring.html');

    if (isLoginPage) initLogin();
    if (isMonitorPage) initRealTimeMonitor();
});

/* =========================================
   LOGIN LOGIC
   ========================================= */
function initLogin() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ethicsChecked = document.getElementById('ethicsCheck').checked;
        if (ethicsChecked) {
            const btn = form.querySelector('button');
            btn.innerText = "AUTHENTICATING...";
            btn.disabled = true;
            setTimeout(() => {
                localStorage.setItem('careAidSession', 'active');
                window.location.href = 'monitoring.html';
            }, 1000);
        }
    });
}

/* =========================================
   REAL-TIME ML MONITORING (TensorFlow.js)
   ========================================= */
async function initRealTimeMonitor() {

    // -- STATE --
    let model;
    let audioContext;
    let microphone;
    let isListening = false;
    let distressLevel = 5;
    let currentMode = 'Motion'; // Default mode

    // -- UI ELEMENTS --
    const overlay = document.getElementById('audioOverlay');
    const startBtn = document.getElementById('startAudioBtn');
    const distressValue = document.getElementById('distressValue');
    const distressCircle = document.getElementById('distressCircle');
    const signalFeed = document.getElementById('signalFeed');
    const dispatchBtn = document.getElementById('dispatchBtn');
    const statusText = document.querySelector('.status-overlay h4');
    const statusSub = document.querySelector('.status-overlay p');
    const canvas = document.getElementById('spatialCanvas');
    const ctx = canvas.getContext('2d');

    // -- SPATIAL LAYER BUTTONS --
    const modeButtons = {
        'Thermal': document.getElementById('modeThermal'),
        'Motion': document.getElementById('modeMotion'),
        'Density': document.getElementById('modeDensity')
    };

    // -- CLASS MAPPINGS (YAMNet) --
    const DANGER_CLASSES = {
        'Gunshot, gunfire': { label: 'GUNSHOT DETECTED', severity: 'critical', boost: 40 },
        'Explosion': { label: 'EXPLOSION DETECTED', severity: 'critical', boost: 40 },
        'Screaming': { label: 'HUMAN DISTRESS (SCREAM)', severity: 'high', boost: 20 },
        'Yell': { label: 'AGGRESSIVE VOCALIZATION', severity: 'medium', boost: 10 },
        'Civil defense siren': { label: 'SIREN (CIVIL DEFENSE)', severity: 'medium', boost: 15 },
        'Police car (siren)': { label: 'SIREN (POLICE)', severity: 'medium', boost: 15 },
        'Glass': { label: 'BREAKING GLASS', severity: 'high', boost: 25 },
        'Fire alarm': { label: 'ALARM (FIRE)', severity: 'high', boost: 20 },
        'Smoke detector, smoke alarm': { label: 'ALARM (SMOKE)', severity: 'high', boost: 20 }
    };

    // -- INITIALIZATION --
    startBtn.addEventListener('click', async () => {
        startBtn.innerText = "LOADING NEURAL ENGINE...";
        startBtn.disabled = true;

        try {
            console.log("Loading YAMNet...");
            model = await yamnet.load();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            microphone = audioContext.createMediaStreamSource(stream);

            isListening = true;
            processAudio();
            initVisualizer();

            overlay.style.display = 'none';
            statusText.innerText = "ACTIVE LISTENING";
            statusSub.innerHTML = '<span class="text-teal">● Live Microphone Feed</span> | Edge Inference: ENABLED';

        } catch (err) {
            console.error(err);
            startBtn.innerText = "ACCESS DENIED / ERROR";
            alert("Microphone & Secure Context required.");
        }
    });

    // -- AUDIO INFERENCE --
    async function processAudio() {
        model.listen(result => {
            const scores = result.scores;
            const topK = getTopK(scores, 3);

            topK.forEach(match => {
                if (match.score > 0.3) {
                    handleDetection(match.label, match.score);
                }
            });

            if (distressLevel > 5) distressLevel -= 0.15;
            updateDashboard();

        }, {
            includeSpectrogram: false,
            overlapFactor: 0.5,
            probabilityThreshold: 0.1
        });
    }

    function getTopK(scores, k) {
        const scoresArr = Array.from(scores).map((s, i) => ({ score: s, index: i }));
        scoresArr.sort((a, b) => b.score - a.score);
        return scoresArr.slice(0, k).map(item => ({ label: model.classNames[item.index], score: item.score }));
    }

    // -- VISUALIZER (SPATIAL LAYERS) --
    const entities = [];
    function initVisualizer() {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Generate mock entities for spatial visualization
        for (let i = 0; i < 15; i++) {
            entities.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 5 + Math.random() * 15,
                heat: Math.random(),
                id: i
            });
        }

        requestAnimationFrame(renderLoop);
    }

    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    function renderLoop() {
        if (!isListening) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update entities
        entities.forEach(e => {
            e.x += e.vx;
            e.y += e.vy;
            if (e.x < 0 || e.x > canvas.width) e.vx *= -1;
            if (e.y < 0 || e.y > canvas.height) e.vy *= -1;

            // Render based on mode
            if (currentMode === 'Thermal') {
                renderThermal(e);
            } else if (currentMode === 'Density') {
                renderDensity(e);
            } else {
                renderMotion(e);
            }
        });

        requestAnimationFrame(renderLoop);
    }

    function renderThermal(e) {
        ctx.save();
        const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 3);
        gradient.addColorStop(0, `rgba(255, ${Math.floor(255 * (1 - e.heat))}, 0, 0.6)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function renderMotion(e) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.stroke();

        // Direction indicator
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + e.vx * 10, e.y + e.vy * 10);
        ctx.stroke();
    }

    function renderDensity(e) {
        ctx.save();
        ctx.fillStyle = 'rgba(45, 212, 191, 0.2)';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Highlight clusters (simulated)
        if (e.id % 3 === 0) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size * 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // -- MODE SWITCHING --
    Object.keys(modeButtons).forEach(mode => {
        modeButtons[mode].addEventListener('click', () => {
            currentMode = mode;
            // Update button styles
            Object.values(modeButtons).forEach(b => b.classList.remove('active'));
            modeButtons[mode].classList.add('active');
        });
    });

    // -- LOGIC & UI --
    let lastDetectionTime = 0;
    function handleDetection(className, confidence) {
        const now = Date.now();
        const mapped = DANGER_CLASSES[className];
        if (!mapped || now - lastDetectionTime < 1500) return;

        lastDetectionTime = now;
        distressLevel = Math.min(distressLevel + mapped.boost * (confidence * 2), 100);

        const card = document.createElement('div');
        const badgeClass = (mapped.severity === 'medium') ? 'text-warning' : 'text-danger';
        card.className = `signal-card ${(mapped.severity === 'medium') ? 'concern' : 'critical'}`;
        card.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span class="badge bg-dark border border-secondary ${badgeClass}">${mapped.label}</span>
                <span class="font-monospace small text-muted">${new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
            </div>
            <div class="d-flex justify-content-between align-items-end">
                <p class="mb-0 small text-light opacity-75">${className}</p>
                <small class="text-muted font-monospace">${Math.round(confidence * 100)}%</small>
            </div>
        `;

        if (document.querySelector('.empty-state')) document.querySelector('.empty-state').remove();
        signalFeed.prepend(card);
        if (signalFeed.children.length > 20) signalFeed.lastChild.remove();
    }

    function updateDashboard() {
        if (distressLevel < 0) distressLevel = 0;
        const display = Math.round(distressLevel);
        distressValue.innerText = `${display}%`;
        distressCircle.style.setProperty('--percent', `${display}%`);

        let color = 'var(--accent-teal)';
        if (display > 30) color = 'var(--accent-primary)';
        if (display > 50) color = 'var(--accent-warning)';
        if (display > 80) color = 'var(--accent-danger)';
        distressCircle.style.background = `conic-gradient(${color} 0% ${display}%, var(--bg-surface) ${display}% 100%)`;

        const trend = document.getElementById('trendIndicator');
        trend.innerHTML = (display > 50) ? '<span class="text-warning">▲ RISING</span>' : '<span class="text-teal">▼ STABLE</span>';

        if (display >= 75) {
            dispatchBtn.disabled = false;
            dispatchBtn.classList.remove('disabled');
            dispatchBtn.innerHTML = "⚠️ HUMAN REVIEW REQUIRED";
        }
    }
}