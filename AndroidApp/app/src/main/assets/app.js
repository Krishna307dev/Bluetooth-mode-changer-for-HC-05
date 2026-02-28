/**
 * Robot Car Bluetooth Controller
 * Made By Krishna
 * 
 * Controls a 3-in-1 Robot Car via HC-05 Bluetooth module.
 * Modes: Bluetooth Control (M), Human Following (Z), Obstacle Avoid (Y)
 */

// ===== SPLASH SCREEN =====
window.addEventListener('load', () => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 700);
        }, 3000);
    }
});

// ===== APP STATE =====
const state = {
    connected: false,
    currentMode: null,
    btDevice: null,
    btSocket: null,
    deviceName: '',
};

// ===== MODE DEFINITIONS =====
const MODES = {
    bluetooth: {
        command: 'M',
        name: 'BLUETOOTH CONTROL',
        description: 'Manual control via Bluetooth commands',
        icon: 'Bluetooth.svg', // User Req: Use new themed SVG
        color: 'var(--cyan)'
    },
    human: {
        command: 'Z',
        name: 'HUMAN FOLLOWING',
        description: 'Car follows human movement automatically',
        icon: 'Human.svg', // User Req: Use new themed SVG
        color: 'var(--green)'
    },
    obstacle: {
        command: 'Y',
        name: 'OBSTACLE AVOID',
        description: 'Car navigates around obstacles autonomously',
        icon: 'Obstacle.svg', // User Req: Use new themed SVG
        color: 'var(--orange)'
    },
};

// ===== DOM REFERENCES =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    statusDot: $('#statusDot'),
    statusText: $('#statusText'),
    connectBtn: $('#connectBtn'),
    connectBtnText: $('#connectBtnText'),
    modeDisplay: $('#modeDisplay'),
    modeName: $('#modeName'),
    modeDescription: $('#modeDescription'),
    modeIconLarge: $('#modeIconLarge'),
    modeCards: $$('.mode-card'),
    btModal: $('#btModal'),
    modalClose: $('#modalClose'),
    deviceList: $('#deviceList'),
    scanIndicator: $('#scanIndicator'),
    scanBtn: $('#scanBtn'),
    diagramBtn: $('#diagramBtn'),
    diagramOverlay: $('#diagramOverlay'),
    diagramClose: $('#diagramClose'),
    diagramImage: $('#diagramImage'),
    diagramViewport: $('#diagramViewport'),
    zoomIn: $('#zoomIn'),
    zoomOut: $('#zoomOut'),
    zoomReset: $('#zoomReset'),
    bgParticles: $('#bgParticles'),
    // Controller
    ctrlOverlay: $('#ctrlOverlay'),
    ctrlLaunch: $('#ctrlLaunch'),
    ctrlUI: $('#ctrlUI'),
    ctrlBack: $('#ctrlBack'),
    ctrlSafety: $('#ctrlSafety'),
    ctrlCmdBtn: $('#ctrlCmdBtn'),
    ctrlCmdPanel: $('#ctrlCmdPanel'),
    ctrlCmdClose: $('#ctrlCmdClose'),
    ctrlEditToggle: $('#ctrlEditToggle'),
    ctrlSaveBar: $('#ctrlSaveBar'),
    ctrlSaveBtn: $('#ctrlSaveBtn'),
    ctrlDeviceName: $('#ctrlDeviceName'),
    ctrlDirDisplay: $('#ctrlDirDisplay'),
    ctrlDirArrow: $('#ctrlDirArrow'),
    ctrlDirLabel: $('#ctrlDirLabel'),
    ctrlStopAll: $('#ctrlStopAll'),
    gearbox: $('#gearbox'),
    gearKnob: $('#gearKnob'),
    ctrlGearIndicator: $('#ctrlGearIndicator'),
    ctrlGearStatus: $('#ctrlGearStatus'),
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => initParticles());
    initModeCards();
    initConnectionControls();
    initDiagramViewer();
    initController();
});

// ===== BACKGROUND PARTICLES =====
function initParticles() {
    const container = DOM.bgParticles;
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 3 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.1;

        const colors = [
            'rgba(0, 240, 255, 0.4)',
            'rgba(0, 255, 136, 0.3)',
            'rgba(168, 85, 247, 0.3)',
        ];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(particle);
    }
}

// ===== MODE CARD INTERACTION =====
function initModeCards() {
    DOM.modeCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const mode = card.dataset.mode;
            const command = card.dataset.command;

            // Add ripple effect
            addRipple(card, e);

            // Set active mode
            setActiveMode(mode, command);
        });
    });
}

function setActiveMode(mode, command) {
    const modeData = MODES[mode];
    if (!modeData) return;

    // Block mode switching if not connected
    if (!state.connected) {
        showToast('⚠️ CONNECT TO THE ROBOT', 'error');
        return;
    }

    state.currentMode = mode;

    // Update mode cards visual state
    DOM.modeCards.forEach(card => {
        card.classList.remove('active');
        if (card.dataset.mode === mode) {
            card.classList.add('active');
        }
    });

    // Update main mode display
    DOM.modeDisplay.className = 'mode-display active-' + mode;
    // DOM.modeIconLarge.innerHTML = modeData.icon; // OLD
    DOM.modeIconLarge.src = modeData.icon; // NEW: Update Image Src
    DOM.modeIconLarge.style.filter = `drop-shadow(0 0 15px ${modeData.color})`; // Add dynamic glow

    DOM.modeName.textContent = modeData.name;
    DOM.modeDescription.textContent = modeData.description;

    // Animate mode display
    DOM.modeDisplay.style.transform = 'scale(0.97)';
    setTimeout(() => {
        DOM.modeDisplay.style.transform = 'scale(1)';
    }, 150);

    // Send command via Bluetooth
    sendBluetoothCommand(command);
    showToast(`Mode set: ${modeData.name}`, 'success');

    // Launch controller when Bluetooth mode is selected
    if (mode === 'bluetooth') {
        setTimeout(() => {
            launchController();
        }, 1000); // 1-second delay
    }
}

// ===== BLUETOOTH CONNECTION =====
function initConnectionControls() {
    DOM.connectBtn.addEventListener('click', () => {
        if (state.connected) {
            disconnectBluetooth();
        } else {
            showDeviceModal();
        }
    });

    DOM.modalClose.addEventListener('click', () => hideDeviceModal());
    DOM.btModal.addEventListener('click', (e) => {
        if (e.target === DOM.btModal) hideDeviceModal();
    });
    DOM.scanBtn.addEventListener('click', () => scanForDevices());
}

function showDeviceModal() {
    DOM.btModal.classList.add('show');
    scanForDevices();
}

function hideDeviceModal() {
    DOM.btModal.classList.remove('show');
}

/**
 * Bluetooth connectivity for Android WebView.
 * 
 * This app is designed to run inside an Android WebView that exposes
 * a `BluetoothBridge` JavaScript interface. The bridge provides:
 *   - BluetoothBridge.getPairedDevices() → JSON string of paired devices   
 *   - BluetoothBridge.connect(address) → connects to device
 *   - BluetoothBridge.disconnect() → disconnects
 *   - BluetoothBridge.send(data) → sends string data
 *   - BluetoothBridge.isConnected() → boolean
 * 
 * If the bridge is not available (e.g. running in a regular browser),
 * the app will fall back to demo mode.
 */

function hasBtBridge() {
    return typeof BluetoothBridge !== 'undefined';
}

function scanForDevices() {
    DOM.scanIndicator.classList.remove('hidden');
    DOM.scanIndicator.style.display = 'flex';

    // Remove old device items
    DOM.deviceList.querySelectorAll('.device-item, .no-devices').forEach(el => el.remove());

    if (hasBtBridge()) {
        // Real Android Bluetooth
        try {
            const devicesJson = BluetoothBridge.getPairedDevices();
            const devices = JSON.parse(devicesJson);

            setTimeout(() => {
                DOM.scanIndicator.style.display = 'none';
                if (devices.length === 0) {
                    showNoDevices();
                } else {
                    devices.forEach(device => addDeviceItem(device.name, device.address));
                }
            }, 800);
        } catch (e) {
            setTimeout(() => {
                DOM.scanIndicator.style.display = 'none';
                showNoDevices();
            }, 800);
        }
    } else {
        // Demo mode — show sample devices for UI preview
        setTimeout(() => {
            DOM.scanIndicator.style.display = 'none';
            addDeviceItem('HC-05', '00:21:13:00:A1:B2');
            addDeviceItem('HC-05 Robot', '98:D3:32:10:C3:E4');
            addDeviceItem('Arduino BT', 'AA:BB:CC:DD:EE:FF');
        }, 1500);
    }
}

function showNoDevices() {
    const div = document.createElement('div');
    div.className = 'no-devices';
    div.textContent = 'No paired devices found. Please pair your HC-05 in phone Settings first.';
    DOM.deviceList.appendChild(div);
}

function addDeviceItem(name, address) {
    const item = document.createElement('div');
    item.className = 'device-item';
    item.innerHTML = `
        <div class="device-bt-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6.5 6.5l11 11M6.5 17.5L12 12l5.5-5.5M12 2v20"/>
            </svg>
        </div>
        <div class="device-info">
            <div class="device-name">${name}</div>
            <div class="device-address">${address}</div>
        </div>
    `;
    item.addEventListener('click', () => connectToDevice(name, address));
    DOM.deviceList.appendChild(item);
}

function connectToDevice(name, address) {
    hideDeviceModal();
    setConnectionState('connecting', `Connecting to ${name}...`);

    if (hasBtBridge()) {
        try {
            // Native connect() runs on a background thread and will call
            // onBluetoothConnected() or onBluetoothError() when done
            BluetoothBridge.connect(address);
            state.deviceName = name;
        } catch (e) {
            setConnectionState('disconnected', 'Connection error');
            showToast('Bluetooth error: ' + e.message, 'error');
        }
    } else {
        // Demo mode
        setTimeout(() => {
            state.connected = true;
            state.deviceName = name;
            setConnectionState('connected', `Connected: ${name}`);
            showToast(`Connected to ${name} (Demo Mode)`, 'success');
        }, 1500);
    }
}

function disconnectBluetooth() {
    if (hasBtBridge()) {
        try {
            BluetoothBridge.disconnect();
        } catch (e) { /* ignore */ }
    }
    state.connected = false;
    state.deviceName = '';
    state.currentMode = null;
    setConnectionState('disconnected', 'Disconnected');
    resetModeDisplay();
    showToast('Disconnected', 'info');
}

function resetModeDisplay() {
    // Clear active mode from cards
    DOM.modeCards.forEach(card => card.classList.remove('active'));
    // Reset mode display to default
    DOM.modeDisplay.className = 'mode-display';
    DOM.modeIconLarge.src = 'Standby.svg';
    DOM.modeIconLarge.style.filter = 'drop-shadow(0 0 10px rgba(255,255,255,0.2))';
    DOM.modeName.textContent = 'No Mode Selected';
    DOM.modeDescription.textContent = 'Connect to your robot to start';
}

function setConnectionState(status, text) {
    DOM.statusDot.className = 'status-dot ' + status;
    DOM.statusText.textContent = text;

    if (status === 'connected') {
        DOM.connectBtn.classList.add('connected-state');
        DOM.connectBtnText.textContent = 'Disconnect';
    } else {
        DOM.connectBtn.classList.remove('connected-state');
        DOM.connectBtnText.textContent = 'Connect';
    }
}

function sendBluetoothCommand(command) {
    if (hasBtBridge() && state.connected) {
        try {
            BluetoothBridge.send(command);
        } catch (e) {
            showToast('Failed to send command', 'error');
        }
    } else {
        console.log(`[BT DEMO] Sending command: ${command}`);
    }
}

// Callbacks that native Android code can call
window.onBluetoothConnected = function (deviceName) {
    state.connected = true;
    state.deviceName = deviceName;
    setConnectionState('connected', `Connected: ${deviceName}`);
    showToast(`Connected to ${deviceName}`, 'success');
    if (document.getElementById('ctrlOverlay').classList.contains('show')) {
        startSignalAnimation();
    }
};

window.onBluetoothDisconnected = function () {
    state.connected = false;
    state.currentMode = null;
    setConnectionState('disconnected', 'Disconnected');
    resetModeDisplay();
    showToast('Bluetooth disconnected', 'error');
    stopSignalAnimation();
};

window.onBluetoothError = function (error) {
    state.connected = false;
    setConnectionState('disconnected', 'Connection failed');
    showToast('Error: ' + error, 'error');
    stopSignalAnimation();
};

// ===== BLUETOOTH CONTROLLER =====
const DEFAULT_CMDS = {
    forward: 'F', backward: 'B', left: 'L', right: 'R', stop: 'S',
    stop_all: 'D',
    fwd_left: 'G', fwd_right: 'I', bwd_left: 'H', bwd_right: 'J',
    mode_bt: 'M', mode_obstacle: 'Y', mode_follow: 'Z',
    safety_on: 'X', safety_off: 'x'
};

// Gear to speed command mapping: N=neutral(no movement), 1-5 = increasing speed
const GEAR_SPEED_MAP = {
    'N': '0',  // Neutral: speed 0
    '1': '2',  // Gear 1 = speed 2
    '2': '4',  // Gear 2 = speed 4
    '3': '6',  // Gear 3 = speed 6
    '4': '8',  // Gear 4 = speed 8
    '5': '9',  // Gear 5 = speed 9 (max)
};
let currentGear = 'N';  // Start in neutral

// Advanced Polish Capabilities
let wakeLock = null;
let vibrationIntensity = 20; // Default medium vibration
const VIBRATION_LEVELS = [0, 5, 20, 50];

// --- Screen Wake Lock ---
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
        }
    } catch (err) { }
}
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release().then(() => { wakeLock = null; });
    }
}

// --- Signal Animation ---
function startSignalAnimation() {
    const signalElem = document.getElementById('ctrlSignal');
    if (signalElem && state.connected) {
        signalElem.classList.add('connected');
        signalElem.querySelectorAll('.signal-bar').forEach((bar, i) => {
            bar.style.animationDelay = `${i * 0.2}s`;
            bar.classList.add('animate');
        });
    }
}
function stopSignalAnimation() {
    const signalElem = document.getElementById('ctrlSignal');
    if (signalElem) {
        signalElem.classList.remove('connected');
        signalElem.querySelectorAll('.signal-bar').forEach(b => b.classList.remove('animate'));
    }
}

// Direction arrow map for the center display using SVGs for cross-platform consistency
const createArrow = (deg) => `<svg style="transform: rotate(${deg}deg); width: 100%; height: 100%;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`;
const createStop = () => `<svg style="width: 80%; height: 80%;" viewBox="0 0 24 24" fill="currentColor" opacity="0.9"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;
const createStopAll = () => `<svg style="width: 100%; height: 100%;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><rect x="9" y="9" width="6" height="6" fill="currentColor"/></svg>`;
const createNeutral = () => `<div style="font-weight: 800; font-size: 2.2em; font-family: var(--font-display, sans-serif); display: flex; align-items: center; justify-content: center; height: 100%;">N</div>`;

const DIR_ARROWS = {
    F: { arrow: createArrow(0), label: 'FORWARD' },
    B: { arrow: createArrow(180), label: 'BACKWARD' },
    L: { arrow: createArrow(-90), label: 'LEFT' },
    R: { arrow: createArrow(90), label: 'RIGHT' },
    G: { arrow: createArrow(-45), label: 'FWD LEFT' },
    I: { arrow: createArrow(45), label: 'FWD RIGHT' },
    H: { arrow: createArrow(-135), label: 'BWD LEFT' },
    J: { arrow: createArrow(135), label: 'BWD RIGHT' },
    S: { arrow: createStop(), label: 'STOP', transform: 'none' },
    D: { arrow: createStopAll(), label: 'STOP ALL', transform: 'none' },
    N: { arrow: createNeutral(), label: 'NEUTRAL', transform: 'none' }
};

let ctrlCmds = { ...DEFAULT_CMDS };
let safetyOn = false;

function loadCustomCmds() {
    try {
        const saved = localStorage.getItem('robotcar_cmds');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(ctrlCmds, parsed);
        }
    } catch (e) { /* ignore */ }
}

function saveCustomCmds() {
    localStorage.setItem('robotcar_cmds', JSON.stringify(ctrlCmds));
}

function launchController() {
    // Reset launch screen
    DOM.ctrlLaunch.classList.remove('hide');
    // Reset the loading bar animation
    const barFill = DOM.ctrlLaunch.querySelector('.ctrl-launch-bar-fill');
    barFill.style.animation = 'none';
    barFill.offsetHeight; // force reflow
    barFill.style.animation = '';

    DOM.ctrlOverlay.classList.add('show');

    // Update device name in controller
    if (DOM.ctrlDeviceName) {
        DOM.ctrlDeviceName.textContent = state.deviceName || 'HC-05';
    }

    // Force landscape
    if (window.BluetoothBridge && window.BluetoothBridge.setScreenOrientation) {
        window.BluetoothBridge.setScreenOrientation('landscape');
    }

    requestWakeLock();
    startSignalAnimation();

    // After 2 seconds, hide launch screen and show controller
    setTimeout(() => {
        DOM.ctrlLaunch.classList.add('hide');
    }, 2000);
}

function closeController() {
    // Send stop all command
    sendBluetoothCommand(ctrlCmds.stop_all || 'D');
    updateDirectionDisplay(null);

    // Hide controller
    DOM.ctrlOverlay.classList.remove('show');
    if (DOM.ctrlCmdPanel) DOM.ctrlCmdPanel.classList.remove('show');

    // Return to portrait
    if (window.BluetoothBridge && window.BluetoothBridge.setScreenOrientation) {
        window.BluetoothBridge.setScreenOrientation('portrait');
    }

    releaseWakeLock();
    stopSignalAnimation();
}

function updateDirectionDisplay(cmdChar) {
    DOM.ctrlDirDisplay.classList.remove('active', 'neutral-active');

    // Reset transform to avoid sticking
    DOM.ctrlDirArrow.style.transform = 'none';

    if (!cmdChar) {
        if (currentGear === 'N') {
            DOM.ctrlDirDisplay.classList.add('neutral-active');
            DOM.ctrlDirArrow.innerHTML = DIR_ARROWS.N.arrow;
            DOM.ctrlDirLabel.textContent = 'NEUTRAL';
        } else {
            DOM.ctrlDirArrow.innerHTML = '';
            DOM.ctrlDirLabel.textContent = 'IDLE';
        }
        return;
    }
    const info = DIR_ARROWS[cmdChar];
    if (info) {
        DOM.ctrlDirDisplay.classList.add('active');
        DOM.ctrlDirArrow.innerHTML = info.arrow;
        DOM.ctrlDirArrow.style.transform = info.transform || 'none';
        DOM.ctrlDirLabel.textContent = info.label;
    }
}

const GEAR_INDICES = {
    '5': 0, '4': 1, '3': 2, '2': 3, '1': 4, 'N': 5
};

function setGear(gear) {
    currentGear = gear;
    const isNeutral = gear === 'N';

    // 1. Text & Visuals
    const knob = document.getElementById('gearKnob');
    if (knob) {
        knob.textContent = gear;
        knob.classList.toggle('neutral', isNeutral);
        // CSS Variable Magic
        const idx = GEAR_INDICES[gear] !== undefined ? GEAR_INDICES[gear] : 5;
        document.querySelector('.gearbox').style.setProperty('--gear-index', idx);
    }

    // 2. Highlight active slot
    const displayGear = document.getElementById('ctrlDisplayGear');
    if (displayGear) {
        displayGear.textContent = gear;
        displayGear.classList.toggle('neutral', isNeutral);
    }

    document.querySelectorAll('.gear-slot').forEach(s => s.classList.remove('active'));
    const activeSlot = document.querySelector(`.gear-slot[data-gear='${gear}']`);
    if (activeSlot) activeSlot.classList.add('active');

    // 3. Movement Command
    const speedCmd = GEAR_SPEED_MAP[gear];
    if (speedCmd) sendBluetoothCommand(speedCmd);

    // 4. Neutral/Stop Logic
    if (isNeutral) {
        sendBluetoothCommand(ctrlCmds.stop || 'S');
    }

    // 5. Update Display
    updateDirectionDisplay(null);
}

function initController() {
    loadCustomCmds();

    // --- Haptic Slider ---
    const hapticSlider = document.getElementById('hapticSlider');
    if (hapticSlider) {
        hapticSlider.addEventListener('input', (e) => {
            vibrationIntensity = VIBRATION_LEVELS[e.target.value];
            if (navigator.vibrate && vibrationIntensity > 0) navigator.vibrate(vibrationIntensity);
        });
    }

    // --- Back/Exit button ---
    DOM.ctrlExit = $('#ctrlExit'); // Re-select if needed since ID changed/kept
    if (DOM.ctrlExit) DOM.ctrlExit.addEventListener('click', closeController);

    // --- STOP ALL button ---
    const stopAllBtn = document.getElementById('ctrlStopAll');
    if (stopAllBtn) {
        stopAllBtn.addEventListener('click', () => {
            sendBluetoothCommand(ctrlCmds.stop_all || 'D');
            updateDirectionDisplay('D');
            setTimeout(() => updateDirectionDisplay(null), 600);
        });
    }

    // --- D-Pad Buttons (Cardinals + Diagonals) ---
    // We bind events to all .dpad-btn and .stick-btn
    // --- Directional Control (Multi-Touch Support) ---
    const activeDirs = { fwd: false, bwd: false, left: false, right: false };
    let lastSentMoveCmd = null;

    function resolveMovement() {
        if (currentGear === 'N') return;

        const f = activeDirs.fwd;
        const b = activeDirs.bwd;
        const l = activeDirs.left;
        const r = activeDirs.right;

        let cmd = null;
        let displayCmd = null;

        // Priority to Diagonals
        if (f && l) cmd = ctrlCmds.fwd_left || 'G';
        else if (f && r) cmd = ctrlCmds.fwd_right || 'I';
        else if (b && l) cmd = ctrlCmds.bwd_left || 'H';
        else if (b && r) cmd = ctrlCmds.bwd_right || 'J';
        // Cardinals
        else if (f) cmd = ctrlCmds.forward || 'F';
        else if (b) cmd = ctrlCmds.backward || 'B';
        else if (l) cmd = ctrlCmds.left || 'L';
        else if (r) cmd = ctrlCmds.right || 'R';
        // Stop
        else cmd = ctrlCmds.stop || 'S';

        // Send check
        if (cmd !== lastSentMoveCmd) {
            sendBluetoothCommand(cmd);
            lastSentMoveCmd = cmd;

            // Update Display
            if (cmd === (ctrlCmds.stop || 'S')) {
                updateDirectionDisplay(null);
            } else {
                updateDirectionDisplay(cmd);
            }
        }
    }

    const bindDirectionBtn = (id, dirKey) => {
        const btn = document.getElementById(id);
        if (!btn) return;

        const setDir = (active) => {
            if (activeDirs[dirKey] !== active) {
                activeDirs[dirKey] = active;
                if (active) btn.classList.add('pressed');
                else btn.classList.remove('pressed');
                if (active && navigator.vibrate && vibrationIntensity > 0) navigator.vibrate(vibrationIntensity);
                resolveMovement();
            }
        };

        btn.addEventListener('touchstart', (e) => { e.preventDefault(); setDir(true); }, { passive: false });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); setDir(false); }, { passive: false });
        btn.addEventListener('touchcancel', (e) => { e.preventDefault(); setDir(false); }, { passive: false });
        btn.addEventListener('contextmenu', (e) => { e.preventDefault(); });

        // Mouse fallbacks for testing
        btn.addEventListener('mousedown', (e) => { setDir(true); });
        btn.addEventListener('mouseup', (e) => { setDir(false); });
        btn.addEventListener('mouseleave', (e) => { if (activeDirs[dirKey]) setDir(false); });
    };

    bindDirectionBtn('btnForward', 'fwd');
    bindDirectionBtn('btnBackward', 'bwd');
    bindDirectionBtn('btnLeft', 'left');
    bindDirectionBtn('btnRight', 'right');

    // --- Gearbox Slide & Tap Logic ---
    const gearbox = document.querySelector('.gearbox');
    const gearsList = ['5', '4', '3', '2', '1', 'N']; // Top to bottom

    if (gearbox) {
        // Tap (Click)
        const gearSlots = document.querySelectorAll('.gear-slot');
        gearSlots.forEach(slot => {
            slot.addEventListener('click', () => setGear(slot.dataset.gear));
        });

        // Slide (Touch)
        const handleSlide = (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            const rect = gearbox.getBoundingClientRect();

            // Calculate relative Y (0 to 1)
            let relativeY = (touch.clientY - rect.top) / rect.height;

            // Clamp to 0-1
            relativeY = Math.max(0, Math.min(1, relativeY));

            // Map to 6 slots (0 to 5)
            const index = Math.floor(relativeY * 6);
            const constrainedIndex = Math.min(5, Math.max(0, index));

            const targetGear = gearsList[constrainedIndex];
            if (targetGear !== currentGear) {
                setGear(targetGear);
                // Haptic feedback
                if (navigator.vibrate && vibrationIntensity > 0) navigator.vibrate(vibrationIntensity);
            }
        };

        gearbox.addEventListener('touchstart', handleSlide, { passive: false });
        gearbox.addEventListener('touchmove', handleSlide, { passive: false });
    }

    // Initialize gearbox to Neutral
    setTimeout(() => setGear('N'), 100);

    // --- Safety Toggle ---
    const safetyBtn = document.getElementById('ctrlSafety');
    if (safetyBtn) {
        safetyBtn.addEventListener('click', () => {
            safetyOn = !safetyOn;
            safetyBtn.classList.toggle('active', safetyOn);
            if (navigator.vibrate && vibrationIntensity > 0) navigator.vibrate(vibrationIntensity);
            sendBluetoothCommand(safetyOn ? ctrlCmds.safety_on : ctrlCmds.safety_off);
            showToast(safetyOn ? '🛡️ Safety Assist ON' : '⚠️ Safety Assist OFF', safetyOn ? 'success' : 'info');
        });
    }

    // --- CMD Panel ---
    const cmdBtn = document.getElementById('ctrlCmdBtn');
    if (cmdBtn) {
        cmdBtn.addEventListener('click', () => {
            DOM.ctrlCmdPanel.classList.toggle('show');
        });
    }
    DOM.ctrlCmdClose.addEventListener('click', () => {
        DOM.ctrlCmdPanel.classList.remove('show');
    });

    // --- Edit Toggle ---
    DOM.ctrlEditToggle.addEventListener('change', () => {
        const editing = DOM.ctrlEditToggle.checked;
        const inputs = document.querySelectorAll('.ctrl-cmd-input');
        inputs.forEach(inp => {
            if (inp.closest('.ctrl-cmd-row')?.dataset.key) {
                inp.disabled = !editing;
            }
        });
        DOM.ctrlSaveBar.classList.toggle('show', editing);
    });

    // --- Save Button ---
    DOM.ctrlSaveBtn.addEventListener('click', () => {
        // No confirm dialog, just save
        const rows = document.querySelectorAll('.ctrl-cmd-row[data-key]');
        rows.forEach(row => {
            const key = row.dataset.key;
            const input = row.querySelector('.ctrl-cmd-input');
            if (key && input && input.value.trim()) {
                ctrlCmds[key] = input.value.trim();
            }
        });
        saveCustomCmds();
        showToast('✅ Commands saved!', 'success');

        // Exit edit mode
        DOM.ctrlEditToggle.checked = false;
        DOM.ctrlEditToggle.dispatchEvent(new Event('change'));
    });

    // Sync CMD inputs with loaded commands
    syncCmdInputs();
}

function syncCmdInputs() {
    const rows = document.querySelectorAll('.ctrl-cmd-row[data-key]');
    rows.forEach(row => {
        const key = row.dataset.key;
        const input = row.querySelector('.ctrl-cmd-input');
        if (key && input && ctrlCmds[key]) {
            input.value = ctrlCmds[key];
        }
    });
}

function updateDpadCmds() {
    const map = {
        'dpad-f': 'forward', 'dpad-b': 'backward', 'dpad-l': 'left', 'dpad-r': 'right',
        'dpad-stop': 'stop', 'dpad-fl': 'fwd_left', 'dpad-fr': 'fwd_right',
        'dpad-bl': 'bwd_left', 'dpad-br': 'bwd_right'
    };
    Object.entries(map).forEach(([cls, key]) => {
        const btn = document.querySelector(`.${cls}`);
        if (btn && ctrlCmds[key]) {
            btn.dataset.cmd = ctrlCmds[key];
        }
    });
}

// ===== DIAGRAM VIEWER =====
function initDiagramViewer() {
    let scale = 1;
    let posX = 0;
    let posY = 0;
    let isDragging = false;
    let startX, startY;
    let lastTouchDist = 0;
    let lastTapTime = 0;

    DOM.diagramBtn.addEventListener('click', () => {
        DOM.diagramOverlay.classList.add('show');
        // Force landscape mode on Android
        if (window.BluetoothBridge && window.BluetoothBridge.setScreenOrientation) {
            window.BluetoothBridge.setScreenOrientation('landscape');
        }
        // Wait a frame for the overlay to render, then reset
        requestAnimationFrame(() => resetDiagramView());
    });

    DOM.diagramClose.addEventListener('click', () => {
        DOM.diagramOverlay.classList.remove('show');
        // Return to portrait mode on Android
        if (window.BluetoothBridge && window.BluetoothBridge.setScreenOrientation) {
            window.BluetoothBridge.setScreenOrientation('portrait');
        }
    });

    DOM.zoomIn.addEventListener('click', () => {
        scale = Math.min(scale * 1.3, 8);
        clampAndApply();
    });

    DOM.zoomOut.addEventListener('click', () => {
        scale = Math.max(scale / 1.3, 1);
        clampAndApply();
    });

    DOM.zoomReset.addEventListener('click', resetDiagramView);

    function resetDiagramView() {
        scale = 1;
        posX = 0;
        posY = 0;
        applyTransform();
    }

    /**
     * Clamp posX/posY so the image edges never go inside the viewport.
     * At scale=1 the image fits naturally and can't be panned at all.
     * When zoomed in, you can only pan until you reach an image edge.
     */
    function clampPosition() {
        const img = DOM.diagramImage;
        const vp = DOM.diagramViewport;

        // Natural (un-scaled) rendered size of the image in CSS pixels
        const imgW = img.offsetWidth;
        const imgH = img.offsetHeight;

        // Viewport size
        const vpW = vp.clientWidth;
        const vpH = vp.clientHeight;

        // The scaled image dimensions
        const scaledW = imgW * scale;
        const scaledH = imgH * scale;

        // How much extra width/height the zoom adds beyond the viewport
        const overflowX = Math.max(0, (scaledW - vpW) / 2);
        const overflowY = Math.max(0, (scaledH - vpH) / 2);

        // Clamp: the image can shift by at most the overflow amount
        posX = Math.max(-overflowX, Math.min(overflowX, posX));
        posY = Math.max(-overflowY, Math.min(overflowY, posY));
    }

    function clampAndApply() {
        clampPosition();
        applyTransform();
    }

    function applyTransform() {
        DOM.diagramImage.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    }

    // Mouse drag
    DOM.diagramViewport.addEventListener('mousedown', (e) => {
        if (scale <= 1) return; // No drag at normal zoom
        isDragging = true;
        startX = e.clientX - posX;
        startY = e.clientY - posY;
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        posX = e.clientX - startX;
        posY = e.clientY - startY;
        clampAndApply();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Mouse wheel zoom
    DOM.diagramViewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        scale = Math.min(Math.max(scale * delta, 1), 8);
        clampAndApply();
    }, { passive: false });

    // Touch: drag and pinch-to-zoom
    DOM.diagramViewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Double-tap detection
            const now = Date.now();
            if (now - lastTapTime < 300) {
                resetDiagramView();
                e.preventDefault();
                return;
            }
            lastTapTime = now;

            if (scale > 1) {
                isDragging = true;
                startX = e.touches[0].clientX - posX;
                startY = e.touches[0].clientY - posY;
            }
        } else if (e.touches.length === 2) {
            isDragging = false;
            lastTouchDist = getTouchDistance(e.touches);
        }
        e.preventDefault();
    }, { passive: false });

    DOM.diagramViewport.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging && scale > 1) {
            posX = e.touches[0].clientX - startX;
            posY = e.touches[0].clientY - startY;
            clampAndApply();
        } else if (e.touches.length === 2) {
            const dist = getTouchDistance(e.touches);
            const delta = dist / lastTouchDist;
            scale = Math.min(Math.max(scale * delta, 1), 8);
            lastTouchDist = dist;
            clampAndApply();
        }
        e.preventDefault();
    }, { passive: false });

    DOM.diagramViewport.addEventListener('touchend', () => {
        isDragging = false;
    });

    function getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// ===== TOAST NOTIFICATIONS =====
let toastTimeout;
function showToast(message, type = 'info') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    clearTimeout(toastTimeout);
    toast.classList.remove('show', 'toast-success', 'toast-error', 'toast-info');
    toast.textContent = message;
    toast.classList.add('toast-' + type);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ===== RIPPLE EFFECT =====
function addRipple(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = element.getBoundingClientRect();
    const x = (event.clientX || event.touches?.[0]?.clientX || rect.width / 2) - rect.left;
    const y = (event.clientY || event.touches?.[0]?.clientY || rect.height / 2) - rect.top;
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}
