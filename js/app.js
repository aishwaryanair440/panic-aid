/**
 * CARE-AID REAL-TIME INTELLIGENCE
 * Powered by TensorFlow.js (YAMNet)
 * Edge AI: Privacy-First, Client-Side Only.
 */

document.addEventListener('DOMContentLoaded', () => {

    const path = window.location.pathname;
    const isLoginPage = path.endsWith('index.html') || path.endsWith('/');
    const isMonitorPage = path.endsWith('monitoring.html');

    if (isLoginPage) initLogin();
    if (isMonitorPage) initRealTimeMonitor();
});

/* =========================================
   LOGIN LOGIC (Unchanged)
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
    let distressLevel = 5; // Base level
    const signals = []; // Log for UI

    // -- UI ELEMENTS --
    const overlay = document.getElementById('audioOverlay');
    const startBtn = document.getElementById('startAudioBtn');
    const distressValue = document.getElementById('distressValue');
    const distressCircle = document.getElementById('distressCircle');
    const signalFeed = document.getElementById('signalFeed');
    const dispatchBtn = document.getElementById('dispatchBtn');
    const statusText = document.querySelector('.status-overlay h4');
    const statusSub = document.querySelector('.status-overlay p');

    // -- CLASS MAPPINGS (YAMNet has 521 classes) --
    // We filter for distinct "Emergency" sounds.
    const DANGER_CLASSES = {
        'Gunshot, gunfire': { label: 'GUNSHOT DETECTED', severity: 'critical', boost: 40 },
        'Explosion': { label: 'EXPLOSION DETECTED', severity: 'critical', boost: 40 },
        'Screaming': { label: 'HUMAN DISTRESS (SCREAM)', severity: 'high', boost: 20 },
        'Yell': { label: 'AGGRESSIVE VOCALIZATION', severity: 'medium', boost: 10 },
        'Civil defense siren': { label: 'SIREN (CIVIL DEFENSE)', severity: 'medium', boost: 15 },
        'Police car (siren)': { label: 'SIREN (POLICE)', severity: 'medium', boost: 15 },
        'Ambulance (siren)': { label: 'SIREN (MEDICAL)', severity: 'medium', boost: 10 },
        'Glass': { label: 'BREAKING GLASS', severity: 'high', boost: 25 },
        'Shatter': { label: 'SHATTERING SOUND', severity: 'high', boost: 25 },
        'Crying, sobbing': { label: 'HUMAN DISTRESS (CRYING)', severity: 'medium', boost: 8 },
        'Fire alarm': { label: 'ALARM (FIRE)', severity: 'high', boost: 20 },
        'Smoke detector, smoke alarm': { label: 'ALARM (SMOKE)', severity: 'high', boost: 20 },
        'Dog': { label: 'CANINE BARKING', severity: 'low', boost: 2 } // Keep low for realism
    };

    // -- INITIALIZATION --
    startBtn.addEventListener('click', async () => {
        startBtn.innerText = "LOADING NEURAL ENGINE...";
        startBtn.disabled = true;

        try {
            // 1. Load Model
            console.log("Loading YAMNet...");
            model = await yamnet.load();
            console.log("Model Loaded.");

            // 2. Access Mic
            const constraints = { audio: true, video: false };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // 3. Setup Audio Context (16kHz required by YAMNet)
            audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            microphone = audioContext.createMediaStreamSource(stream);

            // 4. Start Inference Loop
            isListening = true;
            processAudio(microphone);

            // 5. Hide Overlay
            overlay.classList.add('fade-out'); // Add CSS transition later
            overlay.style.display = 'none';
            statusText.innerText = "ACTIVE LISTENING";
            statusSub.innerHTML = '<span class="text-teal">● Live Microphone Feed</span> | Edge Inference: ENABLED';

        } catch (err) {
            console.error(err);
            startBtn.innerText = "ACCESS DENIED / ERROR";
            alert("Microphone access is required for real-time analysis (" + err.message + ")");
        }
    });

    // -- INFERENCE CORE --
    async function processAudio(source) {
        // YAMNet expects chunks of audio. We use a ScriptProcessor (deprecated but simple) 
        // or ensure we pull data compatible with the model's listen() method if available.
        // The TFJS YAMNet 'listen' method handles windowing automatically.

        console.log("Starting listening loop...");

        // Using the high-level API which abstracts the frame management
        // probabilityThreshold: Only fire if confident
        model.listen(result => {
            const scores = result.scores;
            // 'scores' is an array of probabilities corresponding to class labels
            // Get top predictions
            const topK = getTopK(scores, 3);

            topK.forEach(match => {
                const className = match.label;
                const confidence = match.score;

                // Threshold check (0.3 = 30% confidence)
                if (confidence > 0.3) {
                    handleDetection(className, confidence);
                }
            });

            // Decay distress over time naturally if quiet
            if (distressLevel > 5) distressLevel -= 0.2;
            updateDashboard();

        }, {
            includeSpectrogram: false,
            overlapFactor: 0.5, // 50% overlap for continuous detection
            probabilityThreshold: 0.1 // Low threshold to catch raw data, we filter manually
        });
    }

    function getTopK(scores, k) {
        const scoresArr = Array.from(scores).map((s, i) => ({ score: s, index: i }));
        scoresArr.sort((a, b) => b.score - a.score);
        const top = scoresArr.slice(0, k);
        // Map index to label using the model's class map
        const classNames = model.classNames; // YAMNet exposes this
        return top.map(item => ({ label: classNames[item.index], score: item.score }));
    }

    // -- LOGIC & UI UPDATES --
    // Debounce to prevent feed flooding
    let lastDetectionTime = 0;

    function handleDetection(className, confidence) {
        const now = Date.now();
        const mapped = DANGER_CLASSES[className];

        // Only care about mapped danger classes
        if (!mapped) return;

        // Debounce same signal (don't show "Siren" 50 times a second)
        if (now - lastDetectionTime < 1500) return;

        lastDetectionTime = now;

        // Boost Distress Meter
        const boost = mapped.boost * (confidence * 2); // Confidence weighs the boost
        distressLevel = Math.min(distressLevel + boost, 100);

        // Log to Feed
        const timeString = new Date().toLocaleTimeString('en-US', { hour12: false });

        const card = document.createElement('div');
        let borderClass = 'normal';
        let badgeClass = 'text-accent';

        if (mapped.severity === 'medium') { borderClass = 'concern'; badgeClass = 'text-warning'; }
        if (mapped.severity === 'critical' || mapped.severity === 'high') { borderClass = 'critical'; badgeClass = 'text-danger'; }

        card.className = `signal-card ${borderClass}`;
        card.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span class="badge bg-dark border border-secondary ${badgeClass}">${mapped.label}</span>
                <span class="font-monospace small text-muted">${timeString}</span>
            </div>
            <div class="d-flex justify-content-between align-items-end">
                <p class="mb-0 small text-light opacity-75">Raw Class: ${className}</p>
                <small class="text-muted font-monospace">${Math.round(confidence * 100)}% Conf.</small>
            </div>
        `;

        // Clear empty state
        const empty = document.querySelector('.empty-state');
        if (empty) empty.remove();

        signalFeed.prepend(card);
        // Prune list
        if (signalFeed.children.length > 20) signalFeed.lastChild.remove();
    }

    function updateDashboard() {
        // Clamp distress
        if (distressLevel < 0) distressLevel = 0;
        const displayLevel = Math.round(distressLevel);

        distressValue.innerText = `${displayLevel}%`;
        distressCircle.style.setProperty('--percent', `${displayLevel}%`);

        // Color Logic
        let color = 'var(--accent-teal)';
        if (displayLevel > 30) color = 'var(--accent-primary)';
        if (displayLevel > 50) color = 'var(--accent-warning)';
        if (displayLevel > 80) color = 'var(--accent-danger)';

        distressCircle.style.background = `conic-gradient(${color} 0% ${displayLevel}%, var(--bg-surface) ${displayLevel}% 100%)`;

        // Trend
        const trend = document.getElementById('trendIndicator');
        if (displayLevel > 50) trend.innerHTML = '<span class="text-warning">▲ RISING</span>';
        else trend.innerHTML = '<span class="text-teal">▼ STABLE</span>';

        // Dispatch
        if (displayLevel >= 75) {
            dispatchBtn.disabled = false;
            dispatchBtn.classList.remove('btn-danger', 'disabled');
            dispatchBtn.innerHTML = "⚠️ HUMAN REVIEW REQUIRED";
        }
    }
}