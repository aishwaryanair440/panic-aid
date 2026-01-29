# Care-Aid: Frontend Design Specification

## 1. FRONTEND STRATEGY (WHY THIS UI WINS)
**Concept**: "The Interface is the Infrastructure."
*   **What the user sees first**: A stark, muted screen with a single "System Status: Active" indicator and a rhythmic, breathing pulse. No marketing, no hero images.
*   **Impact Communication**: By stripping away decoration, the UI signals "this is a tool for professionals." It builds trust through transparency and restraint. The slow pacing of the distress meter communicates that this system is thoughtful, not reactive.
*   **Alignment**: The "Ethics First" login screen forces the user to acknowledge the privacy constraints (No PII, No Face Rec) before entering, instantly ticking the governance/ethics box for judges.

## 2. USER FLOWS
1.  **First-time User (Judge)**:
    *   Lands on `index.html`.
    *   Reads the "Operational Ethics" statement.
    *   Clicks "Acknowledge & Sign In".
    *   Enters `monitoring.html` (The dashboard).
    *   Witnesses the "Distress Meter" slowly accumulating data.

2.  **Returning Operator**:
    *   Auto-redirects to `monitoring.html` (via localStorage).
    *   Immediately sees the "Shift Summary" and "Active Zones".

3.  **Supervisor Review**:
    *   Clicks on a specific "Signal Cluster" in the feed.
    *   See a "Pattern Replay" (abstract data visualization, not video).
    *   Flags it for "Human Intervention".

## 3. PAGE & FILE STRUCTURE
*   `index.html`: **The Gatekeeper**. Sets the tone, handles "authentication" (ethics acceptance).
*   `monitoring.html`: **The Workstation**. The main observation layer where the magic happens.
*   `css/styles.css`: **The Uniform**. Contains the custom utility classes for the "muted" aesthetic.
*   `js/app.js`: **The Brain**. Simulates the pattern recognition logic and handles the UI updates.

## 4. UI COMPONENT BREAKDOWN
*   **The Distress Meter (Monitoring)**: A circular or vertical progress bar that fills *painfully slowly*. Solves the "dashboard fatigue" problem by only demanding attention when necessary.
*   **The Signal Feed (Monitoring)**: A scrolling list of text-based cues ("Micro-expression: Fear", "Gaze: Fixed"). Solves the privacy problem by showing *data*, not *faces*.
*   **The Ethics Modal (Index)**: A mandatory overlay. Solves the "unethical AI" critique by making consent explicit.

## 5. ACCESSIBILITY & INCLUSIVITY
*   **High Contrast Mode**: All text colors are checked against WCAG AAA standards (e.g., `#E2E8F0` on `#0F172A`).
*   **Screen Readers**: `aria-live` regions used for the Signal Feed so blind operators can hear the distress accumulation.
*   **Keyboard Nav**: Full tab support for all interactive elements.
*   **Cognitive Load**: Minimal animations prevent sensory overload.

## 6. DESIGN SYSTEM
*   **Palette**:
    *   Background: `Slate-900` (Deep, professional dark mode).
    *   Text: `Slate-200` (Soft white, less harsh than pure white).
    *   Accents: `Amber-500` (Warning), `Teal-400` (Safe/Scanning).
*   **Typography**: `Inter` (Google Fonts). Clean, legible, modern.
*   **Layout**: Bootstrap 5 Grid, but with lots of negative space (Padding over borders).

## 7. FRONTEND LOGIC (Vanilla JS)
*   **State**: `const systemState = { distressLevel: 0, signals: [] }`.
*   **Simulation**: `setInterval` pushes new "Signal" objects into the array every 2-5 seconds.
*   **Update Loop**: `renderFeed()` and `updateMeter()` run on every state change.
*   **Persistence**: `localStorage.setItem('hasAcceptedEthics', 'true')`.

## 8. DEMO SCRIPT
1.  **0:00 - 0:15**: Open `index.html`. Narrator: "Care-Aid isn't a surveillance tool. It's a safety layer." Click "Acknowledge Ethics".
2.  **0:15 - 1:00**: Land on `monitoring.html`. Hands off mouse. Narrator: "Watch the Observation Layer. It notices what we miss."
3.  **1:00 - 1:45**: A signal ("Crowd Sudden Freeze") appears. The Distress Meter pulses Amber. Narrator: "It detects patterns, not people."
4.  **1:45 - 2:00**: Hover over the signal. Click "Dispatch Human Review". Narrator: "And it empowers humans to act."
