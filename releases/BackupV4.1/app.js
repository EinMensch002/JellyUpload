/* ================================
   Jellyfin Media Sortierung v3.0
   Komplett überarbeitetes System mit echtem Upload
================================ */

/* ================================
   CONFIGURATION - WIRD AUS app.json GELADEN
================================ */
// Defaults (werden von app.json überschrieben)
let CONFIG = {
  version: '3.0',
  debug: {
    enabled: false,
    allowUrlOverride: true
  },
  paths: {
    tempUpload: '/media/temp',
    analysisResultsFile: 'analysis_results.json'
  },
  api: {
    n8nBaseUrl: 'https://192.168.178.145:5678/webhook',
    endpoints: {
      upload: '/upload',
      analyse: '/analyse',
      finalize: '/finalize'
    }
  }
};

/* ================================
   DEBUG SYSTEM - URL-aktiviert: ?debug=true
   Übersichtliches Debug-Interface mit Tabs
================================ */
const DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debug') === 'true';

let debugLogs = [];
let debugOpen = false;
let debugSelectedFile = null;
let detailedLogs = [];  // Detaillierte Logs nur für Debug-Mode

function initDebugMode() {
  logDebug('🚀 Jellyfin Sortierung v3.0 gestartet', 'system');
  logDebug(`Debug Mode: ${DEBUG_ENABLED ? '✓ AKTIVIERT' : '✗ Deaktiviert'}`, DEBUG_ENABLED ? 'success' : 'info');
  
  // WICHTIG: Debug-UI IMMER erstellen, nicht nur wenn DEBUG_ENABLED!
  // So können die Logs jederzeit über den 🐛-Button angesehen werden
  createDebugUI();
}

/**
 * logDebug(message, type, details)
 * Zwei-Stufen Logging System:
 * 1. NORMALE LOGS: Einfache Nachricht mit Icon und Zeit (IMMER)
 * 2. DETAILLIERTE LOGS: Umfangreiche Informationen (NUR wenn DEBUG_ENABLED=true)
 * 
 * Parameter:
 *   message: Hauptnachricht (wird immer geloggt)
 *   type: 'system', 'info', 'success', 'error', 'warning', 'upload', 'analyse', 'data', 'config'
 *   details: Optionales Detailobjekt {variable: wert, ...} - wird NUR im Debug-Modus geloggt
 */
function logDebug(message, type = 'log', details = null) {
  // Zeitstempel und Icon
  const iconMap = {
    system: '🚀',
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    upload: '📤',
    analyse: '🔍',
    data: '💾',
    config: '⚙️'
  };
  
  const icon = iconMap[type] || '📝';
  const timestamp = new Date().toLocaleTimeString('de-DE');
  const logMessage = `[${timestamp}] ${icon} ${message}`;
  
  // ===== STUFE 1: NORMALE LOGS (IMMER) =====
  debugLogs.push({ 
    message: logMessage, 
    type,
    timestamp: new Date(),
    raw: message
  });
  
  // Console mit Farbe (IMMER ausgeben)
  const colorMap = {
    system: 'color: #60a5fa; font-weight: bold',
    info: 'color: #3b82f6',
    success: 'color: #10b981; font-weight: bold',
    error: 'color: #ef4444; font-weight: bold',
    warning: 'color: #f59e0b; font-weight: bold',
    upload: 'color: #8b5cf6',
    analyse: 'color: #06b6d4',
    data: 'color: #ec4899',
    config: 'color: #f97316'
  };
  
  console.log(`%c${logMessage}`, colorMap[type] || 'color: inherit');
  
  // ===== STUFE 2: DETAILLIERTE LOGS (NUR IM DEBUG-MODE) =====
  if (DEBUG_ENABLED && details) {
    const detailString = typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details);
    const detailedLog = {
      message: logMessage,
      type,
      timestamp: new Date(),
      details: detailString,
      raw: message
    };
    detailedLogs.push(detailedLog);
    
    // Auch in Console mit Details ausgeben (im Debug-Modus)
    console.group(`%c${logMessage}`, colorMap[type] || 'color: inherit');
    console.log('%cDETAILS:', 'color: #60a5fa; font-weight: bold');
    console.log(details);
    console.groupEnd();
  }
  
  // UI aktualisieren wenn Debug-Modal offen ist
  if (debugOpen) {
    updateDebugUI();
  }
}

/**
 * logInfo(message, details)
 * Abkürzung für häufige normale Logs
 */
function logInfo(message, details = null) {
  logDebug(message, 'info', details);
}

/**
 * logSuccess(message, details)
 * Abkürzung für Success-Logs
 */
function logSuccess(message, details = null) {
  logDebug(message, 'success', details);
}

/**
 * logError(message, details)
 * Abkürzung für Error-Logs
 */
function logError(message, details = null) {
  logDebug(message, 'error', details);
}

/**
 * logWarn(message, details)
 * Abkürzung für Warning-Logs
 */
function logWarn(message, details = null) {
  logDebug(message, 'warning', details);
}

/**
 * logData(message, data)
 * Für Daten-Logs mit automatischer JSON-Serialisierung
 */
function logData(message, data = null) {
  logDebug(message, 'data', data);
}

function createDebugUI() {
  const html = `
    <style>
      .debug-style * { font-family: 'Courier New', monospace; }
      #debugToggle { position: fixed; bottom: 30px; right: 30px; width: 70px; height: 70px; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; border: none; border-radius: 50%; font-size: 1.8rem; cursor: pointer; z-index: 999998; box-shadow: 0 8px 20px rgba(59,130,246,0.4); display: flex; align-items: center; justify-content: center; font-weight: bold; transition: all 0.3s ease; }
      #debugToggle:hover { transform: scale(1.15); box-shadow: 0 12px 28px rgba(59,130,246,0.6); }
      #debugModal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15,23,42,0.98); z-index: 999999; overflow-y: auto; }
      .debug-wrap { background: linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%); color: #e2e8f0; padding: 30px; margin: 30px auto; max-width: 1600px; border-radius: 12px; border: 2px solid #3b82f6; box-shadow: 0 8px 32px rgba(59,130,246,0.1); }
      .debug-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; background: rgba(59,130,246,0.05); padding: 20px; border-radius: 8px; margin: -30px -30px 25px -30px; padding-left: 30px; padding-right: 30px; }
      .debug-header h1 { margin: 0; font-size: 2.2rem; color: #60a5fa; font-weight: 700; letter-spacing: 0.5px; }
      .debug-close { background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
      .debug-close:hover { background: #dc2626; transform: translateY(-1px); }
      .debug-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px; }
      .debug-stat { background: linear-gradient(135deg, #1a1f3a 0%, #1e293b 100%); padding: 20px; border-radius: 8px; border-left: 5px solid #3b82f6; border-top: 1px solid rgba(59,130,246,0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
      .debug-stat-label { color: #94a3b8; font-size: 0.8rem; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.5px; text-transform: uppercase; }
      .debug-stat-value { color: #60a5fa; font-size: 1.8rem; font-weight: 700; word-break: break-all; font-family: 'Courier New', monospace; }
      .debug-tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 10px; }
      .debug-tab { padding: 10px 15px; background: transparent; color: #94a3b8; border: none; cursor: pointer; font-weight: 600; border-bottom: 2px solid transparent; transition: all 0.2s; }
      .debug-tab.active { color: #60a5fa; border-bottom-color: #3b82f6; }
      .debug-content { display: none; }
      .debug-content.active { display: block; }
      .debug-section { background: #1a1f3a; padding: 15px; border-radius: 6px; margin-bottom: 15px; border: 1px solid #1e293b; }
      .debug-section-title { color: #60a5fa; font-weight: bold; margin-bottom: 10px; }
      .debug-input { width: 100%; padding: 12px; background: #1a1f3a; border: 2px solid #3b82f6; border-radius: 6px; color: #60a5fa; font-family: monospace; font-size: 0.9rem; margin-bottom: 10px; font-weight: 500; transition: all 0.2s; }
      .debug-input::placeholder { color: #475569; font-weight: 400; }
      .debug-input:focus { outline: none; border-color: #60a5fa; background: #0f172a; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
      .debug-btn { padding: 10px 15px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
      .debug-btn:hover { background: #1e40af; }
      .debug-btn.danger { background: #ef4444; }
      .debug-btn:disabled { background: #475569; cursor: not-allowed; }
      .debug-logs { max-height: 500px; overflow-y: auto; border: 1px solid #1e293b; border-radius: 6px; background: #0f172a; padding: 10px; }
      .debug-log { background: #1a1f3a; padding: 12px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #3b82f6; cursor: pointer; }
      .debug-log:hover { background: #1e293b; }
      .debug-log.error { border-left-color: #ef4444; }
      .debug-drop { border: 2px dashed #3b82f6; padding: 20px; border-radius: 6px; text-align: center; cursor: pointer; transition: all 0.2s; }
      .debug-drop:hover { border-color: #60a5fa; background: rgba(59,130,246,0.1); }
      .debug-drop.drag { border-color: #60a5fa; background: rgba(59,130,246,0.2); }
      .debug-filename { color: #86efac; margin-top: 10px; font-size: 0.9rem; }
    </style>
    
    <button id="debugToggle">🐛</button>
    
    <div id="debugModal">
      <div class="debug-wrap">
        <div class="debug-header">
          <h1>🐛 Debug Panel - Einzelne Endpoints testen</h1>
          <button class="debug-close" id="debugClose">✕ Schließen</button>
        </div>
        
        <div class="debug-stats">
          <div class="debug-stat">
            <div class="debug-stat-label">🔐 SessionId</div>
            <div class="debug-stat-value" id="debugSessionId">-</div>
          </div>
          <div class="debug-stat">
            <div class="debug-stat-label">📞 API Calls</div>
            <div class="debug-stat-value" id="debugCallCount">0</div>
          </div>
          <div class="debug-stat">
            <div class="debug-stat-label">✓ Erfolgreiche</div>
            <div class="debug-stat-value" id="debugSuccessCount">0</div>
          </div>
        </div>
        
        <div class="debug-tabs">
          <button class="debug-tab active" data-tab="logs">📋 Logs</button>
          <button class="debug-tab" data-tab="tester">🧪 Endpoint Tester</button>
          <button class="debug-tab" data-tab="info">ℹ️ Info</button>
        </div>
        
        <div class="debug-content active" id="logs">
          <div class="debug-section">
            <div class="debug-section-title">📝 System Logs</div>
            <div class="debug-logs" id="debugLogsList"><div style="text-align:center;color:#94a3b8;">⏳ Bereit...</div></div>
          </div>
        </div>
        
        <div class="debug-content" id="tester">
          <!-- URL Selection -->
          <div class="debug-section">
            <div class="debug-section-title">🔗 URL-Modus</div>
            <div style="display: flex; gap: 20px; margin-bottom: 15px;">
              <label style="color: #94a3b8; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="urlMode" value="server" checked style="cursor: pointer;">
                <span>Server URL</span>
              </label>
              <label style="color: #94a3b8; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <input type="radio" name="urlMode" value="custom" style="cursor: pointer;">
                <span>Eigene URL</span>
              </label>
            </div>
          </div>

          <!-- Server URL Mode mit Test/Production Toggle -->
          <div id="serverUrlMode" class="debug-section">
            <div class="debug-section-title">🖥️ Server-Konfiguration</div>
            <label style="color: #94a3b8; display: block; margin-bottom: 8px;"><strong>Umgebung:</strong></label>
            <select id="debugUrlEnvironment" style="width: 100%; padding: 12px; background: #1a1f3a; border: 2px solid #3b82f6; border-radius: 6px; color: #60a5fa; font-family: monospace; font-weight: 600; margin-bottom: 15px; cursor: pointer;">
              <option value="production">🟢 Production</option>
              <option value="test">🔵 Test</option>
            </select>
            
            <label style="color: #94a3b8; display: block; margin-bottom: 8px;"><strong>Base URL:</strong></label>
            <input type="text" id="debugServerBase" class="debug-input" style="color: #60a5fa; font-weight: 600; background: #0f172a; border-color: #3b82f6;" disabled />
            
            <label style="color: #94a3b8; display: block; margin: 15px 0 8px 0;"><strong>Endpoint:</strong></label>
            <select id="debugEndpointSelect" style="width: 100%; padding: 12px; background: #1a1f3a; border: 2px solid #3b82f6; border-radius: 6px; color: #60a5fa; font-family: monospace; font-weight: 600; margin-bottom: 15px; cursor: pointer;">
              <option value="">-- Endpoint wählen --</option>
            </select>
          </div>

          <!-- Custom URL Mode -->
          <div id="customUrlMode" class="debug-section" style="display: none;">
            <div class="debug-section-title">🔧 Eigene URL</div>
            <input type="text" id="debugCustomUrl" class="debug-input" placeholder="https://..." style="color: #60a5fa; font-weight: 600;" />
          </div>

          <!-- File Upload -->
          <div class="debug-section">
            <div class="debug-section-title">📁 Datei zum Upload</div>
            <div style="border: 2px dashed #3b82f6; padding: 20px; border-radius: 6px; text-align: center; cursor: pointer; transition: all 0.2s;" id="debugFileDrop">
              <div style="font-size: 2rem;">📤</div>
              <div style="color: #60a5fa; margin-top: 10px; font-weight: 600;">Datei hier ablegen oder klicken</div>
              <input type="file" id="debugFileInput" style="display: none;" />
              <div id="debugFileName" style="color: #86efac; margin-top: 10px; font-size: 0.9rem;">Keine Datei gewählt</div>
            </div>
          </div>

          <!-- Request Body Editor -->
          <div class="debug-section">
            <div class="debug-section-title">📝 Request-Daten (JSON)</div>
            <textarea id="debugRequestJson" style="width: 100%; height: 150px; padding: 12px; background: #1a1f3a; border: 2px solid #3b82f6; border-radius: 6px; color: #60a5fa; font-family: monospace; font-size: 0.9rem; resize: vertical; margin-bottom: 10px;">
{}</textarea>
            <button id="debugFormatJsonBtn" class="debug-btn">📐 JSON formatieren</button>
          </div>

          <!-- Send Button -->
          <div class="debug-section">
            <button id="debugTestBtn" class="debug-btn" style="width: 100%; padding: 15px; font-size: 1rem; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);"> 🚀 Upload starten</button>
          </div>
          
          <!-- Response -->
          <div class="debug-section">
            <div class="debug-section-title">📊 Response</div>
            <div id="debugStatus" style="color:#94a3b8;white-space:pre-wrap;font-size:0.85rem;max-height:400px;overflow-y:auto;background:#0f172a;padding:10px;border-radius:4px;border:1px solid #1e293b;">Bereit...</div>
          </div>

          <!-- Test History -->
          <div class="debug-section">
            <div class="debug-section-title">📜 Test-Verlauf</div>
            <div id="debugTestHistory" style="max-height: 300px; overflow-y: auto; border: 1px solid #1e293b; border-radius: 4px; background: #0f172a; padding: 0;">
              <div style="text-align: center; color: #94a3b8; padding: 20px;">Noch keine Tests durchgeführt</div>
            </div>
          </div>
        </div>
        
        <div class="debug-content" id="info">
          <div class="debug-section">
            <div class="debug-section-title">ℹ️ System Info</div>
            <div style="color:#94a3b8;font-size:0.9rem;line-height:1.8;">
              <div>📍 <strong>Mode:</strong> URL-Parameter aktiviert (?debug=true)</div>
              <div>🔄 <strong>API Base:</strong> <span id="debugApiBase">${CONFIG.api.n8nBaseUrl}</span></div>
              <div>📊 <strong>Logs:</strong> <span id="debugLogCount">0</span></div>
              <br/>
              <button class="debug-btn" id="debugExport" style="margin-top:10px;">📥 Logs exportieren</button>
              <button class="debug-btn danger" id="debugClear" style="margin-top:10px;">🗑️ Logs löschen</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const wrap = document.createElement('div');
  wrap.className = 'debug-style';
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  // Event Listener
  document.getElementById('debugToggle').addEventListener('click', toggleDebugModal);
  document.getElementById('debugClose').addEventListener('click', toggleDebugModal);
  
  // Tab switching
  document.querySelectorAll('.debug-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      switchDebugTab(this.dataset.tab);
    });
  });

  document.getElementById('debugTestBtn').addEventListener('click', performDebugUpload);
  document.getElementById('debugExport').addEventListener('click', exportDebugLogs);
  document.getElementById('debugClear').addEventListener('click', clearDebugLogs);
  document.getElementById('debugFormatJsonBtn').addEventListener('click', formatDebugJson);

  // URL Environment Change - Update Base URL und neu populate endpoints
  document.getElementById('debugUrlEnvironment').addEventListener('change', (e) => {
    updateDebugUrlEnvironment();
  });

  // URL Mode Selection
  document.querySelectorAll('input[name="urlMode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const isServer = e.target.value === 'server';
      document.getElementById('serverUrlMode').style.display = isServer ? 'block' : 'none';
      document.getElementById('customUrlMode').style.display = isServer ? 'none' : 'block';
    });
  });

  // File Upload Handler
  const fileDrop = document.getElementById('debugFileDrop');
  const fileInput = document.getElementById('debugFileInput');
  
  fileDrop.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
      selectDebugFile(e.target.files[0]);
    }
  });
  
  fileDrop.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDrop.style.borderColor = '#60a5fa';
    fileDrop.style.background = 'rgba(59,130,246,0.2)';
  });
  
  fileDrop.addEventListener('dragleave', () => {
    fileDrop.style.borderColor = '#3b82f6';
    fileDrop.style.background = 'transparent';
  });
  
  fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.style.borderColor = '#3b82f6';
    fileDrop.style.background = 'transparent';
    if (e.dataTransfer.files[0]) {
      selectDebugFile(e.dataTransfer.files[0]);
    }
  });

  // Populate Endpoint Dropdown
  populateDebugEndpoints();
  
  // Update Server Base URL - IMMER aus aktueller Config und Umgebungs-Auswahl!
  function updateDebugBaseUrl() {
    const env = document.getElementById('debugUrlEnvironment')?.value || 'production';
    const baseUrl = env === 'test' ? CONFIG.api.n8nBaseUrlTest : CONFIG.api.n8nBaseUrl;
    document.getElementById('debugServerBase').value = baseUrl;
  }
  updateDebugBaseUrl();
  
  // Endpoint Change Handler - Aktualisiere JSON-Template
  document.getElementById('debugEndpointSelect').addEventListener('change', () => {
    if (debugSelectedFile) {
      generateDebugUploadJson();
      logDebug(`📋 JSON-Template für Endpoint aktualisiert`, 'info');
    }
  });

  // Session ID aktualisieren + Base-URL immer aktuell halten (respektiere Umgebungs-Auswahl!)
  setInterval(() => {
    document.getElementById('debugSessionId').textContent = STATE.sessionId || '-';
    document.getElementById('debugLogCount').textContent = debugLogs.length;
    // Wichtig: Base-URL immer aus aktuellem CONFIG + Umgebungs-Auswahl nehmen!
    updateDebugBaseUrl();
  }, 500);
  
  updateDebugUI();
}

function toggleDebugModal() {
  const modal = document.getElementById('debugModal');
  debugOpen = !debugOpen;
  modal.style.display = debugOpen ? 'block' : 'none';
}

function switchDebugTab(tab) {
  document.querySelectorAll('.debug-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.debug-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
}

function updateDebugUI() {
  const logsList = document.getElementById('debugLogsList');
  if (!logsList) return;
  
  // Wähle die richtigen Logs basierend auf DEBUG_ENABLED
  const logsToDisplay = DEBUG_ENABLED && detailedLogs.length > 0 ? detailedLogs : debugLogs;
  
  if (logsToDisplay.length === 0) {
    logsList.innerHTML = '<div style="text-align:center;color:#94a3b8;">⏳ Bereit...</div>';
    return;
  }
  
  logsList.innerHTML = logsToDisplay.map((log, idx) => {
    const errorClass = log.type === 'error' ? 'error' : '';
    
    // Wenn detaillierte Logs und Details vorhanden: Mit expandbarem Details-Bereich
    if (DEBUG_ENABLED && log.details) {
      return `
        <div class="debug-log ${errorClass}" onclick="this.classList.toggle('expanded')">
          <div style="font-weight: bold; margin-bottom: 4px;">${escapeHtml(log.message)}</div>
          <div class="debug-details" style="display: none; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; margin-top: 8px; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">
            <pre style="margin: 0; white-space: pre-wrap; word-break: break-word; color: #86efac;">${escapeHtml(log.details)}</pre>
          </div>
        </div>
      `;
    }
    
    // Normale Logs ohne Details
    return `<div class="debug-log ${errorClass}">${escapeHtml(log.message)}</div>`;
  }).join('');
  
  logsList.scrollTop = logsList.scrollHeight;
  
  // Expandable Details Handler
  document.querySelectorAll('.debug-log.expanded').forEach(el => {
    const details = el.querySelector('.debug-details');
    if (details) details.style.display = 'block';
  });
}

/**
 * ===== ERWEITERTE DEBUG-FUNKTIONEN =====
 */

// State für Debug-Upload
let debugTestHistory = [];

/**
 * updateDebugUrlEnvironment()
 * Aktualisiert die Base-URL basierend auf Test/Production Auswahl
 */
function updateDebugUrlEnvironment() {
  const env = document.getElementById('debugUrlEnvironment').value;
  const isTest = env === 'test';
  
  const baseUrl = isTest ? CONFIG.api.n8nBaseUrlTest : CONFIG.api.n8nBaseUrl;
  document.getElementById('debugServerBase').value = baseUrl;
  
  logDebug(`🔄 Umgebung gewechselt zu: ${isTest ? 'TEST' : 'PRODUCTION'}`, 'info');
  logDebug(`📍 Base URL: ${baseUrl}`, 'data');
}

/**
 * populateDebugEndpoints()
 * Füllt das Endpoint-Dropdown-Menü mit Werten aus CONFIG.api.endpoints
 */
function populateDebugEndpoints() {
  const select = document.getElementById('debugEndpointSelect');
  select.innerHTML = '<option value="">-- Endpoint wählen --</option>';
  
  // Alle Endpoints aus der Config durchgehen
  Object.entries(CONFIG.api.endpoints).forEach(([key, url]) => {
    const option = document.createElement('option');
    option.value = url;
    option.textContent = `${key.toUpperCase()}: ${url}`;
    select.appendChild(option);
  });
  
  const count = Object.keys(CONFIG.api.endpoints).length;
  logDebug(`📋 ${count} Endpoints geladen: ${Object.keys(CONFIG.api.endpoints).join(', ')}`, 'info');
}

/**
 * selectDebugFile(file: File)
 * Speichert die ausgewählte Datei und zeigt ihren Namen
 */
function selectDebugFile(file) {
  debugSelectedFile = file;
  document.getElementById('debugFileName').textContent = `✓ ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  logDebug(`📄 Datei ausgewählt: ${file.name}`, 'upload');
  
  // Generiere Default JSON für Upload
  generateDebugUploadJson();
}

/**
 * generateDebugUploadJson()
 * Generiert ein JSON-Gerüst für den Upload basierend auf dem Endpoint
 * Jeder Endpoint bekommt die richtigen Felder vorgefüllt
 * Ändert auch den Button-Text und Datei-Anforderung
 */
function generateDebugUploadJson() {
  const endpoint = document.getElementById('debugEndpointSelect').value;
  const fileName = debugSelectedFile?.name || 'test-file.mkv';
  let jsonTemplate = {};
  let requiresFile = true;
  let buttonLabel = 'Execute';
  
  // Hole Config aus app.json wenn verfügbar
  const endpointConfig = CONFIG.api.endpointConfig?.[endpoint] || {};
  if (endpointConfig.requiresFile !== undefined) {
    requiresFile = endpointConfig.requiresFile;
    buttonLabel = endpointConfig.buttonLabel || 'Execute';
  }
  
  // Fallback-Logik wenn Config nicht geladen ist
  if (endpoint.includes('check-exists')) {
    requiresFile = true;
    buttonLabel = 'Prüfen';
    jsonTemplate = {
      filename: fileName,
      sessionId: STATE.sessionId || 'debug-session-' + Date.now()
    };
  } else if (endpoint.includes('upload')) {
    requiresFile = true;
    buttonLabel = 'Upload';
    jsonTemplate = {
      filename: fileName,
      sessionId: STATE.sessionId || 'debug-session-' + Date.now(),
      timestamp: new Date().toISOString(),
      overwrite: false
    };
  } else if (endpoint.includes('list')) {
    requiresFile = false;
    buttonLabel = 'Liste abrufen';
    jsonTemplate = {
      sessionId: STATE.sessionId || 'debug-session-' + Date.now()
    };
  } else if (endpoint.includes('analyse')) {
    requiresFile = false;
    buttonLabel = 'Analysieren';
    jsonTemplate = {
      files: [fileName],
      sessionId: STATE.sessionId || 'debug-session-' + Date.now(),
      tempPath: '/media/temp',
      mode: 'ftp'
    };
  } else if (endpoint.includes('finalize')) {
    requiresFile = false;
    buttonLabel = 'Fertigstellen';
    jsonTemplate = {
      edits: {
        [fileName]: {
          name: 'TestName',
          season: 1,
          episode: 1,
          fsk: '16',
          audience: 'adults'
        }
      },
      sessionId: STATE.sessionId || 'debug-session-' + Date.now()
    };
  } else {
    buttonLabel = 'Execute';
    jsonTemplate = {
      sessionId: STATE.sessionId || 'debug-session-' + Date.now(),
      test: true,
      timestamp: new Date().toISOString()
    };
  }
  
  // Aktualisiere Button-Text und visuellen Status
  const testBtn = document.getElementById('debugTestBtn');
  if (testBtn) {
    testBtn.textContent = buttonLabel;
    testBtn.style.opacity = requiresFile && !debugSelectedFile ? '0.6' : '1';
  }
  
  // Zeige visuellen Hinweis ob Datei erforderlich ist
  const fileStatus = document.querySelector('[data-file-requirement]');
  if (fileStatus) {
    if (requiresFile) {
      fileStatus.textContent = `📄 Datei erforderlich: ${debugSelectedFile ? '✅ ' + debugSelectedFile.name : '❌ Bitte Datei auswählen'}`;
      fileStatus.style.color = debugSelectedFile ? '#10b981' : '#ef4444';
    } else {
      fileStatus.textContent = '📄 Datei nicht erforderlich (optional)';
      fileStatus.style.color = '#f59e0b';
    }
  }
  
  document.getElementById('debugRequestJson').value = JSON.stringify(jsonTemplate, null, 2);
  
  // Speichere Config für performDebugUpload()
  window.debugEndpointConfig = { requiresFile, buttonLabel };
}

/**
 * formatDebugJson()
 * Formatiert das JSON in der Textarea
 */
function formatDebugJson() {
  const textarea = document.getElementById('debugRequestJson');
  try {
    const json = JSON.parse(textarea.value);
    textarea.value = JSON.stringify(json, null, 2);
    logDebug('✓ JSON formatiert', 'success');
  } catch (error) {
    logDebug(`❌ JSON Parse-Fehler: ${error.message}`, 'error');
  }
}

/**
 * performDebugUpload()
 * Führt einen echten Request aus mit allen Debug-Informationen
 * Speichert auch die Test-History für später
 * 
 * Unterscheidung:
 *   - Wenn Endpoint Datei braucht: FormData mit Datei + JSON
 *   - Wenn Endpoint KEINE Datei braucht: Nur JSON (keine Datei mitgesendet!)
 */
async function performDebugUpload() {
  const status = document.getElementById('debugStatus');
  const startTime = Date.now();
  
  // Hole Endpoint-Config
  const endpoint = document.getElementById('debugEndpointSelect').value;
  const requiresFile = window.debugEndpointConfig?.requiresFile ?? true;
  const buttonLabel = window.debugEndpointConfig?.buttonLabel ?? 'Execute';
  
  logDebug(`🔍 Endpoint-Config: requiresFile=${requiresFile}, buttonLabel=${buttonLabel}`, 'debug');
  
  // Validierung: Datei nur erforderlich wenn Endpoint es braucht
  if (requiresFile && !debugSelectedFile) {
    status.textContent = `❌ Fehler: ${buttonLabel} benötigt eine Datei!`;
    logDebug(`Debug-Request: Keine Datei gewählt aber ${endpoint} braucht eine`, 'error');
    return;
  }
  
  // URL zusammenstellen
  let requestUrl = '';
  const urlMode = document.querySelector('input[name="urlMode"]:checked').value;
  let env = 'production';
  
  if (urlMode === 'server') {
    if (!endpoint) {
      status.textContent = '❌ Fehler: Kein Endpoint ausgewählt!';
      return;
    }
    env = document.getElementById('debugUrlEnvironment').value;
    const baseUrl = env === 'test' ? CONFIG.api.n8nBaseUrlTest : CONFIG.api.n8nBaseUrl;
    requestUrl = baseUrl + endpoint;
  } else {
    requestUrl = document.getElementById('debugCustomUrl').value;
    if (!requestUrl.trim()) {
      status.textContent = '❌ Fehler: Keine URL eingegeben!';
      return;
    }
  }
  
  // JSON-Daten parsen
  let jsonData = {};
  try {
    jsonData = JSON.parse(document.getElementById('debugRequestJson').value);
  } catch (error) {
    status.textContent = `❌ JSON Parse-Fehler: ${error.message}`;
    logDebug(`Debug-Upload JSON Error: ${error.message}`, 'error');
    return;
  }
  
  const testId = `test-${Date.now()}`;
  
  logDebug(`🚀 Debug-Request wird gestartet...`, 'upload');
  logDebug(`📍 URL: ${requestUrl}`, 'info');
  logDebug(`🔧 Umgebung: ${env.toUpperCase()}`, 'info');
  logDebug(`📄 Datei erforderlich: ${requiresFile ? 'JA' : 'NEIN'}`, 'info');
  if (debugSelectedFile && requiresFile) {
    logDebug(`📄 Datei: ${debugSelectedFile.name} (${debugSelectedFile.size} bytes)`, 'upload');
  } else if (debugSelectedFile && !requiresFile) {
    logDebug(`📄 Datei: ${debugSelectedFile.name} (wird NICHT mitgesendet)`, 'warning');
  } else {
    logDebug(`📄 Keine Datei ausgewählt`, 'info');
  }
  logDebug(`📋 Request-Data: ${JSON.stringify(jsonData, null, 2)}`, 'data');
  
  status.textContent = `⏳ ${buttonLabel}...\n\n`;
  
  try {
    // Entscheide ob FormData oder JSON gesendet wird
    let requestBody = null;
    let headers = {};
    let sendAsFormData = requiresFile && debugSelectedFile;
    
    logDebug(`🔍 Debug - Sende als ${sendAsFormData ? 'FormData' : 'JSON'}`, 'debug');
    logDebug(`🔍 Debug - requiresFile=${requiresFile}, debugSelectedFile=${debugSelectedFile ? 'YES' : 'NO'}`, 'debug');
    
    if (sendAsFormData) {
      // ===== FORMDATA: Wenn Datei erforderlich und vorhanden =====
      const formData = new FormData();
      
      // Datei hinzufügen
      formData.append('file', debugSelectedFile);
      logDebug(`✅ Datei zur FormData hinzugefügt: ${debugSelectedFile.name}`, 'data');
      
      // Alle JSON-Daten als Felder
      Object.entries(jsonData).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      
      requestBody = formData;
      // WICHTIG: Content-Type wird automatisch gesetzt, nicht manuell setzen!
      
    } else {
      // ===== JSON: Wenn Datei nicht erforderlich oder nicht vorhanden =====
      requestBody = JSON.stringify(jsonData);
      headers = { 'Content-Type': 'application/json' };
      logDebug(`✅ Request als JSON ohne Datei`, 'info');
      if (debugSelectedFile) {
        logDebug(`⚠️ Ausgewählte Datei wird NICHT mitgesendet (Endpoint braucht keine Datei)`, 'warning');
      }
    }
    
    // Log FormData/JSON Content für Debugging
    logDebug(`📦 Request-Body zusammengestellt:`, 'info');
    if (sendAsFormData) {
      let fileCount = 0;
      let jsonFieldCount = 0;
      for (let [key, value] of requestBody.entries()) {
        if (value instanceof File) {
          logDebug(`  ├─ ${key}: File(${value.name}, ${value.size} bytes)`, 'data');
          fileCount++;
        } else {
          logDebug(`  ├─ ${key}: ${String(value).substring(0, 100)}`, 'data');
          jsonFieldCount++;
        }
      }
      logDebug(`  └─ Zusammenfassung: ${fileCount} Datei(en), ${jsonFieldCount} JSON-Feld(er)`, 'info');
    } else {
      logDebug(`  └─ JSON: ${JSON.stringify(jsonData, null, 2).substring(0, 500)}...`, 'data');
    }
    
    // Request starten
    logDebug(`📤 Sende Request an: ${requestUrl}`, 'upload');
    status.textContent += `📤 Sende ${sendAsFormData ? 'FormData mit Datei' : 'JSON-Request'}...\n`;
    status.textContent += `⏳ Warte auf Server-Response...\n\n`;
    
    // WICHTIG: Bei FormData KEIN credentials:include - das blockiert die Datei!
    // FormData wird standardmäßig korrekt vom Browser verarbeitet
    const fetchOptions = {
      method: 'POST',
      body: requestBody,
      headers: headers,
      mode: 'cors'
      // ⭐ KEINE credentials: 'include' - das blockiert FormData und JSON-Requests!
    };
    
    const response = await fetch(requestUrl, fetchOptions);
    
    const elapsed = Date.now() - startTime;
    logDebug(`⏱️ Response erhalten nach ${elapsed}ms - Status: HTTP ${response.status}`, 'info');
    
    // Response auslesen
    const responseText = await response.text();
    
    // WICHTIG: Überprüfe ob Response leer ist
    if (!responseText || responseText.trim() === '') {
      logDebug(`❌ KRITISCHER FEHLER: Server sendete LEERE Response!`, 'error');
      logDebug(`💡 Mögliche Ursachen:`, 'warning');
      logDebug(`   1. N8N Webhook antwortet nicht korrekt`, 'warning');
      logDebug(`   2. N8N Webhook gibt keine Response zurück`, 'warning');
      logDebug(`   3. N8N Webhook ist nicht korrekt konfiguriert`, 'warning');
      logDebug(`📋 Überprüfe N8N Webhook-Konfiguration`, 'info');
      
      status.textContent = `❌ HTTP ${response.status} - LEERE RESPONSE\n\n`;
      status.textContent += `⚠️ Der N8N Webhook sendet KEINE Daten zurück!\n\n`;
      status.textContent += `Mögliche Ursachen:\n`;
      status.textContent += `1. Webhook ist nicht korrekt konfiguriert\n`;
      status.textContent += `2. Webhook antwortet nicht mit JSON\n`;
      status.textContent += `3. Webhook gibt leeren Body zurück\n\n`;
      status.textContent += `Lösung:\n`;
      status.textContent += `• Überprüfe N8N Webhook-Konfiguration\n`;
      status.textContent += `• Stelle sicher dass Webhook Response mit JSON antwortet\n`;
      status.textContent += `• Teste Webhook mit curl (siehe Dokumentation)`;
      
      addToTestHistory({
        id: testId,
        url: requestUrl,
        env: env,
        endpoint: document.getElementById('debugEndpointSelect').value,
        method: 'POST',
        timestamp: new Date().toLocaleTimeString('de-DE'),
        status: response.status,
        duration: elapsed,
        request: jsonData,
        response: { error: 'Leere Response vom Server' },
        success: false,
        logs: debugLogs.slice()
      });
      return;
    }
    
    let responseData = {};
    let isJson = false;
    
    try {
      responseData = JSON.parse(responseText);
      isJson = true;
      logDebug(`✓ Response JSON geparst:`, 'success');
      logDebug(`${JSON.stringify(responseData, null, 2)}`, 'data');
    } catch (e) {
      logDebug(`❌ JSON Parse-Fehler: ${e.message}`, 'error');
      logDebug(`📝 Response Text (roh): ${responseText}`, 'data');
      logDebug(`⚠️ Server sendet KEIN gültiges JSON zurück!`, 'error');
      logDebug(`💡 Mögliche Ursachen:`, 'warning');
      logDebug(`   1. Content-Type Header ist nicht application/json`, 'warning');
      logDebug(`   2. Response enthält HTML statt JSON (z.B. Error-Page)`, 'warning');
      logDebug(`   3. N8N Webhook ist nicht erreichbar (Proxy/CORS-Fehler)`, 'warning');
      
      responseData = { 
        error: 'JSON Parse Error',
        rawResponse: responseText.substring(0, 500)
      };
    }
    
    // Status-Anzeige aktualisieren mit RESPONSE (nicht Request!)
    status.textContent = `✓ HTTP ${response.status}\n`;
    status.textContent += `⏱️ Zeit: ${elapsed}ms\n`;
    status.textContent += `📝 Response:\n\n`;
    status.textContent += isJson ? JSON.stringify(responseData, null, 2) : responseText;
    
    if (response.ok) {
      logDebug(`✅ Debug-Upload erfolgreich!`, 'success');
    } else {
      logDebug(`⚠️ Server antwortete mit HTTP ${response.status}`, 'warning');
    }
    
    // Speichere in Test-History
    addToTestHistory({
      id: testId,
      url: requestUrl,
      env: env,
      endpoint: document.getElementById('debugEndpointSelect').value,
      method: 'POST',
      timestamp: new Date().toLocaleTimeString('de-DE'),
      status: response.status,
      duration: elapsed,
      request: jsonData,
      response: responseData,
      success: response.ok,
      logs: debugLogs.slice() // Aktuelle Logs kopieren
    });
    
  } catch (error) {
    const errorMsg = `❌ Fehler: ${error.message}`;
    status.textContent = errorMsg;
    logDebug(`Debug-Upload Fehler: ${error.message}`, 'error');
    logDebug(`Stack: ${error.stack}`, 'error');
    logDebug(`💡 Hinweis: Überprüfe die Browser-Console (F12) für mehr Details`, 'warning');
    logDebug(`💡 Bei CORS-Fehlern: N8N Server CORS-Header setzen (Access-Control-Allow-*)`, 'warning');
  }
}

/**
 * addToTestHistory(testData)
 * Fügt einen Test zur History hinzu und zeigt ihn als expandable Item
 */
function addToTestHistory(testData) {
  debugTestHistory.unshift(testData); // Newest first
  
  const historyDiv = document.getElementById('debugTestHistory');
  if (!historyDiv) return;
  
  // Wenn erste Test: clear placeholder
  if (debugTestHistory.length === 1) {
    historyDiv.innerHTML = '';
  }
  
  const itemEl = document.createElement('div');
  itemEl.id = `test-item-${testData.id}`;
  itemEl.style.borderBottom = '1px solid #1e293b';
  itemEl.innerHTML = `
    <div id="test-item-${testData.id}" style="padding: 12px; cursor: pointer; background: #1a1f3a; hover: background #1e293b; transition: background 0.2s; user-select: none;" class="test-item-header" onclick="toggleTestItem('${testData.id}')">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div style="color: #60a5fa; font-weight: bold; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
            <span>${testData.success ? '✅' : '❌'}</span>
            <span>POST</span>
            <span style="color: #f59e0b;">${testData.endpoint}</span>
            <span style="color: ${testData.env === 'test' ? '#3b82f6' : '#10b981'}; font-size: 0.9rem;">🔹 ${testData.env.toUpperCase()}</span>
          </div>
          <div style="color: #94a3b8; font-size: 0.85rem; display: flex; gap: 15px;">
            <span>💾 HTTP ${testData.status}</span>
            <span>⏱️ ${testData.duration}ms</span>
            <span>🕐 ${testData.timestamp}</span>
          </div>
        </div>
        <div style="color: #60a5fa; font-size: 1.2rem; flex-shrink: 0; margin-left: 10px;">▶</div>
      </div>
    </div>
    <div id="test-details-${testData.id}" style="display: none; padding: 12px; background: #0f172a; border-left: 3px solid #3b82f6;">
      <div style="margin-bottom: 15px;">
        <div style="color: #60a5fa; font-weight: bold; margin-bottom: 8px;">📤 Request</div>
        <div style="background: #1a1f3a; padding: 10px; border-radius: 4px; color: #94a3b8; font-family: monospace; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">
          ${JSON.stringify(testData.request, null, 2)}
        </div>
      </div>
      <div style="margin-bottom: 15px;">
        <div style="color: #60a5fa; font-weight: bold; margin-bottom: 8px;">📥 Response</div>
        <div style="background: #1a1f3a; padding: 10px; border-radius: 4px; color: #94a3b8; font-family: monospace; font-size: 0.85rem; max-height: 200px; overflow-y: auto;">
          ${JSON.stringify(testData.response, null, 2)}
        </div>
      </div>
      <div>
        <div style="color: #60a5fa; font-weight: bold; margin-bottom: 8px;">📋 Logs zu diesem Test</div>
        <div style="background: #1a1f3a; padding: 10px; border-radius: 4px; color: #94a3b8; font-family: monospace; font-size: 0.8rem; max-height: 250px; overflow-y: auto;">
          ${testData.logs.map(l => `<div>${l.message}</div>`).join('')}
        </div>
      </div>
    </div>
  `;
  
  historyDiv.insertBefore(itemEl, historyDiv.firstChild);
}

/**
 * toggleTestItem(testId)
 * Toggle Expand/Collapse für Test-History Items
 */
function toggleTestItem(testId) {
  const details = document.getElementById(`test-details-${testId}`);
  const headerDiv = document.getElementById(`test-item-${testId}`);
  
  if (!details || !headerDiv) {
    logDebug(`⚠️ Test Item nicht gefunden: ${testId}`, 'warning');
    return;
  }
  
  if (details.style.display === 'none') {
    details.style.display = 'block';
    headerDiv.style.background = '#1e293b';
    headerDiv.querySelector('div:last-child').textContent = '▼';
  } else {
    details.style.display = 'none';
    headerDiv.style.background = '#1a1f3a';
    headerDiv.querySelector('div:last-child').textContent = '▶';
  }
}

function exportDebugLogs() {
  const text = debugLogs.map(e => e.message).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `debug-${new Date().getTime()}.txt`;
  a.click();
  logDebug('Logs exportiert', 'success');
}

function clearDebugLogs() {
  if (confirm('Alle Logs wirklich löschen?')) {
    debugLogs = [];
    detailedLogs = [];  // Auch detaillierte Logs löschen
    updateDebugUI();
    logDebug('Logs geleert', 'info');
  }
}

/* ================================
   DOM ELEMENTS
================================ */
let DOM = {};

function initDOM() {
  DOM = {
    // Upload Section
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    uploadList: document.getElementById('uploadList'),
    reloadTempBtn: document.getElementById('reloadTempBtn'),
    analyzeFilesBtn: document.getElementById('analyzeFilesBtn'),
    uploadSection: document.getElementById('uploadSection'),
    
    // Temp File List (Auswahlliste)
    tempFileListContainer: document.getElementById('tempFileListContainer'),
    tempFileList: document.getElementById('tempFileList'),
    selectAllFilesBtn: document.getElementById('selectAllFilesBtn'),
    deselectAllFilesBtn: document.getElementById('deselectAllFilesBtn'),
    
    // Analysis Section
    categorizedList: document.getElementById('categorizedList'),
    backToUploadBtn: document.getElementById('backToUploadBtn'),
    finalizeBtn: document.getElementById('finalizeBtn'),
    analysisSection: document.getElementById('analysisSection'),
    
    // Debug
    debugPanel: document.getElementById('debugPanel'),
    debugOutput: document.getElementById('debugOutput'),
    clearDebugBtn: document.getElementById('clearDebugBtn'),
    
    // Session
    sessionDisplay: document.getElementById('sessionDisplay')
  };
  
  logDebug('DOM-Elemente initialisiert', 'success');
}

/* ================================
   STATE MANAGEMENT
================================ */
let STATE = {
  sessionId: '',
  uploadedFiles: [],
  analysisResults: {},
  tempFilesList: [],
  userEdits: {},
  selectedFiles: new Set()  // Nachverfolgen welche Dateien ausgewählt sind
};

function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  STATE.sessionId = `session-${timestamp}-${random}`;
  
  if (DOM.sessionDisplay) {
    DOM.sessionDisplay.textContent = STATE.sessionId;
  }
  
  logDebug(`SessionId erstellt: ${STATE.sessionId}`, 'success');
  return STATE.sessionId;
}

/* ================================
   FILE UPLOAD SYSTEM
   Verwaltet Datei-Upload mit Drag & Drop und Existenzprüfung
================================ */
/**
 * initUploadSystem()
 * Initialisiert das Datei-Upload-System mit:
 * - Click-Event zum Datei-Dialog öffnen
 * - Change-Event für Dateiauswahl
 * - Drag & Drop Support
 * 
 * Diese Funktion wird einmalig beim App-Start aufgerufen.
 */
function initUploadSystem() {
  if (!DOM.dropZone || !DOM.fileInput) {
    logDebug('❌ Fehler: Drop Zone oder File Input nicht gefunden', 'error');
    return;
  }
  
  // ===== PRIORITÄT 1: ANDROID DETECTION (DAUERHAFT DEAKTIVIERT!) =====
  // Android: FormData Bug workaround - IMMER deaktivieren unabhängig von config
  const isAndroid = /Android|Linux.*Chrome/.test(navigator.userAgent);
  if (isAndroid) {
    logDebug('📱 Android erkannt - Upload DAUERHAFT deaktiviert (FormData Bug Workaround)', 'warning');
    DOM.dropZone.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="font-weight: 500; margin: 8px 0; color: #374151;">Upload auf diesem Gerät nicht verfügbar</p>
        <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">
          Bitte laden Sie Dateien von einem Desktop-Computer oder Laptop hoch.<br>
          <strong>Android:</strong> Sie können Dateien analysieren und verwalten.
        </p>
      </div>
    `;
    DOM.dropZone.style.cursor = 'not-allowed';
    DOM.dropZone.style.opacity = '0.6';
    DOM.dropZone.style.backgroundColor = '#fee2e2';
    DOM.dropZone.style.borderColor = '#fca5a5';
    DOM.fileInput.disabled = true;
    return;
  }
  
  // ===== PRIORITÄT 2: CHROME OS DETECTION (optional konfigurierbar) =====
  // Chrome OS: Separate Konfiguration möglich (disableChromeOS setting)
  const isChromeOS = /CrOS/.test(navigator.userAgent);
  if (isChromeOS && CONFIG.upload && CONFIG.upload.disableChromeOS) {
    logDebug('🖥️ Chrome OS erkannt - Upload deaktiviert (app.json: upload.disableChromeOS = true)', 'warning');
    DOM.dropZone.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="font-weight: 500; margin: 8px 0; color: #374151;">Upload auf Chrome OS deaktiviert</p>
        <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">
          Sie können Dateien analysieren und verwalten.<br>
          <strong>Chrome OS:</strong> Upload ist in der Konfiguration deaktiviert.
        </p>
      </div>
    `;
    DOM.dropZone.style.cursor = 'not-allowed';
    DOM.dropZone.style.opacity = '0.6';
    DOM.dropZone.style.backgroundColor = '#fee2e2';
    DOM.dropZone.style.borderColor = '#fca5a5';
    DOM.fileInput.disabled = true;
    return;
  }
  
  // ===== PRIORITÄT 3: GLOBALE UPLOAD-KONFIGURATION PRÜFEN =====
  // Wenn upload.enabled = false: Alle anderen Geräte deaktivieren (außer Android/ChromeOS oben)
  if (CONFIG.upload && !CONFIG.upload.enabled) {
    logDebug('🚫 Upload deaktiviert (app.json: upload.enabled = false)', 'warning');
    DOM.dropZone.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="font-weight: 500; margin: 8px 0; color: #374151;">Upload ist deaktiviert</p>
        <p style="font-size: 0.9rem; color: #6b7280; margin: 0;">
          Der Upload ist in der Konfiguration deaktiviert.<br>
          Sie können Dateien analysieren und verwalten.
        </p>
      </div>
    `;
    DOM.dropZone.style.cursor = 'not-allowed';
    DOM.dropZone.style.opacity = '0.6';
    DOM.dropZone.style.backgroundColor = '#fee2e2';
    DOM.dropZone.style.borderColor = '#fca5a5';
    DOM.fileInput.disabled = true;
    return;
  }
  
  // Log: Upload-Status
  logDebug('✅ Upload AKTIVIERT', 'success');
  if (isChromeOS) {
    logDebug('   └─ Chrome OS erkannt: NICHT deaktiviert (disableChromeOS = false)', 'info');
  }
  
  // Klick auf Drop-Zone öffnet Standard-Datei-Dialog
  DOM.dropZone.addEventListener('click', () => DOM.fileInput.click());
  
  // Änderung des File-Input triggert die Upload-Verarbeitung
  DOM.fileInput.addEventListener('change', (e) => {
    handleFileSelection(e.target.files);
  });
  
  // Drag-Over: visuelles Feedback beim Überziehen von Dateien
  DOM.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.add('drag-over');
  });
  
  // Drag-Leave: Feedback entfernen
  DOM.dropZone.addEventListener('dragleave', () => {
    DOM.dropZone.classList.remove('drag-over');
  });
  
  // Drop: Dateien vom Benutzer zur Verarbeitung übergeben
  DOM.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.dropZone.classList.remove('drag-over');
    handleFileSelection(e.dataTransfer.files);
  });
  
  logDebug('Upload-System initialisiert', 'success');
}

/**
 * handleFileSelection(files: FileList)
 * Verarbeitet vom Benutzer ausgewählte Dateien
 * 
 * Parameter:
 *   files - FileList mit allen ausgewählten Dateien
 * 
 * Ablauf:
 *   1. Logging: Anzahl der Dateien
 *   2. Für jede Datei: uploadFile() aufrufen
 */
function handleFileSelection(files) {
  logDebug(`${files.length} Datei(en) ausgewählt`, 'info');
  
  Array.from(files).forEach((file) => {
    uploadFile(file);
  });
}

/**
 * uploadFile(file: File)
 * Haupt-Upload-Funktion mit Existenzprüfung
 * 
 * Parameter:
 *   file - Die zu uploadende Datei (File-Objekt)
 * 
 * Ablauf:
 *   1. Upload-UI-Item erstellen und hinzufügen
 *   2. Server fragen: Existiert die Datei bereits?
 *   3a. Falls JA: Benutzer kann Überschreiben/Umbenennen wählen
 *   3b. Falls NEIN: Direkt hochladen (performUpload)
 * 
 * Error-Handling:
 *   - HTTP-Fehler werden geloggt und mit Error-Status angezeigt
 *   - Upload kann vom Benutzer abgebrochen werden
 */
async function uploadFile(file) {
  const uploadId = `upload-${Date.now()}-${Math.random()}`;
  const uploadItem = createUploadItem(uploadId, file);
  
  DOM.uploadList.appendChild(uploadItem);
  STATE.uploadedFiles.push({ id: uploadId, file, status: 'checking', xhr: null });
  
  logDebug(`📤 Neuer Upload initialisiert:`, 'upload');
  logDebug(`  └─ ID: ${uploadId}`, 'data');
  logDebug(`  └─ Datei: ${file.name}`, 'data');
  logDebug(`  └─ Größe: ${(file.size / 1024 / 1024).toFixed(2)} MB`, 'data');
  logDebug(`  └─ Type: ${file.type}`, 'data');
  
  try {
    // SCHRITT 1: Dateiexistenz prüfen
    logDebug(`📋 Dateiexistenz prüfen: ${file.name}`, 'upload');
    
    const checkUrl = `${CONFIG.api.n8nBaseUrl}${CONFIG.api.endpoints.checkExists}`;
    const checkBody = {
      filename: file.name,
      sessionId: STATE.sessionId
    };
    
    logDebug(`🔗 POST an: ${checkUrl}`, 'info');
    logDebug(`📤 Body: ${JSON.stringify(checkBody)}`, 'data');
    
    const checkResponse = await fetch(checkUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkBody),
      mode: 'cors'
      // ⭐ KEINE credentials: 'include' hier! N8N will das nicht bei JSON-Requests
    });
    
    logDebug(`📨 Status: HTTP ${checkResponse.status}`, 'info');
    
    if (!checkResponse.ok) {
      throw new Error(`Existenzprüfung fehlgeschlagen: HTTP ${checkResponse.status}`);
    }
    
    const checkData = await checkResponse.json();
    const fileExists = checkData.exists === true;
    
    logDebug(`✓ Prüfung abgeschlossen: ${file.name} ${fileExists ? '✓ existiert bereits' : '✗ neu'}`, 'info');
    logDebug(`📊 Antwort: ${JSON.stringify(checkData)}`, 'data');
    
    // SCHRITT 2a: Falls Datei existiert → Benutzer wählt Option
    if (fileExists) {
      updateUploadStatus(uploadId, 'conflict', '⚠️ Existiert bereits');
      addUploadConflictOptions(uploadId, file);
      return;
    }
    
    // SCHRITT 2b: Falls Datei neu ist → Direkt hochladen
    await performUpload(uploadId, file);
    
  } catch (error) {
    updateUploadStatus(uploadId, 'error', '✗ Fehler');
    STATE.uploadedFiles.find(u => u.id === uploadId).status = 'error';
    logDebug(`❌ Fehler bei ${file.name}: ${error}`, 'error');
    logDebug(`📍 Stack: ${error.stack}`, 'error');
  }
}

/**
 * performUpload(uploadId: string, file: File, overwrite: boolean, newName: string|null)
 * Führt den eigentlichen Upload mit Progress-Tracking durch
 * 
 * Parameter:
 *   uploadId - Eindeutige ID des Upload-Items
 *   file - Das zu uploadende File-Objekt
 *   overwrite - True wenn existierende Datei ersetzt werden soll
 *   newName - Neuer Dateiname (falls null wird file.name verwendet)
 * 
 * Datenfluss:
 *   1. FormData zusammenstellen mit: file, sessionId, filename, timestamp, overwrite
 *   2. XMLHttpRequest öffnen für Upload
 *   3. Progress-Events verfolgen und UI aktualisieren
 *   4. Response verarbeiten:
 *      - Success: Status auf ✓ setzen, finalName speichern
 *      - Error: HTTP/Parse-Fehler anzeigen
 *   5. UI-Buttons aktualisieren
 * 
 * Wichtig: Der Dateiname wird IMMER mitgesendet (newName || file.name)!
 */
async function performUpload(uploadId, file, overwrite = false, newName = null) {
  const uploadEntry = STATE.uploadedFiles.find(u => u.id === uploadId);
  if (!uploadEntry) return;
  
  try {
    updateUploadStatus(uploadId, 'uploading', '0%');
    
    // FormData mit allen notwendigen Daten zusammenstellen
    const formData = new FormData();
    formData.append('file', file);                                      // Die Binärdatei
    formData.append('sessionId', STATE.sessionId);                      // Session-ID
    formData.append('filename', newName || file.name);                  // ⭐ WICHTIG: Dateiname IMMER mitschicken!
    formData.append('timestamp', new Date().toISOString());            // Zeitstempel
    formData.append('overwrite', overwrite ? 'true' : 'false');        // Überschreib-Flag
    
    const uploadUrl = `${CONFIG.api.n8nBaseUrl}${CONFIG.api.endpoints.upload}`;
    logDebug(`📤 Upload wird gestartet: ${newName || file.name}`, 'upload');
    logDebug(`  └─ Upload-ID: ${uploadId}`, 'data');
    logDebug(`  └─ URL: ${uploadUrl}`, 'info');
    logDebug(`  └─ Datei: ${file.name} → ${newName || file.name}`, 'data');
    logDebug(`  └─ Größe: ${(file.size / 1024 / 1024).toFixed(2)} MB`, 'data');
    logDebug(`  └─ Überschreiben: ${overwrite}`, 'data');
    
    // Log FormData Content
    logDebug(`📦 FormData Felder:`, 'data');
    logDebug(`  └─ file: File(${file.name}, ${file.size} bytes)`, 'data');
    logDebug(`  └─ sessionId: ${STATE.sessionId}`, 'data');
    logDebug(`  └─ filename: ${newName || file.name}`, 'data');
    logDebug(`  └─ timestamp: ${new Date().toISOString()}`, 'data');
    logDebug(`  └─ overwrite: ${overwrite}`, 'data');
    
    // WICHTIG: Überprüfe ob FormData Objekt korrekt ist
    logDebug(`🔍 FormData size check:`, 'debug');
    let entryCount = 0;
    for (let pair of formData.entries()) {
      entryCount++;
      logDebug(`   └─ ${pair[0]}: ${pair[1] instanceof File ? 'File(' + pair[1].name + ')' : String(pair[1]).substring(0, 50)}`, 'debug');
    }
    logDebug(`📊 Total FormData Einträge: ${entryCount}`, 'debug');
    
    if (entryCount === 0) {
      logDebug(`⚠️ WARNUNG: FormData ist leer! Das ist ein kritischer Fehler!`, 'error');
      logDebug(`💡 Debugging-Tipps:`, 'warning');
      logDebug(`   1. Überprüfe Browser-Console (F12) für Fehler`, 'warning');
      logDebug(`   2. Auf Chromebook: Überprüfe Berechtigungen für File-Zugriff`, 'warning');
      logDebug(`   3. FormData.append() wird möglicherweise blockiert`, 'warning');
    }
    
    // XMLHttpRequest für Upload mit Progress
    const xhr = new XMLHttpRequest();
    uploadEntry.xhr = xhr;
    
    // Progress-Events: Zeige Upload-Fortschritt in Prozent + Geschwindigkeit
    const progressStartTime = Date.now();
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        const elapsedSeconds = (Date.now() - progressStartTime) / 1000;
        const speedMBps = elapsedSeconds > 0 ? (event.loaded / 1024 / 1024 / elapsedSeconds).toFixed(2) : '0.00';
        const loadedMB = (event.loaded / 1024 / 1024).toFixed(2);
        const totalMB = (event.total / 1024 / 1024).toFixed(2);
        
        updateUploadProgress(uploadId, percent, `${percent}% | ${speedMBps} MB/s`);
        
        if (percent % 25 === 0) {
          logDebug(`⏳ Upload ${percent}% (${loadedMB}/${totalMB} MB) | Geschwindigkeit: ${speedMBps} MB/s`, 'upload');
        }
        
        // Wenn 100% erreicht
        if (percent === 100) {
          logDebug(`✅ Upload zu 100% abgeschlossen - N8N verarbeitet jetzt die Daten...`, 'info');
          updateUploadProgress(uploadId, 100, '100% | Verarbeitung läuft...');
        }
      }
    });
    
    // Load-Event: Upload erfolgreich, Response verarbeiten
    xhr.addEventListener('load', () => {
      logDebug(`📨 Response erhalten - Status: HTTP ${xhr.status}`, 'info');
      
      // Überprüfe ob Response leer ist
      if (!xhr.responseText || xhr.responseText.trim() === '') {
        logDebug(`❌ KRITISCHER FEHLER: Server sendete LEERE Response!`, 'error');
        logDebug(`💡 Mögliche Ursachen:`, 'warning');
        logDebug(`   1. N8N Webhook antwortet nicht korrekt`, 'warning');
        logDebug(`   2. N8N Webhook gibt keine Response zurück`, 'warning');
        logDebug(`   3. Webhook ist nicht korrekt konfiguriert`, 'warning');
        updateUploadStatus(uploadId, 'error', '✗ Leere Response');
        uploadEntry.status = 'error';
        return;
      }
      
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          logDebug(`✅ Response geparst:`, 'success');
          logDebug(`${JSON.stringify(response, null, 2)}`, 'data');
          
          if (response.success) {
            updateUploadStatus(uploadId, 'success', '✓ 100%');
            uploadEntry.status = 'success';
            uploadEntry.finalName = newName || file.name;
            logDebug(`✅ ${newName || file.name} erfolgreich hochgeladen (${response.size} bytes)`, 'success');
            
            // Analyze-Button aktivieren wenn mindestens eine Datei erfolgreich
            if (STATE.uploadedFiles.some(u => u.status === 'success')) {
              DOM.analyzeFilesBtn.disabled = false;
              logDebug(`📊 Analyze-Button aktiviert`, 'info');
            }
          } else {
            throw new Error(response.error || 'Upload fehlgeschlagen');
          }
        } catch (error) {
          updateUploadStatus(uploadId, 'error', '✗ JSON Parse Error');
          logDebug(`❌ Response Parse-Fehler: ${error}`, 'error');
          logDebug(`📝 Raw Response: ${xhr.responseText.substring(0, 500)}`, 'error');
          logDebug(`⚠️ Server sendet KEIN gültiges JSON!`, 'error');
          logDebug(`💡 Mögliche Ursachen:`, 'warning');
          logDebug(`   1. N8N Webhook Content-Type ist nicht application/json`, 'warning');
          logDebug(`   2. N8N Webhook sendet HTML statt JSON (Error-Page)`, 'warning');
          logDebug(`   3. N8N Webhook ist nicht korrekt konfiguriert`, 'warning');
        }
      } else {
        updateUploadStatus(uploadId, 'error', `✗ HTTP ${xhr.status}`);
        logDebug(`❌ HTTP Error ${xhr.status}`, 'error');
        logDebug(`📝 Response: ${xhr.responseText.substring(0, 500)}`, 'error');
        logDebug(`⚠️ Server antwortet mit Fehler-Status!`, 'error');
      }
    });
    
    // Error-Event: Netzwerkfehler oder CORS-Problem
    xhr.addEventListener('error', () => {
      updateUploadStatus(uploadId, 'error', '✗ Netzwerkfehler');
      logDebug(`❌ Netzwerkfehler beim Upload`, 'error');
      logDebug(`💡 Mögliche Ursachen:`, 'warning');
      logDebug(`   1. N8N Server ist offline oder nicht erreichbar`, 'warning');
      logDebug(`   2. CORS-Fehler: N8N Server sendet keine Access-Control-Allow-* Header`, 'warning');
      logDebug(`   3. Netzwerk-Proxy blockiert die Anfrage`, 'warning');
      logDebug(`🔍 Überprüfe Browser-Console (F12) für CORS-Fehler`, 'warning');
    });
    
    // Abort-Event: Benutzer hat Upload abgebrochen
    xhr.addEventListener('abort', () => {
      updateUploadStatus(uploadId, 'cancelled', '✗ Abgebrochen');
      uploadEntry.status = 'cancelled';
      logDebug(`⚠️ Upload von ${file.name} abgebrochen`, 'warning');
    });
    
    // Request starten
    xhr.open('POST', uploadUrl);
    
    // Timeout nach 5 Minuten (falls Server nicht antwortet)
    xhr.timeout = 300000; // 5 * 60 * 1000
    xhr.addEventListener('timeout', () => {
      updateUploadStatus(uploadId, 'error', '✗ Timeout (5min)');
      logDebug(`❌ Upload-Timeout nach 5 Minuten`, 'error');
      logDebug(`💡 N8N Server antwortet nicht rechtzeitig`, 'warning');
    });
    
    xhr.send(formData);
    
  } catch (error) {
    updateUploadStatus(uploadId, 'error', '✗ Fehler');
    uploadEntry.status = 'error';
    logDebug(`❌ Fehler beim Upload: ${error}`, 'error');
    logDebug(`📍 Stack: ${error.stack}`, 'error');
  }
}

function addUploadConflictOptions(uploadId, file) {
  const item = document.getElementById(uploadId);
  if (!item) return;
  
  const statusEl = item.querySelector('.upload-item-status');
  
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'upload-conflict-options';
  optionsDiv.innerHTML = `
    <div class="conflict-message">
      <p>📌 Datei existiert bereits. Was möchten Sie tun?</p>
      <small>Überschreiben: Aktuelle Datei ersetzen | Umbenennen: Datei mit neuem Namen speichern</small>
    </div>
    <div class="conflict-buttons">
      <button class="btn-overwrite" data-upload-id="${uploadId}">Überschreiben</button>
      <button class="btn-rename" data-upload-id="${uploadId}">Umbenennen</button>
      <button class="btn-cancel-upload" data-upload-id="${uploadId}">Abbrechen</button>
    </div>
    <div class="rename-input-group" style="display:none;">
      <input type="text" class="rename-input" placeholder="Neuer Dateiname..." value="${file.name}">
      <button class="btn-confirm-rename" data-upload-id="${uploadId}">✓ Bestätigen</button>
    </div>
  `;
  
  item.appendChild(optionsDiv);
  
  // Event Listeners
  optionsDiv.querySelector('.btn-overwrite').addEventListener('click', () => {
    optionsDiv.remove();
    performUpload(uploadId, file, true);
  });
  
  optionsDiv.querySelector('.btn-rename').addEventListener('click', () => {
    optionsDiv.querySelector('.rename-input-group').style.display = 'flex';
    optionsDiv.querySelector('.conflict-buttons').style.display = 'none';
  });
  
  optionsDiv.querySelector('.btn-confirm-rename').addEventListener('click', () => {
    const newName = optionsDiv.querySelector('.rename-input').value;
    if (newName.trim()) {
      optionsDiv.remove();
      performUpload(uploadId, file, false, newName);
    }
  });
  
  optionsDiv.querySelector('.btn-cancel-upload').addEventListener('click', () => {
    optionsDiv.remove();
    updateUploadStatus(uploadId, 'cancelled', '✗ Abgebrochen');
    STATE.uploadedFiles.find(u => u.id === uploadId).status = 'cancelled';
  });
}

function createUploadItem(id, file) {
  const item = document.createElement('div');
  item.id = id;
  item.className = 'upload-item uploading';
  item.innerHTML = `
    <div class="upload-item-header">
      <div class="upload-item-name">${escapeHtml(file.name)}</div>
      <button class="btn-delete-upload" data-upload-id="${id}" title="Datei aus Upload entfernen">✕</button>
    </div>
    <div class="upload-item-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
    </div>
    <div class="upload-item-status">0%</div>
  `;
  
  // Delete Button Listener
  const deleteBtn = item.querySelector('.btn-delete-upload');
  deleteBtn.addEventListener('click', () => {
    const uploadEntry = STATE.uploadedFiles.find(u => u.id === id);
    if (uploadEntry && uploadEntry.xhr) {
      uploadEntry.xhr.abort();
    }
    item.remove();
    STATE.uploadedFiles = STATE.uploadedFiles.filter(u => u.id !== id);
    logDebug(`Upload von ${file.name} abgebrochen`, 'warning');
  });
  
  return item;
}

function updateUploadProgress(uploadId, progress, customText = null) {
  const item = document.getElementById(uploadId);
  if (!item) return;
  
  const fill = item.querySelector('.progress-fill');
  const status = item.querySelector('.upload-item-status');
  
  const percent = Math.min(progress, 100);
  fill.style.width = `${percent}%`;
  
  // Verwende customText wenn vorhanden (z.B. mit Geschwindigkeit), sonst nur Prozent
  if (customText) {
    status.textContent = customText;
  } else {
    status.textContent = `${percent}%`;
  }
}

function updateUploadStatus(uploadId, status, text) {
  const item = document.getElementById(uploadId);
  if (!item) return;
  
  item.classList.remove('uploading', 'error');
  if (status === 'error') {
    item.classList.add('error');
  } else if (status === 'success') {
    item.classList.add('success');
  }
  
  const statusEl = item.querySelector('.upload-item-status');
  statusEl.textContent = text;
  statusEl.className = `upload-item-status ${status}`;
}
/* ================================
   RELOAD & ANALYZE SYSTEM
   Lädt Dateien aus dem Temp-Ordner und analysiert diese
================================ */

/**
 * reloadTempFolder()
 * Lädt die Liste der Dateien aus dem Temp-Ordner vom N8N Server
 * 
 * Ablauf:
 *   1. POST-Request an /list Endpoint mit sessionId
 *   2. N8N verbindet via FTP/SFTP zu /media/temp
 *   3. N8N antwortet mit Array von Dateinamen
 *   4. Ergebnis in STATE.tempFilesList speichern
 *   5. Logging mit Anzahl gefundener Dateien
 * 
 * Request-Body:
 *   { sessionId: "session-..." }
 * 
 * Response-Struktur:
 *   { files: ["Episode 1.mp4", "Episode 2.mp4", ...] }
 * 
 * Error-Handling:
 *   - HTTP-Fehler werden geloggt
 *   - Bei Fehler bleibt tempFilesList leer
 */
async function reloadTempFolder() {
  logDebug('📂 Temp-Ordner wird neu geladen...', 'info');
  logDebug('🔗 Verbinde mit /list Endpoint...', 'info');
  
  try {
    const listUrl = `${CONFIG.api.n8nBaseUrl}${CONFIG.api.endpoints.list}`;
    
    const requestBody = {
      sessionId: STATE.sessionId
    };
    
    logDebug(`📤 POST an: ${listUrl}`, 'info');
    logDebug(`📝 Request-Body: ${JSON.stringify(requestBody)}`, 'data');
    
    const response = await fetch(listUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    logDebug(`📨 Response Status: HTTP ${response.status}`, 'info');
    
    if (!response.ok) {
      const errorText = await response.text();
      logDebug(`❌ Server-Fehler: ${errorText}`, 'error');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    const rawFiles = data.files || [];
    
    // Parse neue Format: "Name|||Datum|||Größe"
    STATE.tempFilesList = [];
    window.tempFilesMetadata = {};
    
    rawFiles.forEach((fileEntry) => {
      const parts = fileEntry.split('|||');
      const filename = parts[0]?.trim() || '';
      const dateStr = parts[1]?.trim() || new Date().toISOString();
      const sizeBytes = parseInt(parts[2]?.trim() || '0');
      
      if (filename) {
        STATE.tempFilesList.push(filename);
        window.tempFilesMetadata[filename] = {
          date: dateStr,
          size: sizeBytes
        };
      }
    });
    
    logDebug(`✅ ${STATE.tempFilesList.length} Datei(en) im Temp-Ordner gefunden:`, 'success');
    STATE.tempFilesList.forEach((file, index) => {
      const meta = window.tempFilesMetadata[file];
      logDebug(`   ${index + 1}. ${file} (${formatFileSize(meta.size)})`, 'data');
    });
    
    // ===== NEUE FUNKTION: CHECKBOXEN RENDERN =====
    renderTempFilesList();
    
    // Activate analyze button wenn Dateien vorhanden
    if (STATE.tempFilesList.length > 0 && DOM.analyzeFilesBtn) {
      DOM.analyzeFilesBtn.disabled = false;
      logDebug(`✅ Analyze-Button aktiviert`, 'success');
    }
    
  } catch (error) {
    logDebug(`❌ Fehler beim Reload: ${error.message}`, 'error');
    logDebug(`💡 Überprüfe:`, 'warning');
    logDebug(`   1. N8N /list Endpoint ist konfiguriert`, 'warning');
    logDebug(`   2. N8N hat FTP/SFTP Zugang zu /media/temp`, 'warning');
    logDebug(`   3. Temp-Ordner existiert und ist nicht leer`, 'warning');
    STATE.tempFilesList = [];
    DOM.tempFileListContainer.style.display = 'none';
  }
}

/**
 * renderTempFilesList()
 * Rendert die Dateien aus STATE.tempFilesList als Checkboxen
 * Speichert Auswahl in window.selectedTempFiles
 */
function renderTempFilesList() {
  // Prüfe ob Array leer ODER erstes Element ist leerer String
  if (!STATE.tempFilesList || STATE.tempFilesList.length === 0 || 
      (STATE.tempFilesList.length === 1 && !STATE.tempFilesList[0]?.trim())) {
    // Zeige Empty State Message
    DOM.tempFileListContainer.style.display = 'block';
    DOM.tempFileList.innerHTML = `
      <div style="
        padding: 60px 30px;
        text-align: center;
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        border: 3px dashed #9ca3af;
        border-radius: 12px;
        color: #6b7280;
        min-height: 250px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <div style="font-size: 4rem; margin-bottom: 20px;">📭</div>
        <p style="font-size: 1.2rem; font-weight: 600; margin: 0 0 10px 0;">Keine Dateien zum Verwalten</p>
        <p style="font-size: 0.95rem; margin: 0; color: #9ca3af; max-width: 400px;">
          Der Upload-Ordner ist leer. Lade Dateien hoch, um zu beginnen.
        </p>
      </div>
    `;
    logDebug(`⚠️ Keine gültigen Dateien im Array (leer oder leerer String)`, 'warning');
    return;
  }
  
  // Initialisiere selected Files
  if (!window.selectedTempFiles) {
    window.selectedTempFiles = new Set();
  }
  
  // Initialisiere Metadaten und Sortier-State
  if (!window.tempFilesMetadata) {
    window.tempFilesMetadata = {};
  }
  if (!window.tempFilesSortState) {
    window.tempFilesSortState = { column: 'name', ascending: true };
  }
  
  // Erstelle Dateieinträge mit Metadaten
  let fileEntries = STATE.tempFilesList.map(filename => {
    const meta = window.tempFilesMetadata[filename] || {};
    return {
      name: filename,
      size: meta.size || 0,
      date: meta.date || new Date().toISOString(),
      filename: filename
    };
  });
  
  // Sortiere basierend auf aktuellem State
  const sortColumn = window.tempFilesSortState.column;
  const ascending = window.tempFilesSortState.ascending;
  
  fileEntries.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];
    
    if (sortColumn === 'name') {
      return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else if (sortColumn === 'size') {
      return ascending ? aVal - bVal : bVal - aVal;
    } else if (sortColumn === 'date') {
      return ascending ? new Date(aVal) - new Date(bVal) : new Date(bVal) - new Date(aVal);
    }
    return 0;
  });
  
  // Sortier-Icons für die Header
  const headerIcon = (col) => {
    if (sortColumn !== col) return '';
    return ascending ? ' ▲' : ' ▼';
  };
  
  // Rendere Tabelle
  const htmlContent = `
    <table class="temp-files-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">
            <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAllTempFiles(this)" style="cursor: pointer; width: 18px; height: 18px;">
          </th>
          <th class="sortable-header" onclick="sortTempFiles('name')" style="cursor: pointer; user-select: none;">
            📄 Name ${headerIcon('name')}
          </th>
          <th class="sortable-header" onclick="sortTempFiles('size')" style="cursor: pointer; user-select: none; text-align: right; width: 120px;">
            💾 Größe ${headerIcon('size')}
          </th>
          <th class="sortable-header" onclick="sortTempFiles('date')" style="cursor: pointer; user-select: none; text-align: right; width: 180px;">
            📅 Datum ${headerIcon('date')}
          </th>
        </tr>
      </thead>
      <tbody>
        ${fileEntries.map((file) => {
          const isSelected = window.selectedTempFiles.has(file.filename);
          const dateObj = new Date(file.date);
          const dateStr = dateObj.toLocaleDateString('de-DE') + ' ' + dateObj.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
          const sizeStr = formatFileSize(file.size);
          
          return `
            <tr class="temp-file-row ${isSelected ? 'selected' : ''}" data-filename="${file.filename}">
              <td style="text-align: center; padding: 10px;">
                <input type="checkbox" class="temp-file-checkbox" data-filename="${file.filename}" ${isSelected ? 'checked' : ''} onchange="updateSelectedFiles(this)" style="cursor: pointer; width: 18px; height: 18px;">
              </td>
              <td class="file-name" style="padding: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHtml(file.name)}
              </td>
              <td class="file-size" style="padding: 10px; text-align: right; color: #6b7280;">
                ${sizeStr}
              </td>
              <td class="file-date" style="padding: 10px; text-align: right; color: #6b7280; font-size: 0.9rem;">
                ${dateStr}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
  
  DOM.tempFileList.innerHTML = htmlContent;
  DOM.tempFileListContainer.style.display = 'block';
  
  // Row-Click Handler für Auswahlbox
  document.querySelectorAll('.temp-file-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = row.querySelector('.temp-file-checkbox');
        checkbox.checked = !checkbox.checked;
        updateSelectedFiles(checkbox);
      }
    });
  });
  
  logDebug(`✅ ${STATE.tempFilesList.length} Datei(en) - Tabelle gerendert`, 'success');
}

/**
 * updateSelectedFiles(checkbox)
 * Wird aufgerufen wenn ein Checkbox geklickt wird
 * Aktualisiert auch die Row-Hervorhebung
 */
function updateSelectedFiles(checkbox) {
  const filename = checkbox.getAttribute('data-filename');
  
  if (!window.selectedTempFiles) {
    window.selectedTempFiles = new Set();
  }
  
  if (checkbox.checked) {
    window.selectedTempFiles.add(filename);
    logDebug(`✅ Ausgewählt: ${filename}`, 'data');
  } else {
    window.selectedTempFiles.delete(filename);
    logDebug(`❌ Abgewählt: ${filename}`, 'data');
  }
  
  // Update Row-Styling
  const row = checkbox.closest('.temp-file-row');
  if (row) {
    if (checkbox.checked) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  }
  
  logDebug(`📊 ${window.selectedTempFiles.size} von ${STATE.tempFilesList.length} Datei(en) ausgewählt`, 'info');
}

/**
 * sortTempFiles(column)
 * Sortiert die Tabelle nach Name, Größe oder Datum
 */
function sortTempFiles(column) {
  if (!window.tempFilesSortState) {
    window.tempFilesSortState = { column: 'name', ascending: true };
  }
  
  // Toggle ascending/descending wenn gleiche Spalte geklickt
  if (window.tempFilesSortState.column === column) {
    window.tempFilesSortState.ascending = !window.tempFilesSortState.ascending;
  } else {
    window.tempFilesSortState.column = column;
    window.tempFilesSortState.ascending = true;
  }
  
  logDebug(`📊 Sortiere nach ${column} (${window.tempFilesSortState.ascending ? 'aufsteigend' : 'absteigend'})`, 'info');
  renderTempFilesList();
}

/**
 * toggleSelectAllTempFiles(checkbox)
 * Wählt alle Dateien aus oder ab
 */
function toggleSelectAllTempFiles(checkbox) {
  if (!window.selectedTempFiles) {
    window.selectedTempFiles = new Set();
  }
  
  if (checkbox.checked) {
    // Filtere nur echte Datei-Checkboxen (nicht den "Select All" Button)
    STATE.tempFilesList.forEach(file => {
      if (file && typeof file === 'string') {
        window.selectedTempFiles.add(file);
      }
    });
    // Wähle nur echte Datei-Checkboxes aus (nicht den "Select All" Button)
    document.querySelectorAll('.temp-file-checkbox').forEach(cb => {
      const filename = cb.getAttribute('data-filename');
      if (filename && typeof filename === 'string') {
        cb.checked = true;
        const row = cb.closest('.temp-file-row');
        if (row) row.classList.add('selected');
      }
    });
    logDebug(`✅ ALLE ${STATE.tempFilesList.length} Datei(en) ausgewählt`, 'success');
  } else {
    window.selectedTempFiles.clear();
    document.querySelectorAll('.temp-file-checkbox').forEach(cb => {
      cb.checked = false;
      const row = cb.closest('.temp-file-row');
      if (row) row.classList.remove('selected');
    });
    logDebug(`❌ ALLE Dateien abgewählt`, 'success');
  }
}

/**
 * formatFileSize(bytes)
 * Konvertiert Bytes in lesbare Größe (KB, MB, GB)
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * analyzeFiles()
 * Sendet die Temp-Dateien zur Analyse an N8N
 * 
 * Ablauf:
 *   1. Falls tempFilesList leer: reloadTempFolder() aufrufen
 *   2. POST-Request an /analyse mit Dateiliste + sessionId
 *   3. N8N antwortet mit analysierten Daten pro Datei
 *   4. Ergebnisse in STATE.analysisResults speichern
 *   5. displayAnalysisResults() aufrufen um Kategorisierung zu zeigen
 * 
 * Response-Struktur pro Datei:
 *   {
 *     type: "series|movies|other",
 *     suggestions: [Name1, Name2, ...],
 *     season: number (nur für Series),
 *     episode: number (nur für Series),
 *     ...weitere Metadaten
 *   }
 */
/**
 * Helper: Entfernt Dateiendung von Dateinamen
 * "Episode 1.mp4" → "Episode 1"
 * "Movie Title.mkv" → "Movie Title"
 * Null-safe: Falls null/undefined → gibt leeren String zurück
 */
function removeFileExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}

async function analyzeFiles() {
  // Hole ausgewählte Dateien
  if (!window.selectedTempFiles) {
    window.selectedTempFiles = new Set();
  }
  
  // Filtere null/undefined Werte
  const filesToAnalyze = Array.from(window.selectedTempFiles).filter(f => f && typeof f === 'string');
  
  if (filesToAnalyze.length === 0) {
    logDebug('⚠️ Keine Dateien ausgewählt!', 'warning');
    logDebug('💡 Bitte mindestens eine Datei auswählen mit den Checkboxen', 'info');
    return;
  }
  
  logDebug(`✅ ${filesToAnalyze.length} Datei(en) ausgewählt zur Analyse`, 'analyse', { count: filesToAnalyze.length, sessionId: STATE.sessionId });
  
  // ===== NEUE FUNKTION: DATEIENDUNGEN ENTFERNEN =====
  // Für die Datenbank-Abfrage werden Dateinamen OHNE Erweiterung gesendet
  // Grund: Das Datenbanksystem speichert nur den Namen ohne Erweiterung
  // und kann so schneller prüfen, ob die Datei bereits analysiert wurde
  const fileNamesWithoutExt = filesToAnalyze.map(filename => removeFileExtension(filename));
  
  logDebug(`📋 Dateinamen mit Endung`, 'data', filesToAnalyze);
  logDebug(`📋 Dateinamen OHNE Endung (für DB)`, 'data', fileNamesWithoutExt);
  logDebug(`💾 Hinweis: Nur Datei-NAMEN ohne Endung werden zum Server gesendet!`, 'info');
  logDebug(`🗄️ Server prüft zuerst die Datenbank (Tokens sparen)`, 'info');
  logDebug(`🤖 Falls nicht in DB: wird über AI Cluster analysiert und dann gespeichert`, 'info');
  
  try {
    const analyzeUrl = `${CONFIG.api.n8nBaseUrl}${CONFIG.api.endpoints.analyse}`;
    
    // ===== WICHTIG: DATEINAMEN OHNE ENDUNG SENDEN =====
    // Der Server wird diese gegen die Datenbank prüfen
    // Wenn nicht vorhanden → AI Analyse → Speichern in DB
    // Wenn vorhanden → Direkt aus DB lesen (Token-Einsparung)
    const requestBody = {
      files: fileNamesWithoutExt,        // Array von Datei-NAMEN OHNE Erweiterung
      originalFiles: filesToAnalyze,     // Backup: Original-Namen mit Erweiterung
      sessionId: STATE.sessionId
    };
    
    logDebug(`🔗 POST an: ${analyzeUrl}`, 'info');
    logDebug(`📤 Request-Body:`, 'data');
    logDebug(`   files (OHNE Endung): [${fileNamesWithoutExt.map(f => `"${f}"`).join(', ')}]`, 'data');
    logDebug(`   originalFiles: [${filesToAnalyze.map(f => `"${f}"`).join(', ')}]`, 'data');
    logDebug(`   sessionId: ${STATE.sessionId}`, 'data');
    
    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    logDebug(`📨 Response Status: HTTP ${response.status}`, 'info');
    
    if (!response.ok) {
      const errorText = await response.text();
      logDebug(`❌ Server-Fehler: ${errorText}`, 'error');
      logDebug(`💡 Überprüfe:`, 'warning');
      logDebug(`   1. N8N Webhook ist online`, 'warning');
      logDebug(`   2. N8N hat FTP/SFTP Zugang zu /media/temp`, 'warning');
      logDebug(`   3. N8N hat Analysie-Nodes (z.B. AI/Metadata)`, 'warning');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    let rawAnalysis = await response.json();
    
    // ===== DEBUG: KOMPLETTE RESPONSE LOGGEN =====
    logDebug(`🔍 DEBUG: Komplette Raw-Response:`, 'debug');
    logDebug(`${JSON.stringify(rawAnalysis, null, 2)}`, 'debug');
    logDebug(`📊 Response Typ: ${typeof rawAnalysis} | IsArray: ${Array.isArray(rawAnalysis)}`, 'debug');
    
    // ===== ERROR-HANDLING FÜR N8N FEHLER =====
    // N8N kann auch mit HTTP 200 eine Error-Response zurückgeben:
    // { "status": "error", "message": "..." }
    if (rawAnalysis.status === 'error' || (rawAnalysis.error && !Array.isArray(rawAnalysis))) {
      const errorMsg = rawAnalysis.message || rawAnalysis.error || 'Unbekannter Fehler';
      logDebug(`❌ N8N Fehler empfangen:`, 'error');
      logDebug(`   Status: ${rawAnalysis.status || 'error'}`, 'error');
      logDebug(`   Message: ${errorMsg}`, 'error');
      logDebug(`💡 Mögliche Gründe:`, 'warning');
      logDebug(`   1. Workflow-Nodes sind nicht vollständig konfiguriert`, 'warning');
      logDebug(`   2. AI/Analyse-Service ist offline`, 'warning');
      logDebug(`   3. FTP/SFTP Verbindung zu /media/temp fehlgeschlagen`, 'warning');
      logDebug(`   4. Preview-Mode: [Execute previous nodes for preview]`, 'info');
      throw new Error(`Analyse fehlgeschlagen: ${errorMsg}`);
    }
    
    // ===== NEUE DATENSTRUKTUR-KONVERTIERUNG =====
    // Server antwortet mit analysierten Daten - ABER mit Namen OHNE Endung
    // Wir müssen diese wieder mit den Original-Dateinamen (MIT Endung) verknüpfen
    // Mapping: "Episode 1" → "Episode 1.mp4"
    
    let analysis = {};
    let errorFileNames = [];
    
    // Erstelle Mapping von Namen ohne Endung zu Original-Namen
    const nameMapping = {};
    filesToAnalyze.forEach((originalName, idx) => {
      const nameWithoutExt = fileNamesWithoutExt[idx];
      nameMapping[nameWithoutExt] = originalName;
    });
    
    logDebug(`🔄 Name-Mapping erstellt:`, 'data');
    Object.entries(nameMapping).forEach(([withoutExt, withExt]) => {
      logDebug(`   "${withoutExt}" ← "${withExt}"`, 'data');
    });
    
    // Falls Array: Verarbeite Items
    if (Array.isArray(rawAnalysis)) {
      logDebug(`📦 Empfangen: Array mit ${rawAnalysis.length} Einträgen`, 'info');
      
      rawAnalysis.forEach((item, index) => {
        logDebug(`🔍 DEBUG Item ${index + 1}: ${JSON.stringify(item, null, 2)}`, 'debug');
        
        // NEUE LOGIK: Prüfe ob Item direkt Analyse-Daten ODER ob es wrapped ist
        let data = null;
        
        // Fall 1: Item hat "output" Feld (Old Format)
        if (item.output) {
          logDebug(`   ✓ Item ${index + 1} hat 'output' Feld (Old Format)`, 'debug');
          data = item.output;
        }
        // Fall 2: Item hat "error" Feld (Error Array)
        else if (item.error && Array.isArray(item.error)) {
          logDebug(`   ${index + 1}. ⚠️ Fehler-Array mit ${item.error.length} Datei(en) erhalten`, 'warning');
          
          item.error.forEach(dbNameWithoutExt => {
            // Mapp den Namen zurück zu Original-Name (mit Endung)
            const originalFileName = nameMapping[dbNameWithoutExt] || dbNameWithoutExt;
            
            logDebug(`      ❌ ${dbNameWithoutExt} → ${originalFileName}`, 'warning');
            errorFileNames.push(originalFileName);
            
            // Erstelle Error-Eintrag mit Original-Namen
            analysis[originalFileName] = {
              original_name: originalFileName,
              db_name: dbNameWithoutExt,
              status: 'error',
              message: 'Datei konnte von der AI nicht analysiert werden oder ist nicht in der Datenbank',
              media_type: 'unknown'
            };
          });
          return; // Nicht weiter verarbeiten
        }
        // Fall 3: Item IST direkt die Analyse-Daten (New Format - DATENBANK)
        else if (item.original_name && item.media_type) {
          logDebug(`   ✓ Item ${index + 1} IST direkt Analyse-Daten (New DB Format)`, 'debug');
          data = item;
        }
        
        // Wenn wir Daten haben, verarbeite sie
        if (data) {
          logDebug(`   ✓ Output Objekt Keys: ${Object.keys(data).join(', ')}`, 'debug');
          
          // Der Server sendet Namen OHNE Endung, wir müssen diese zu Original-Namen mappen
          const dbName = data.original_name || data.db_name || data.filename || data.name;
          logDebug(`   ✓ Versuchte Namen: original_name="${data.original_name}", db_name="${data.db_name}", filename="${data.filename}", name="${data.name}"`, 'debug');
          logDebug(`   ✓ Verwendeter dbName: "${dbName}"`, 'debug');
          
          if (dbName) {
            logDebug(`   ✓ dbName vorhanden: "${dbName}"`, 'debug');
            logDebug(`   ✓ nameMapping Keys: ${Object.keys(nameMapping).join(', ')}`, 'debug');
            
            if (nameMapping[dbName]) {
              logDebug(`   ✓ Mapping GEFUNDEN für "${dbName}"`, 'debug');
              // Nutze den Original-Namen (mit Endung) als Key
              const originalFileName = nameMapping[dbName];
              
              // Speichere die Analyse-Daten mit Original-Namen
              analysis[originalFileName] = data;
              
              // Aktualisiere auch die original_name im Data-Objekt
              data.original_name = originalFileName;
              
              logDebug(`   ${index + 1}. ✅ ${dbName} → ${originalFileName} (${data.jellyfin_name || data.media_type})`, 'data');
            } else {
              // Fallback: Nutze den Namen direkt wenn Mapping nicht vorhanden
              logDebug(`   ⚠️ Mapping NICHT GEFUNDEN für "${dbName}"`, 'warning');
              logDebug(`   📋 Verfügbare Keys im Mapping: ${Object.keys(nameMapping).map(k => `"${k}"`).join(', ')}`, 'debug');
              logDebug(`   ℹ️ Fallback: Nutze dbName direkt als Key`, 'warning');
              
              // Nutze dbName direkt und versuche, Original-Namen zu rekonstruieren
              const fallbackOriginal = filesToAnalyze.find(f => removeFileExtension(f) === dbName);
              
              if (fallbackOriginal) {
                logDebug(`   ✅ Fallback Reconstruction erfolgreich: "${fallbackOriginal}"`, 'success');
                analysis[fallbackOriginal] = data;
                data.original_name = fallbackOriginal;
              } else {
                // Letzter Fallback: nutze dbName mit .mp4 Endung
                logDebug(`   ⚠️ Kein Match gefunden, nutze dbName + .mp4 als Fallback`, 'warning');
                analysis[dbName] = data;
              }
              
              logDebug(`   ${index + 1}. ⚠️ ${dbName} (Mapping nicht gefunden - Fallback benutzt)`, 'warning');
            }
          } else {
            logDebug(`   ❌ Kein dbName gefunden im Output-Objekt!`, 'error');
            logDebug(`   ❌ Output Keys: ${Object.keys(data).join(', ')}`, 'error');
            logDebug(`   ❌ Output Daten: ${JSON.stringify(data)}`, 'error');
          }
        } else {
          logDebug(`   ❌ Item ${index + 1} konnte nicht verarbeitet werden!`, 'error');
          logDebug(`   ❌ Item Keys: ${Object.keys(item).join(', ')}`, 'error');
          logDebug(`   ❌ Item Daten: ${JSON.stringify(item)}`, 'error');
        }
      });
    } else {
      // Falls bereits Objekt: Direkt verwenden und Original-Namen mappen
      logDebug(`📊 Empfangen: Objekt mit ${Object.keys(rawAnalysis).length} Einträgen`, 'info');
      
      Object.entries(rawAnalysis).forEach(([key, data]) => {
        // Versuche Original-Namen zu finden
        const originalFileName = nameMapping[key] || data.original_name || key;
        analysis[originalFileName] = data;
        
        if (!data.original_name) {
          data.original_name = originalFileName;
        }
      });
    }
    
    STATE.analysisResults = analysis;
    
    logDebug(`✅ Analyse-Antwort konvertiert und Namen gemappt:`, 'success');
    logDebug(`📊 Erfolg: ${Object.keys(analysis).length - errorFileNames.length} | Fehler: ${errorFileNames.length}`, 'success');
    
    // DEBUG: Alle Schlüssel zeigen
    logDebug(`🔍 DEBUG: Finale Analysis-Objekt Keys: ${Object.keys(analysis).map(k => `"${k}"`).join(', ')}`, 'debug');
    logDebug(`🔍 DEBUG: Finale Analysis-Objekt Size: ${Object.keys(analysis).length}`, 'debug');
    
    if (Object.keys(analysis).length === 0) {
      logDebug(`❌ WARNUNG: Analysis-Objekt ist LEER! Das ist ein kritischer Fehler!`, 'error');
      logDebug(`   Mögliche Ursachen:`, 'warning');
      logDebug(`   1. Server sendet andere Datenstruktur als erwartet`, 'warning');
      logDebug(`   2. Namen in Response passen nicht zum Mapping`, 'warning');
      logDebug(`   3. Weder 'output' noch 'error' Felder vorhanden`, 'warning');
      logDebug(`   4. Response ist nicht als Array formatiert`, 'warning');
    }
    
    logDebug(`📊 Ergebnisse (mit Original-Namen): ${JSON.stringify(analysis, null, 2)}`, 'data');
    logDebug(`📈 ${Object.keys(analysis).length} Dateien verarbeitet`, 'success');
    
    // Zeige die kategorisierten Ergebnisse
    displayAnalysisResults();
    
  } catch (error) {
    logDebug(`❌ Fehler bei der Analyse: ${error.message}`, 'error');
    logDebug(`📍 Stack: ${error.stack}`, 'error');
    logDebug(`⚠️ Analyse konnte nicht durchgeführt werden`, 'warning');
  }
}

/* ================================
   RESULTS DISPLAY & CATEGORIZATION
================================ */

/**
 * toggleFileSelection(filename, selected)
 * Verwaltet die Auswahl von Dateien
 */
function toggleFileSelection(filename, selected) {
  if (selected) {
    STATE.selectedFiles.add(filename);
  } else {
    STATE.selectedFiles.delete(filename);
  }
}

/**
 * selectAllInSeries(seriesName, select)
 * Wählt alle Episoden einer Serie aus oder ab
 */
function selectAllInSeries(seriesName, select) {
  Object.entries(STATE.analysisResults).forEach(([filename, result]) => {
    if (result.series_name === seriesName) {
      toggleFileSelection(filename, select);
    }
  });
  updateCheckboxesForSeries(seriesName);
  logDebug(`${select ? '✅' : '❌'} Alle Episoden von \"${seriesName}\" ${select ? 'ausgewählt' : 'abgewählt'}`, 'info');
}

/**
 * selectAllMovies(select)
 * Wählt alle Filme aus oder ab
 */
function selectAllMovies(select) {
  Object.entries(STATE.analysisResults).forEach(([filename, result]) => {
    if (result.media_type === 'movie') {
      toggleFileSelection(filename, select);
    }
  });
  updateCheckboxesForMovies();
  logDebug(`${select ? '✅' : '❌'} Alle Filme ${select ? 'ausgewählt' : 'abgewählt'}`, 'info');
}

/**
 * updateCheckboxesForSeries(seriesName)
 * Aktualisiert Checkboxen-Status für eine Serie
 */
function updateCheckboxesForSeries(seriesName) {
  const checkboxes = document.querySelectorAll(`.episode-row[data-series-name="${CSS.escape(seriesName)}"] input[type="checkbox"]`);
  checkboxes.forEach(cb => {
    const filename = cb.closest('.episode-row').getAttribute('data-filename');
    cb.checked = STATE.selectedFiles.has(filename);
  });
  // Update die Serie-Checkbox
  const seriesCheckbox = document.querySelector(`.series-checkbox[data-series-name="${CSS.escape(seriesName)}"]`);
  if (seriesCheckbox) {
    const allEpisodesOfSeries = Object.entries(STATE.analysisResults).filter(([, result]) => result.series_name === seriesName);
    const allSelected = allEpisodesOfSeries.every(([filename]) => STATE.selectedFiles.has(filename));
    seriesCheckbox.checked = allSelected;
  }
}

/**
 * updateCheckboxesForMovies()
 * Aktualisiert Checkboxen-Status für Filme
 */
function updateCheckboxesForMovies() {
  const checkboxes = document.querySelectorAll('.movie-row input[type="checkbox"]');
  checkboxes.forEach(cb => {
    const filename = cb.closest('.movie-row').getAttribute('data-filename');
    cb.checked = STATE.selectedFiles.has(filename);
  });
  // Update die Filme-Header-Checkbox
  const moviesCheckbox = document.querySelector('.movies-select-all-checkbox');
  if (moviesCheckbox) {
    const allMovies = Object.entries(STATE.analysisResults).filter(([, result]) => result.media_type === 'movie');
    const allSelected = allMovies.every(([filename]) => STATE.selectedFiles.has(filename));
    moviesCheckbox.checked = allSelected;
  }
}

function displayAnalysisResults() {
  DOM.categorizedList.innerHTML = '';
  
  // Initialisiere selectedFiles mit allen Dateien (Standard: alles ausgewählt)
  if (STATE.selectedFiles.size === 0) {
    Object.keys(STATE.analysisResults).forEach(filename => {
      STATE.selectedFiles.add(filename);
    });
  }
  
  // ===== NEUE STRUKTUR: KOMPAKTE TABELLEN-ÜBERSICHT =====
  const allResults = [];
  const errorResults = [];
  
  Object.entries(STATE.analysisResults).forEach(([filename, result]) => {
    if (!result) {
      return;
    }
    
    // Prüfe auf Error-Status
    if (result.status === 'error' || result.status === 'failed') {
      logDebug(`⚠️ Datei '${filename}' hat Error: ${result.message || 'Unbekannter Fehler'}`, 'warning');
      errorResults.push({ 
        filename, 
        ...result,
        original_name: result.original_name || filename
      });
      return;
    }
    
    allResults.push({ filename, ...result });
  });
  
  if (allResults.length === 0 && errorResults.length === 0) {
    DOM.categorizedList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--gray-500);">
        Keine Ergebnisse zum Anzeigen
      </div>
    `;
    DOM.uploadSection.style.display = 'none';
    DOM.analysisSection.style.display = 'block';
    return;
  }
  
  // Gruppiere nach Type dann Series
  const grouped = {};
  
  // Normale Ergebnisse
  allResults.forEach((item) => {
    const type = item.media_type;
    if (!grouped[type]) grouped[type] = {};
    
    if (type === 'series') {
      const seriesName = item.series_name || 'Unbekannt';
      if (!grouped[type][seriesName]) grouped[type][seriesName] = [];
      grouped[type][seriesName].push(item);
    } else {
      if (!grouped[type]['_list']) grouped[type]['_list'] = [];
      grouped[type]['_list'].push(item);
    }
  });
  
  // Rendere Übersicht
  let htmlContent = '';
  
  // Serien
  if (grouped.series && Object.keys(grouped.series).length > 0) {
    const totalEpisodes = Object.values(grouped.series).flat().length;
    htmlContent += `
      <div class="analysis-group">
        <div class="analysis-group-header">📺 Serien (${totalEpisodes})</div>
        <div class="analysis-overview">
          ${Object.entries(grouped.series).map(([seriesName, episodes]) => {
            // Sortiere Episoden
            episodes.sort((a, b) => {
              const aEp = `${String(a.season || 0).padStart(2, '0')}-${String(a.episode || 0).padStart(2, '0')}`;
              const bEp = `${String(b.season || 0).padStart(2, '0')}-${String(b.episode || 0).padStart(2, '0')}`;
              return aEp.localeCompare(bEp);
            });
            
            // Generiere eindeutige ID für diese Serie (für Bulk-Edit)
            const seriesId = btoa(seriesName).replace(/[^a-zA-Z0-9]/g, '');
            
            // Sammle Suggestions aus allen Episoden dieser Serie
            const allSuggestions = new Set();
            episodes.forEach(ep => {
              if (ep.suggestions) {
                ep.suggestions.split('|||').filter(s => s.trim()).forEach(s => allSuggestions.add(s.trim()));
              }
            });
            const seriesSuggestions = Array.from(allSuggestions);
            
            return `
              <div class="series-entry">
                <div class="series-entry-header">
                  <div class="series-entry-title">
                    <input type="checkbox" class="series-checkbox" data-series-name="${escapeHtml(seriesName)}" checked onchange="selectAllInSeries('${escapeHtml(seriesName)}', this.checked)" title="Ganze Serie auswählen/abwählen" />
                    <strong>${escapeHtml(seriesName)}</strong>
                    <span class="episode-count">${episodes.length} Folgen</span>
                    <button class="btn-edit-series" title="Serie umbenennen" onclick="openSeriesRenameModal('${escapeHtml(seriesName)}')">✎</button>
                    ${seriesSuggestions.length > 0 ? `<span class="badge-suggestions" onclick="showSeriesSuggestionsModal('${escapeHtml(seriesName)}', ${JSON.stringify(seriesSuggestions)})">💡 ${seriesSuggestions.length} Vorschläge</span>` : ''}
                  </div>
                  <div class="series-bulk-edit-controls" data-series-id="${seriesId}">
                    <select class="series-fsk-bulk" onchange="applyBulkFsk(this, '${seriesId}')">
                      <option value="">FSK für alle</option>
                      <option value="">– Keine –</option>
                      <option value="0">FSK 0</option>
                      <option value="6">FSK 6</option>
                      <option value="12">FSK 12</option>
                      <option value="16">FSK 16</option>
                      <option value="18">FSK 18</option>
                    </select>
                    <select class="series-audience-bulk" onchange="applyBulkAudience(this, '${seriesId}')">
                      <option value="">Zielgruppe für alle</option>
                      <option value="">– Wählen –</option>
                      <option value="kids">👶 Kinder</option>
                      <option value="adults">👨 Erwachsene</option>
                    </select>
                  </div>
                </div>
                <div class="episodes-list">
                  ${episodes.map((ep, idx) => `
                    <div class="episode-row" data-filename="${escapeHtml(ep.filename)}" data-series-id="${seriesId}" data-series-name="${escapeHtml(seriesName)}">
                      <input type="checkbox" class="episode-checkbox" checked onchange="toggleFileSelection('${escapeHtml(ep.filename)}', this.checked); updateCheckboxesForSeries('${escapeHtml(seriesName)}')" title="Episode auswählen/abwählen" />
                      <span class="episode-number">S${String(ep.season || 0).padStart(2, '0')} E${String(ep.episode || 0).padStart(2, '0')}</span>
                      <span class="episode-title">${escapeHtml(ep.jellyfin_name || ep.original_name).substring(0, 50)}</span>
                      <span class="episode-meta">
                        ${ep.fsk ? `<span class="badge-fsk">FSK ${ep.fsk}</span>` : ''}
                        <span class="badge-audience ${ep.audience}">${ep.audience === 'kids' ? '👶' : '👨'}</span>
                      </span>
                      <button class="btn-edit-episode" data-filename="${escapeHtml(ep.filename)}" onclick="editEpisodeModal(this)">✎ Edit</button>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  // Filme (WICHTIG: media_type ist "movie" singular!)
  if (grouped.movie && grouped.movie._list && grouped.movie._list.length > 0) {
    htmlContent += `
      <div class="analysis-group">
        <div class="analysis-group-header">🎬 Filme (${grouped.movie._list.length})
          <input type="checkbox" class="movies-select-all-checkbox" checked onchange="selectAllMovies(this.checked)" title="Alle Filme auswählen/abwählen" style="margin-left: 12px; cursor: pointer;" />
        </div>
        <div class="analysis-overview">
          ${grouped.movie._list.map((movie) => {
            // Parse Suggestions
            const suggestions = movie.suggestions ? movie.suggestions.split('|||').filter(s => s.trim()) : [];
            
            return `
              <div class="movie-row" data-filename="${escapeHtml(movie.filename)}">
                <input type="checkbox" class="movie-checkbox" checked onchange="toggleFileSelection('${escapeHtml(movie.filename)}', this.checked); updateCheckboxesForMovies()" title="Film auswählen/abwählen" />
                <span class="movie-title">
                  ${escapeHtml(movie.jellyfin_name || movie.original_name)}
                  ${suggestions.length > 0 ? `<span class="badge-suggestions" onclick="showSuggestionsModal('${escapeHtml(movie.filename)}')">💡 ${suggestions.length} Vorschläge</span>` : ''}
                </span>
                <span class="movie-meta">
                  ${movie.fsk ? `<span class="badge-fsk">FSK ${movie.fsk}</span>` : ''}
                  <span class="badge-audience ${movie.audience}">${movie.audience === 'kids' ? '👶' : '👨'}</span>
                </span>
                <button class="btn-edit-movie" data-filename="${escapeHtml(movie.filename)}" onclick="editMovieModal(this)">✎ Edit</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  // Sonstiges (alle anderen Typen + Fehler)
  const otherItems = [];
  Object.entries(grouped).forEach(([type, items]) => {
    if (type !== 'series' && type !== 'movie' && items._list) {
      otherItems.push(...items._list);
    }
  });
  
  // Fehlerhafte Dateien hinzufügen
  otherItems.push(...errorResults);
  
  // ===== UNERKANNTE DATEIEN SEKTION =====
  const unrecognizedFiles = otherItems.filter(item => item.status === 'error' || item.status === 'failed');
  const normalOther = otherItems.filter(item => item.status !== 'error' && item.status !== 'failed');
  
  if (unrecognizedFiles.length > 0) {
    // Speichere unerkannte Dateien im STATE
    STATE.unrecognizedFiles = unrecognizedFiles.map(f => f.filename);
    
    htmlContent += `
      <div class="analysis-group" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #ef4444;">
        <div class="analysis-group-header" style="background: #dc2626; color: white;">
          🚫 NICHT ERKANNTE DATEIEN (${unrecognizedFiles.length}) - MUSS MANUELL BEARBEITET WERDEN
        </div>
        <div class="analysis-overview" style="background: white; border-radius: 8px; overflow: hidden;">
          <div style="padding: 16px; background: #fff5f5; border-bottom: 2px solid #fee2e2;">
            <p style="margin: 0; color: #6b7280; font-size: 0.95rem;">
              ℹ️ Diese Dateien konnten von der KI nicht erkannt werden. Bitte bearbeiten Sie jede Datei einzeln mit dem 🔧 Button und geben Sie an, ob es sich um eine Serie oder einen Film handelt.
            </p>
          </div>
          ${unrecognizedFiles.map((item) => `
            <div class="unrecognized-file-item" data-filename="${escapeHtml(item.filename)}" style="
              background: #fafafa;
              padding: 16px;
              margin: 12px;
              border-radius: 6px;
              border-left: 5px solid #ef4444;
              border: 2px solid #fee2e2;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
            ">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <strong style="color: #dc2626; font-size: 1.05rem;">📄 ${escapeHtml(item.original_name)}</strong>
                  <span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">⚠️ BEARBEITUNG ERFORDERLICH</span>
                </div>
                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 0.9rem;">
                  ${escapeHtml(item.message || 'Die KI konnte diese Datei nicht einordnen.')}
                </p>
              </div>
              <button class="btn-edit-unrecognized" data-filename="${escapeHtml(item.filename)}" onclick="editUnrecognizedFileModal(this)" style="
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                white-space: nowrap;
                flex-shrink: 0;
              ">🔧 BEARBEITEN</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  // Normale Items
  if (normalOther.length > 0) {
    htmlContent += `
      <div class="analysis-group">
        <div class="analysis-group-header">❓ Sonstiges (${normalOther.length})</div>
        <div class="analysis-overview">
          ${normalOther.map((item) => `
            <div class="other-row" data-filename="${escapeHtml(item.filename)}">
              <span class="other-title">
                ${escapeHtml(item.original_name)}
              </span>
              <button class="btn-edit-other" data-filename="${escapeHtml(item.filename)}" onclick="editOtherModal(this)">✎ Edit</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  DOM.categorizedList.innerHTML = htmlContent;
  
  logDebug(`✅ Analyse-Übersicht angezeigt (${allResults.length + errorResults.length} Dateien)`, 'success');
  
  DOM.uploadSection.style.display = 'none';
  DOM.analysisSection.style.display = 'block';
}

// ===== EDIT MODALS FÜR JEDE DATEI =====
function editEpisodeModal(button) {
  const filename = button.dataset.filename;
  const data = STATE.analysisResults[filename];
  
  if (!data) return;
  
  // Einfaches Prompt-Dialog oder Modal
  const modalHtml = `
    <div class="edit-modal-overlay" onclick="closeEditModal(this)">
      <div class="edit-modal" onclick="event.stopPropagation();">
        <div class="edit-modal-header">
          <h3>📺 ${escapeHtml(data.series_name)} - S${String(data.season).padStart(2, '0')} E${String(data.episode).padStart(2, '0')}</h3>
          <button class="btn-close-modal" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">✕</button>
        </div>
        
        <div class="edit-modal-body">
          <div class="original-filename-hint">
            📄 ${escapeHtml(data.original_name)}
          </div>
          
          <div class="form-group">
            <label>Jellyfin Name</label>
            <input type="text" class="jellyfin-edit" value="${escapeHtml(data.jellyfin_name)}" data-filename="${escapeHtml(filename)}">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div class="form-group">
              <label>Staffel</label>
              <input type="number" class="season-edit" value="${data.season}" data-filename="${escapeHtml(filename)}">
            </div>
            <div class="form-group">
              <label>Folge</label>
              <input type="number" class="episode-edit" value="${data.episode}" data-filename="${escapeHtml(filename)}">
            </div>
          </div>
          
          <div class="form-group">
            <label>FSK</label>
            <select class="fsk-edit" data-filename="${escapeHtml(filename)}">
              <option value="">– Keine –</option>
              <option value="0" ${data.fsk === '0' || data.fsk === 0 ? 'selected' : ''}>FSK 0</option>
              <option value="6" ${data.fsk === '6' || data.fsk === 6 ? 'selected' : ''}>FSK 6</option>
              <option value="12" ${data.fsk === '12' || data.fsk === 12 ? 'selected' : ''}>FSK 12</option>
              <option value="16" ${data.fsk === '16' || data.fsk === 16 ? 'selected' : ''}>FSK 16</option>
              <option value="18" ${data.fsk === '18' || data.fsk === 18 ? 'selected' : ''}>FSK 18</option>
            </select>
          </div>
        </div>
        
        <div class="edit-modal-footer">
          <button class="btn-secondary" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">Abbrechen</button>
          <button class="btn-primary" onclick="saveEditModal(this.closest('.edit-modal-overlay'))">✓ Speichern</button>
        </div>
      </div>
    </div>
  `;
  
  // Einfügen und aktivieren
  const overlay = document.createElement('div');
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay.firstElementChild);
}

function editMovieModal(button) {
  const filename = button.dataset.filename;
  const data = STATE.analysisResults[filename];
  
  if (!data) return;
  
  const modalHtml = `
    <div class="edit-modal-overlay" onclick="closeEditModal(this)">
      <div class="edit-modal" onclick="event.stopPropagation();">
        <div class="edit-modal-header">
          <h3>🎬 ${escapeHtml(data.jellyfin_name || data.original_name)}</h3>
          <button class="btn-close-modal" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">✕</button>
        </div>
        
        <div class="edit-modal-body">
          <div class="original-filename-hint">
            📄 ${escapeHtml(data.original_name)}
          </div>
          
          <div class="form-group">
            <label>Filmtitel</label>
            <input type="text" class="jellyfin-edit" value="${escapeHtml(data.jellyfin_name)}" data-filename="${escapeHtml(filename)}">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div class="form-group">
              <label>FSK</label>
              <select class="fsk-edit" data-filename="${escapeHtml(filename)}">
                <option value="">– Keine –</option>
                <option value="0" ${data.fsk === '0' || data.fsk === 0 ? 'selected' : ''}>FSK 0</option>
                <option value="6" ${data.fsk === '6' || data.fsk === 6 ? 'selected' : ''}>FSK 6</option>
                <option value="12" ${data.fsk === '12' || data.fsk === 12 ? 'selected' : ''}>FSK 12</option>
                <option value="16" ${data.fsk === '16' || data.fsk === 16 ? 'selected' : ''}>FSK 16</option>
                <option value="18" ${data.fsk === '18' || data.fsk === 18 ? 'selected' : ''}>FSK 18</option>
              </select>
            </div>
            <div class="form-group">
              <label>Zielgruppe</label>
              <select class="audience-edit" data-filename="${escapeHtml(filename)}">
                <option value="">– Wählen –</option>
                <option value="kids" ${data.audience === 'kids' ? 'selected' : ''}>Kinder</option>
                <option value="adults" ${data.audience === 'adults' ? 'selected' : ''}>Erwachsene</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="edit-modal-footer">
          <button class="btn-secondary" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">Abbrechen</button>
          <button class="btn-primary" onclick="saveEditModal(this.closest('.edit-modal-overlay'))">✓ Speichern</button>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay.firstElementChild);
}

/**
 * editUnrecognizedFileModal(button)
 * Modal zum Bearbeiten von nicht erkannten Dateien
 * Benutzer kann: Serie/Film auswählen, Namen eingeben, zu bestehenden Gruppen hinzufügen
 */
function editUnrecognizedFileModal(button) {
  const filename = button.dataset.filename;
  const data = STATE.analysisResults[filename];
  
  if (!data) return;
  
  // Sammle existierende Serien und Filme
  const existingSeries = new Set();
  const existingMovies = new Set();
  
  Object.values(STATE.analysisResults).forEach(item => {
    if (item.media_type === 'series' && item.series_name) {
      existingSeries.add(item.series_name);
    }
    if (item.media_type === 'movie' || item.media_type === 'film') {
      existingMovies.add(item.jellyfin_name || item.original_name);
    }
  });
  
  const modalHtml = `
    <div class="edit-modal-overlay" onclick="closeEditModal(this)">
      <div class="edit-modal" onclick="event.stopPropagation();" style="max-width: 600px;">
        <div class="edit-modal-header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
          <h3 style="color: white;">🔧 Nicht erkannte Datei bearbeiten</h3>
          <button class="btn-close-modal" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">✕</button>
        </div>
        
        <div class="edit-modal-body">
          <div class="original-filename-hint" style="background: #fef2f2; border: 2px solid #fee2e2; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
            <strong>📄 ${escapeHtml(data.original_name)}</strong>
          </div>
          
          <div class="form-group">
            <label style="font-weight: bold; margin-bottom: 8px; display: block;">✨ Was ist diese Datei?</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px;">
              <button class="type-select-btn" data-type="series" onclick="selectUnrecognizedType('${escapeHtml(filename)}', 'series', event)" style="
                padding: 12px;
                background: #f0f9ff;
                border: 2px solid #0ea5e9;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                color: #0369a1;
                transition: all 0.2s;
              ">📺 Serie</button>
              <button class="type-select-btn" data-type="movie" onclick="selectUnrecognizedType('${escapeHtml(filename)}', 'movie', event)" style="
                padding: 12px;
                background: #f0fdf4;
                border: 2px solid #16a34a;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                color: #15803d;
                transition: all 0.2s;
              ">🎬 Film</button>
            </div>
          </div>
          
          <div id="series-options-${filename}" class="unrecognized-options" style="display: none; margin-bottom: 20px; padding: 16px; background: #f0f9ff; border-radius: 6px; border: 2px solid #0ea5e9;">
            <label style="font-weight: bold; margin-bottom: 12px; display: block;">📺 Serienname</label>
            
            ${existingSeries.size > 0 ? `
              <div style="margin-bottom: 16px;">
                <label style="font-size: 0.9rem; color: #6b7280; margin-bottom: 8px; display: block;">📌 Zu existierender Serie hinzufügen:</label>
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                  ${Array.from(existingSeries).sort().map(seriesName => `
                    <button class="series-select-btn" onclick="selectUnrecognizedSeries('${escapeHtml(filename)}', '${escapeHtml(seriesName)}')" style="
                      padding: 10px;
                      background: white;
                      border: 2px solid #0ea5e9;
                      border-radius: 4px;
                      cursor: pointer;
                      text-align: left;
                      color: #0369a1;
                      font-weight: 500;
                      transition: all 0.2s;
                    ">✓ ${escapeHtml(seriesName)}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            <div>
              <label style="font-size: 0.9rem; color: #6b7280; margin-bottom: 8px; display: block;">✏️ Oder neue Serie:</label>
              <input type="text" class="unrecognized-series-name" placeholder="z.B. 'One Piece' oder 'Attack on Titan'" style="
                width: 100%;
                padding: 10px;
                border: 2px solid #0ea5e9;
                border-radius: 4px;
                font-size: 0.95rem;
              ">
            </div>
          </div>
          
          <div id="movie-options-${filename}" class="unrecognized-options" style="display: none; margin-bottom: 20px; padding: 16px; background: #f0fdf4; border-radius: 6px; border: 2px solid #16a34a;">
            <label style="font-weight: bold; margin-bottom: 8px; display: block;">🎬 Filmtitel</label>
            <input type="text" class="unrecognized-movie-name" placeholder="z.B. 'The Matrix' oder 'Inception'" style="
              width: 100%;
              padding: 10px;
              border: 2px solid #16a34a;
              border-radius: 4px;
              font-size: 0.95rem;
              margin-bottom: 12px;
            ">
            
            <div class="form-group">
              <label>Zielgruppe</label>
              <select class="audience-edit-unrecognized" style="
                width: 100%;
                padding: 10px;
                border: 2px solid #16a34a;
                border-radius: 4px;
              ">
                <option value="">– Wählen –</option>
                <option value="kids">👶 Kinder</option>
                <option value="adults">👨 Erwachsene</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="edit-modal-footer">
          <button class="btn-secondary" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">❌ Abbrechen</button>
          <button class="btn-primary" onclick="saveUnrecognizedFile('${escapeHtml(filename)}')" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">✓ Speichern & Gruppieren</button>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay.firstElementChild);
  
  logDebug(`🔧 Edit-Modal für unerkannte Datei geöffnet: ${filename}`, 'info');
}

function selectUnrecognizedType(filename, type, event) {
  // Zeige Serie oder Film Options
  const seriesOptions = document.getElementById(`series-options-${filename}`);
  const movieOptions = document.getElementById(`movie-options-${filename}`);
  
  const buttons = document.querySelectorAll(`.type-select-btn`);
  buttons.forEach(btn => {
    btn.style.background = btn.dataset.type === 'series' ? '#f0f9ff' : '#f0fdf4';
    btn.style.borderColor = btn.dataset.type === 'series' ? '#0ea5e9' : '#16a34a';
    btn.style.color = btn.dataset.type === 'series' ? '#0369a1' : '#15803d';
  });
  
  if (type === 'series') {
    if (seriesOptions) seriesOptions.style.display = 'block';
    if (movieOptions) movieOptions.style.display = 'none';
    event.target.style.background = '#0ea5e9';
    event.target.style.color = 'white';
  } else {
    if (seriesOptions) seriesOptions.style.display = 'none';
    if (movieOptions) movieOptions.style.display = 'block';
    event.target.style.background = '#16a34a';
    event.target.style.color = 'white';
  }
}

function selectUnrecognizedSeries(filename, seriesName) {
  // Setze den Seriennamen im Input-Feld
  const input = document.querySelector(`.unrecognized-series-name`);
  if (input) input.value = seriesName;
  // Visuelles Feedback
  const buttons = document.querySelectorAll(`.series-select-btn`);
  buttons.forEach(btn => {
    btn.style.background = btn.textContent.includes(seriesName) ? '#0ea5e9' : 'white';
    btn.style.color = btn.textContent.includes(seriesName) ? 'white' : '#0369a1';
  });
}

function saveUnrecognizedFile(filename) {
  const data = STATE.analysisResults[filename];
  if (!data) return;
  
  const seriesOptions = document.getElementById(`series-options-${filename}`);
  const movieOptions = document.getElementById(`movie-options-${filename}`);
  
  const isSeriesSelected = seriesOptions && seriesOptions.style.display !== 'none';
  const isMovieSelected = movieOptions && movieOptions.style.display !== 'none';
  
  if (!isSeriesSelected && !isMovieSelected) {
    alert('❌ Bitte wählen Sie zuerst aus, ob es sich um eine Serie oder einen Film handelt!');
    return;
  }
  
  if (isSeriesSelected) {
    const seriesName = document.querySelector('.unrecognized-series-name')?.value.trim();
    if (!seriesName) {
      alert('❌ Bitte geben Sie einen Seriennamen ein!');
      return;
    }
    
    // Bestimme Season/Episode aus dem Dateinamen (heuristisch)
    let season = 1;
    let episode = 1;
    const seasonMatch = filename.match(/[Ss](\d+)/);
    const episodeMatch = filename.match(/[Ee](\d+)/);
    
    if (seasonMatch) season = parseInt(seasonMatch[1]);
    if (episodeMatch) episode = parseInt(episodeMatch[1]);
    
    // Aktualisiere die Analyse-Daten
    data.media_type = 'series';
    data.series_name = seriesName;
    data.jellyfin_name = `${seriesName} S${String(season).padStart(2, '0')} E${String(episode).padStart(2, '0')}`;
    data.season = season;
    data.episode = episode;
    data.status = undefined;  // Markiere als bearbeitet
    
    logDebug(`✅ Unerkannte Datei als SERIE hinzugefügt: "${filename}" → "${seriesName}"`, 'success');
  } else {
    const movieName = document.querySelector('.unrecognized-movie-name')?.value.trim();
    const audience = document.querySelector('.audience-edit-unrecognized')?.value || '';
    
    if (!movieName) {
      alert('❌ Bitte geben Sie einen Filmtitel ein!');
      return;
    }
    
    // Aktualisiere die Analyse-Daten
    data.media_type = 'movie';
    data.jellyfin_name = movieName;
    data.audience = audience || 'adults';
    data.status = undefined;  // Markiere als bearbeitet
    
    logDebug(`✅ Unerkannte Datei als FILM hinzugefügt: "${filename}" → "${movieName}"`, 'success');
  }
  
  // Entferne aus unerkannter Liste
  if (STATE.unrecognizedFiles) {
    STATE.unrecognizedFiles = STATE.unrecognizedFiles.filter(f => f !== filename);
  }
  
  // Wähle die Datei automatisch aus
  STATE.selectedFiles.add(filename);
  
  // Schließe Modal
  closeEditModal(document.querySelector('.edit-modal-overlay'));
  
  // Aktualisiere die Anzeige
  displayAnalysisResults();
  
  logDebug(`🔄 Analyse-Übersicht neu gerendert nach Bearbeitung von unerkannter Datei`, 'info');
}

function editOtherModal(button) {
  const filename = button.dataset.filename;
  const data = STATE.analysisResults[filename];
  
  if (!data) return;
  
  const modalHtml = `
    <div class="edit-modal-overlay" onclick="closeEditModal(this)">
      <div class="edit-modal" onclick="event.stopPropagation();">
        <div class="edit-modal-header">
          <h3>❓ ${escapeHtml(data.original_name)}</h3>
          <button class="btn-close-modal" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">✕</button>
        </div>
        
        <div class="edit-modal-body">
          <div class="original-filename-hint">
            📄 ${escapeHtml(data.original_name)}
          </div>
          
          <div class="form-group">
            <label>Beschreibung</label>
            <input type="text" class="jellyfin-edit" value="${escapeHtml(data.jellyfin_name || data.original_name)}" data-filename="${escapeHtml(filename)}">
          </div>
        </div>
        
        <div class="edit-modal-footer">
          <button class="btn-secondary" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">Abbrechen</button>
          <button class="btn-primary" onclick="saveEditModal(this.closest('.edit-modal-overlay'))">✓ Speichern</button>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay.firstElementChild);
}

/**
 * openSeriesRenameModal(oldSeriesName)
 * Öffnet Modal zum Umbenennen einer Serie
 * Alle Episoden dieser Serie werden mit dem neuen Namen aktualisiert
 * Jellyfin-Namen werden automatisch regeneriert
 */
function openSeriesRenameModal(oldSeriesName) {
  const modalHtml = `
    <div class="edit-modal-overlay" onclick="closeEditModal(this)">
      <div class="edit-modal" onclick="event.stopPropagation();">
        <div class="edit-modal-header">
          <h3>📺 Serie umbenennen</h3>
          <button class="btn-close-modal" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">✕</button>
        </div>
        
        <div class="edit-modal-body">
          <div class="original-filename-hint">
            Alter Name: ${escapeHtml(oldSeriesName)}
          </div>
          
          <div class="form-group">
            <label>Neuer Seriename</label>
            <input type="text" class="series-rename-input" value="${escapeHtml(oldSeriesName)}" placeholder="z.B. One Piece (2025)">
          </div>
          
          <div style="color: #6b7280; font-size: 0.85rem; margin-top: 12px;">
            💡 <strong>Jellyfin-Namen werden automatisch aktualisiert</strong><br>
            Konvention: <code>${escapeHtml(oldSeriesName)} S01 E01</code>
          </div>
        </div>
        
        <div class="edit-modal-footer">
          <button class="btn-secondary" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">Abbrechen</button>
          <button class="btn-primary" onclick="saveSeriesRename(this.closest('.edit-modal-overlay'), '${escapeHtml(oldSeriesName)}')">✓ Umbenennen</button>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay.firstElementChild);
  
  // Focus auf Input
  setTimeout(() => {
    overlay.firstElementChild.querySelector('.series-rename-input')?.focus();
  }, 0);
}

function closeEditModal(overlay) {
  overlay?.remove();
}

function saveEditModal(overlay) {
  const filename = overlay.querySelector('.jellyfin-edit')?.dataset.filename;
  
  if (!filename) return;
  
  if (!STATE.userEdits[filename]) {
    STATE.userEdits[filename] = {};
  }
  
  // Sammle alle Änderungen
  const jellyfinInput = overlay.querySelector('.jellyfin-edit');
  const seasonInput = overlay.querySelector('.season-edit');
  const episodeInput = overlay.querySelector('.episode-edit');
  const fskSelect = overlay.querySelector('.fsk-edit');
  const audienceSelect = overlay.querySelector('.audience-edit');
  
  // Speichere Werte IMMER wenn Element existiert (nicht nur wenn gefüllt)
  if (jellyfinInput) STATE.userEdits[filename].jellyfin_name = jellyfinInput.value;
  if (seasonInput) STATE.userEdits[filename].season = seasonInput.value;
  if (episodeInput) STATE.userEdits[filename].episode = episodeInput.value;
  if (fskSelect) STATE.userEdits[filename].fsk = fskSelect.value;
  if (audienceSelect) STATE.userEdits[filename].audience = audienceSelect.value;
  
  logDebug(`✏️ Datei aktualisiert: ${filename}`, 'info');
  logDebug(`   Gespeicherte Änderungen: ${JSON.stringify(STATE.userEdits[filename])}`, 'data');
  
  closeEditModal(overlay);
}

// ===== BULK-EDIT FUNKTIONEN FÜR SERIEN =====
function applyBulkFsk(selectElement, seriesId) {
  const selectedFsk = selectElement.value;
  
  if (!selectedFsk) return;
  
  // Finde alle Episodes dieser Serie
  const episodeRows = document.querySelectorAll(`.episode-row[data-series-id="${seriesId}"]`);
  
  episodeRows.forEach((row) => {
    const filename = row.dataset.filename;
    
    // Speichere FSK-Änderung in STATE
    if (!STATE.userEdits[filename]) {
      STATE.userEdits[filename] = {};
    }
    STATE.userEdits[filename].fsk = selectedFsk;
    
    // Update Badge in UI
    const fskBadge = row.querySelector('.badge-fsk');
    if (fskBadge) {
      fskBadge.textContent = `FSK ${selectedFsk}`;
    } else {
      // Erstelle neues FSK Badge falls nicht vorhanden
      const episodeMeta = row.querySelector('.episode-meta');
      if (episodeMeta) {
        const newBadge = document.createElement('span');
        newBadge.className = 'badge-fsk';
        newBadge.textContent = `FSK ${selectedFsk}`;
        episodeMeta.insertBefore(newBadge, episodeMeta.firstChild);
      }
    }
  });
  
  logDebug(`📺 FSK ${selectedFsk} für ${episodeRows.length} Episoden gesetzt`, 'success');
  
  // Reset Select
  selectElement.value = '';
}

function applyBulkAudience(selectElement, seriesId) {
  const selectedAudience = selectElement.value;
  
  if (!selectedAudience) return;
  
  // Finde alle Episodes dieser Serie
  const episodeRows = document.querySelectorAll(`.episode-row[data-series-id="${seriesId}"]`);
  
  episodeRows.forEach((row) => {
    const filename = row.dataset.filename;
    
    // Speichere Audience-Änderung in STATE
    if (!STATE.userEdits[filename]) {
      STATE.userEdits[filename] = {};
    }
    STATE.userEdits[filename].audience = selectedAudience;
    
    // Update Badge in UI
    const audienceBadge = row.querySelector('.badge-audience');
    if (audienceBadge) {
      audienceBadge.textContent = selectedAudience === 'kids' ? '👶' : '👨';
      audienceBadge.className = `badge-audience ${selectedAudience}`;
    }
  });
  
  const audienceLabel = selectedAudience === 'kids' ? 'Kinder' : 'Erwachsene';
  logDebug(`📺 Zielgruppe ${audienceLabel} für ${episodeRows.length} Episoden gesetzt`, 'success');
  
  // Reset Select
  selectElement.value = '';
}

// ===== SUGGESTIONS MODALS =====
function showSuggestionsModal(filename) {
  const data = STATE.analysisResults[filename];
  
  if (!data || !data.suggestions) return;
  
  const suggestions = data.suggestions.split('|||').filter(s => s.trim());
  if (suggestions.length === 0) return;
  
  const modalHtml = `
    <div class="edit-modal-overlay" onclick="closeEditModal(this)">
      <div class="edit-modal" onclick="event.stopPropagation();">
        <div class="edit-modal-header">
          <h3>💡 Namensvorschläge für ${escapeHtml(data.original_name)}</h3>
          <button class="btn-close-modal" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">✕</button>
        </div>
        
        <div class="edit-modal-body">
          <p style="color: var(--gray-600); margin-bottom: 12px;">Wähle einen Namen aus oder bearbeite ihn manuell:</p>
          
          <div class="suggestions-list">
            ${suggestions.map((suggestion, idx) => `
              <button 
                class="suggestion-btn" 
                data-filename="${escapeHtml(filename)}"
                onclick="acceptSuggestion(this, '${escapeHtml(filename)}', '${escapeHtml(suggestion)}')">
                ${escapeHtml(suggestion)}
              </button>
            `).join('')}
          </div>
          
          <div class="form-group" style="margin-top: 16px;">
            <label>Oder Manuell bearbeiten:</label>
            <input 
              type="text" 
              class="jellyfin-suggestion-input" 
              value="${escapeHtml(data.jellyfin_name)}" 
              data-filename="${escapeHtml(filename)}"
              placeholder="Name eingeben...">
          </div>
        </div>
        
        <div class="edit-modal-footer">
          <button class="btn-secondary" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">Abbrechen</button>
          <button class="btn-primary" onclick="saveSuggestion(this.closest('.edit-modal-overlay'), '${escapeHtml(filename)}')">✓ Übernehmen</button>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay.firstElementChild);
}

function showSeriesSuggestionsModal(seriesName, suggestions) {
  const modalHtml = `
    <div class="edit-modal-overlay" onclick="closeEditModal(this)">
      <div class="edit-modal" onclick="event.stopPropagation();">
        <div class="edit-modal-header">
          <h3>💡 Namensvorschläge für ${escapeHtml(seriesName)}</h3>
          <button class="btn-close-modal" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">✕</button>
        </div>
        
        <div class="edit-modal-body">
          <p style="color: var(--gray-600); margin-bottom: 12px;">Wähle einen Namen aus oder bearbeite ihn manuell:</p>
          
          <div class="suggestions-list">
            ${suggestions.map((suggestion, idx) => `
              <button 
                class="suggestion-btn" 
                onclick="acceptSeriesSuggestion(this, '${escapeHtml(seriesName)}', '${escapeHtml(suggestion)}')">
                ${escapeHtml(suggestion)}
              </button>
            `).join('')}
          </div>
          
          <div class="form-group" style="margin-top: 16px;">
            <label>Oder Manuell bearbeiten:</label>
            <input 
              type="text" 
              class="series-suggestion-input" 
              value="${escapeHtml(seriesName)}" 
              data-series-name="${escapeHtml(seriesName)}"
              placeholder="Name eingeben...">
          </div>
        </div>
        
        <div class="edit-modal-footer">
          <button class="btn-secondary" onclick="closeEditModal(this.closest('.edit-modal-overlay'))">Abbrechen</button>
          <button class="btn-primary" onclick="saveSeriesSuggestion(this.closest('.edit-modal-overlay'), '${escapeHtml(seriesName)}')">✓ Übernehmen</button>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay.firstElementChild);
}

function acceptSuggestion(button, filename, suggestion) {
  const input = button.closest('.edit-modal-body').querySelector('.jellyfin-suggestion-input');
  input.value = suggestion;
  button.classList.add('selected');
  
  // Remove selected von anderen Buttons
  button.closest('.suggestions-list').querySelectorAll('.suggestion-btn').forEach(btn => {
    if (btn !== button) btn.classList.remove('selected');
  });
}

function acceptSeriesSuggestion(button, seriesName, suggestion) {
  const input = button.closest('.edit-modal-body').querySelector('.series-suggestion-input');
  input.value = suggestion;
  button.classList.add('selected');
  
  button.closest('.suggestions-list').querySelectorAll('.suggestion-btn').forEach(btn => {
    if (btn !== button) btn.classList.remove('selected');
  });
}

function saveSuggestion(overlay, filename) {
  const input = overlay.querySelector('.jellyfin-suggestion-input');
  const newName = input?.value || '';
  
  if (!newName.trim()) return;
  
  // Speichere in userEdits
  if (!STATE.userEdits[filename]) {
    STATE.userEdits[filename] = {};
  }
  STATE.userEdits[filename].jellyfin_name = newName;
  
  logDebug(`✏️ Filmname aktualisiert: ${newName}`, 'info');
  closeEditModal(overlay);
  
  // Reload Display
  displayAnalysisResults();
}

function saveSeriesSuggestion(overlay, oldSeriesName) {
  const input = overlay.querySelector('.series-suggestion-input');
  const newSeriesName = input?.value || '';
  
  if (!newSeriesName.trim()) return;
  
  // Update alle Episoden dieser Serie mit neuem series_name
  Object.entries(STATE.analysisResults).forEach(([filename, result]) => {
    if (result.series_name === oldSeriesName) {
      result.series_name = newSeriesName;
      
      if (!STATE.userEdits[filename]) {
        STATE.userEdits[filename] = {};
      }
      STATE.userEdits[filename].series_name = newSeriesName;
    }
  });
  
  logDebug(`✏️ Seriename aktualisiert: ${newSeriesName} (${Object.keys(STATE.userEdits).filter(f => STATE.userEdits[f].series_name === newSeriesName).length} Episoden)`, 'info');
  closeEditModal(overlay);
  
  // Reload Display
  displayAnalysisResults();
}

/**
 * saveSeriesRename(overlay, oldSeriesName)
 * Umbenennt eine Serie und regeneriert automatisch alle Jellyfin-Namen
 * Jellyfin-Konvention: {new_name} S{season} E{episode}
 * Beispiel: "One Piece(2025) S1 E1" (OHNE Leerzeichen nach S und E, OHNE Padding)
 */
function saveSeriesRename(overlay, oldSeriesName) {
  const input = overlay.querySelector('.series-rename-input');
  const newSeriesName = input?.value || '';
  
  if (!newSeriesName.trim()) return;
  
  let updatedCount = 0;
  
  // Trimme trailing Spaces vom neuen Namen
  const trimmedName = newSeriesName.trim();
  
  // Update alle Episoden dieser Serie mit neuem series_name UND regeneriertem jellyfin_name
  Object.entries(STATE.analysisResults).forEach(([filename, result]) => {
    if (result.series_name === oldSeriesName) {
      // 1. Update series_name
      result.series_name = trimmedName;
      
      // 2. Regeneriere jellyfin_name nach Konvention: {name} S{season} E{episode}
      // Format: OHNE Leerzeichen nach S und E, OHNE 0-Padding
      const season = result.season;
      const episode = result.episode;
      const regeneratedName = `${trimmedName} S${season} E${episode}`;
      
      result.jellyfin_name = regeneratedName;
      
      // 3. Speichere in userEdits
      if (!STATE.userEdits[filename]) {
        STATE.userEdits[filename] = {};
      }
      STATE.userEdits[filename].series_name = trimmedName;
      STATE.userEdits[filename].jellyfin_name = regeneratedName;
      
      updatedCount++;
    }
  });
  
  logDebug(`✏️ Serie "${oldSeriesName}" → "${trimmedName}" (${updatedCount} Episoden umbenennt, Jellyfin-Namen regeneriert: Format S{season} E{episode})`, 'info');
  closeEditModal(overlay);
  
  // Reload Display um aktualisierte Struktur zu zeigen
  displayAnalysisResults();
}



/* ================================
   NAVIGATION
================================ */
function initNavigation() {
  DOM.reloadTempBtn?.addEventListener('click', reloadTempFolder);
  DOM.analyzeFilesBtn?.addEventListener('click', analyzeFiles);
  
  // Select All / Deselect All für Temp-Dateien
  DOM.selectAllFilesBtn?.addEventListener('click', () => {
    if (!window.selectedTempFiles) {
      window.selectedTempFiles = new Set();
    }
    
    // Alle Checkboxen in tempFileList checken
    document.querySelectorAll('#tempFileList input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = true;
      const filename = checkbox.getAttribute('data-filename');
      window.selectedTempFiles.add(filename);
    });
    
    logDebug(`✅ ALLE ${window.selectedTempFiles.size} Datei(en) ausgewählt`, 'success');
  });
  
  DOM.deselectAllFilesBtn?.addEventListener('click', () => {
    if (!window.selectedTempFiles) {
      window.selectedTempFiles = new Set();
    }
    
    // Alle Checkboxen in tempFileList unchecken
    document.querySelectorAll('#tempFileList input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
      const filename = checkbox.getAttribute('data-filename');
      window.selectedTempFiles.delete(filename);
    });
    
    logDebug(`❌ ALLE Dateien abgewählt`, 'success');
  });
  
  DOM.backToUploadBtn?.addEventListener('click', () => {
    DOM.analysisSection.style.display = 'none';
    DOM.uploadSection.style.display = 'block';
  });
  DOM.finalizeBtn?.addEventListener('click', finalizeAndUpload);
  DOM.clearDebugBtn?.addEventListener('click', () => {
    debugBuffer = [];
    if (DOM.debugOutput) {
      DOM.debugOutput.innerHTML = '';
    }
  });
  
  logDebug('Navigation initialisiert', 'success');
}

/* ================================
   FINALIZE & UPLOAD
   Sendet Benutzer-Edits zum Backend und triggert Dateiorganisierung
================================ */

/**
 * resolvePathKeyFromAudience(audience, mediaType)
 * Findet das richtige Kürzel aus app.json basierend auf audience und mediaType
 * 
 * Logik:
 *   - Erste Zeichen: S (Serie) oder F (Film) basierend auf mediaType
 *   - Zweite Zeichen: E (Erwachsene) oder K (Kinder) basierend auf audience
 * 
 * Beispiele:
 *   audience="adults", mediaType="series" → "SE"
 *   audience="children", mediaType="movie" → "FK"
 * 
 * Returns: Kürzel (z.B. "SE", "SK", "FE", "FK") oder null falls nicht gefunden
 */
function resolvePathKeyFromAudience(audience, mediaType) {
  // Bestimme Media-Typ Kürzel (S oder F)
  let mediaKey = '';
  if (mediaType === 'series') {
    mediaKey = 'S';
  } else if (mediaType === 'movie') {
    mediaKey = 'F';
  } else {
    logDebug(`⚠️ Unbekannter mediaType: ${mediaType}`, 'warning');
    return null;
  }
  
  // Bestimme Audience Kürzel (E oder K)
  // Normalisiere: 'kids' → 'K', 'children' → 'K', 'adults' → 'E'
  let audienceKey = '';
  if (audience === 'adults') {
    audienceKey = 'E';  // Erwachsene
  } else if (audience === 'children' || audience === 'kids') {
    audienceKey = 'K';  // Kinder (accepts both 'children' and 'kids')
  } else {
    logDebug(`⚠️ Unbekannte Audience: ${audience}`, 'warning');
    return null;
  }
  
  // Kombiniere zu Pfad-Kürzel
  const pathKey = mediaKey + audienceKey;
  
  // Prüfe ob es in CONFIG.paths existiert
  if (CONFIG.paths && CONFIG.paths[pathKey]) {
    logDebug(`   ✓ Path-Key "${pathKey}" → "${CONFIG.paths[pathKey]}"`, 'data');
    return pathKey;
  } else {
    logDebug(`⚠️ Path-Key "${pathKey}" nicht in app.json gefunden!`, 'warning');
    return null;
  }
}

/**
 * finalizeAndUpload()
 * Hauptfunktion zum Abschließen der Verarbeitung
 * 
 * Ablauf:
 *   1. STATE.userEdits sammeln (alle vom Benutzer gemachten Änderungen)
 *   2. Für jede Datei: resolvePathKeyFromAudience() nutzen um Zielverzeichnis zu bestimmen
 *   3. POST-Request an /finalize mit kompletten Daten + Pfad-Kürzel + sessionId
 *   4. N8N verarbeitet die Daten:
 *      - Überprüft Namen gegen Jellyfin
 *      - Organisiert Dateien in richtige Verzeichnisse (basierend auf pathKey)
 *      - Speichert Metadaten
 *   5. Bei Erfolg: App zurücksetzen für neuen Workflow
 * 
 * Neue Struktur der finalen Daten:
 *   {
 *     "originalName": "Episode 1.mkv",
 *     "pathKey": "SE",  // Serien + Erwachsene
 *     "path": "/media/Serien/Erwachsene/",
 *     "audience": "adults",
 *     "mediaType": "series",
 *     "jellyfin_name": "One Piece(2025) S1 E1",
 *     "season": 1,
 *     "episode": 1,
 *     "series_name": "One Piece(2025)",
 *     "sessionId": "session-..."
 *   }
 */
/**
 * validateUnrecognizedFiles()
 * Prüft ob es noch unerkannte Dateien gibt
 * Verhindert Finalisierung bis alle Dateien bearbeitet wurden
 */
function validateUnrecognizedFiles() {
  // Prüfe ob es noch unerkannte Dateien gibt
  const unrecognized = Object.entries(STATE.analysisResults)
    .filter(([_, data]) => data.status === 'error' || data.status === 'failed')
    .map(([filename, _]) => filename);
  
  if (unrecognized.length > 0) {
    const fileList = unrecognized.map(f => `\n  • ${f}`).join('');
    alert(`❌ FEHLER: Es gibt noch ${unrecognized.length} nicht bearbeitete Datei(en):${fileList}\n\nBitte bearbeiten Sie diese Dateien zuerst mit dem 🔧 Button, bevor Sie finalisieren!`);
    logDebug(`❌ VALIDIERUNGSFEHLER: ${unrecognized.length} unerkannte Datei(en) noch nicht bearbeitet`, 'error', { unrecognized });
    return false;
  }
  
  if (STATE.selectedFiles.size === 0) {
    alert('❌ Bitte wählen Sie mindestens eine Datei aus!');
    logDebug(`❌ VALIDIERUNGSFEHLER: Keine Dateien ausgewählt`, 'error');
    return false;
  }
  
  return true;
}

async function finalizeAndUpload() {
  // Validiere zunächst unerkannte Dateien
  if (!validateUnrecognizedFiles()) {
    return;
  }
  
  logDebug(`🚀 Finalisierung wird gestartet...`, 'upload', { sessionId: STATE.sessionId });
  logDebug(`📊 SessionId: ${STATE.sessionId}`, 'data');
  logDebug(`📁 Lade Pfad-Struktur aus app.json...`, 'info');
  logDebug(`✅ Ausgewählte Dateien: ${STATE.selectedFiles.size}`, 'data', { selected: Array.from(STATE.selectedFiles) });
  
  // Prüfe ob überhaupt Dateien ausgewählt sind
  if (STATE.selectedFiles.size === 0) {
    logDebug(`⚠️ Keine Dateien ausgewählt! Bitte wählen Sie mindestens eine Datei aus.`, 'warning');
    alert('⚠️ Bitte wählen Sie mindestens eine Datei aus, bevor Sie fortfahren.');
    return;
  }
  
  // Präpariere vollständige Daten für jeden File
  // WICHTIG: Nur ausgewählte Dateien verarbeiten!
  const filesWithCompleteData = [];
  let validFiles = 0;
  let invalidFiles = 0;
  
  // WICHTIG: Iteriere über analysisResults, nicht userEdits!
  // So werden auch Dateien ohne explizite Edits verarbeitet
  // ABER: Nur wenn sie ausgewählt sind (STATE.selectedFiles)
  Object.entries(STATE.analysisResults).forEach(([filename, originalData]) => {
    // Überspringe Dateien die nicht ausgewählt sind
    if (!STATE.selectedFiles.has(filename)) {
      return;
    }
    
    const edits = STATE.userEdits[filename] || {};  // Falls keine Edits: leeres Objekt
    
    const audience = edits.audience || originalData.audience || '';
    const mediaType = originalData.media_type || '';
    
    // Bestimme Zielverzeichnis basierend auf Audience + MediaType
    const pathKey = resolvePathKeyFromAudience(audience, mediaType);
    const path = pathKey && CONFIG.paths && CONFIG.paths[pathKey] ? CONFIG.paths[pathKey] : '';
    
    // Extrahiere Dateiendung (z.B. ".mp4", ".mkv") und entferne Leerzeichen davor
    const fileExtension = filename.substring(filename.lastIndexOf('.')).trim() || '';
    
    // Merge: Original-Daten + User-Edits + Pfad-Information
    const fileData = {
      originalName: filename,
      fileExtension: fileExtension,  // z.B. ".mp4", ".mkv" (OHNE Leerzeichen davor)
      path: path,                     // z.B. "/media/Serien/Erwachsene/"
      audience: audience,
      mediaType: mediaType,
      jellyfin_name: (edits.jellyfin_name || originalData.jellyfin_name || '').trim(),  // Entferne Leerzeichen vor/nach
      season: edits.season !== undefined ? edits.season : originalData.season,
      episode: edits.episode !== undefined ? edits.episode : originalData.episode,
      series_name: (edits.series_name || originalData.series_name || '').trim(),  // Auch hier trimmen
      sessionId: STATE.sessionId
    };
    
    filesWithCompleteData.push(fileData);
    validFiles++;
    
    logDebug(`   ✓ ${filename}: [${pathKey}] ${fileData.jellyfin_name || fileData.mediaType}`, 'data');
  });
  
  logDebug(`📋 Daten vorbereitet: ${validFiles} valid, ${invalidFiles} invalid`, 'info');
  
  try {
    const finalizeUrl = `${CONFIG.api.n8nBaseUrl}${CONFIG.api.endpoints.finalize}`;
    
    // Sende für jede Datei einen separaten Request
    logDebug(`🔗 Sende ${validFiles} Finalisierungs-Requests an: ${finalizeUrl}`, 'info');
    
    let successCount = 0;
    let errorCount = 0;
    const erroredFiles = [];
    
    // Prozessiere jede Datei einzeln
    for (const fileData of filesWithCompleteData) {
      try {
        const response = await fetch(finalizeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fileData)
        });
        
        logDebug(`   📨 ${fileData.originalName}: HTTP ${response.status}`, response.ok ? 'success' : 'warning');
        
        if (!response.ok) {
          const errorText = await response.text();
          logDebug(`      ❌ Error: ${errorText.substring(0, 100)}`, 'error');
          erroredFiles.push(fileData.originalName);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        logDebug(`   ❌ ${fileData.originalName}: ${error.message}`, 'error');
        erroredFiles.push(fileData.originalName);
        errorCount++;
      }
      
      // Kleine Verzögerung zwischen Requests um Server nicht zu überlasten
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    logDebug(`✅ Finalisierung abgeschlossen: ${successCount}/${validFiles} erfolgreich`, 'success');
    
    // Behandle Ergebnis
    handleFinalizeResult({ 
      success: successCount,
      total: validFiles,
      files: erroredFiles 
    });
    
  } catch (error) {
    logDebug(`❌ Fehler beim Finalisieren: ${error}`, 'error');
    logDebug(`📍 Stack: ${error.stack}`, 'error');
    
    alert(`Fehler: ${error.message}`);
  }
}

/**
 * handleFinalizeResult(result)
 * Server gibt Array mit fehlgeschlagenen Dateinamen zurück
 * 
 * Expected Result-Format:
 * {
 *   "files": ["Episode 1.mp4", "Episode 2.mp4"]
 * }
 * 
 * oder einfach:
 * { "files": [] }  // Alle erfolgreich!
 */
function handleFinalizeResult(result) {
  const failedFiles = result.files || [];
  const allEditedFiles = Object.keys(STATE.userEdits);
  const successfulFiles = allEditedFiles.filter(f => !failedFiles.includes(f));
  
  logDebug(`📊 Finalisierung abgeschlossen:`, 'info');
  logDebug(`   ✅ Erfolg: ${successfulFiles.length} Datei(en)`, 'success');
  logDebug(`   ❌ Fehler: ${failedFiles.length} Datei(en)`, failedFiles.length > 0 ? 'error' : 'info');
  
  if (failedFiles.length === 0) {
    // Alle erfolgreich - App zurücksetzen und Seite neuladen
    logDebug(`✅ Alle Dateien erfolgreich verarbeitet!`, 'success');
    alert('✅ Alle Dateien erfolgreich verarbeitet! Die Seite wird jetzt neu geladen...');
    resetApp();
    
    // Warte kurz bevor Seite neu geladen wird (damit resetApp() noch läuft)
    setTimeout(() => {
      logDebug(`🔄 Seite wird neu geladen...`, 'info');
      location.reload();
    }, 1500);
  } else {
    // Zeige fehlergeschlagene Dateien zur manuellen Bearbeitung
    logDebug(`⚠️ ${failedFiles.length} Datei(en) konnten nicht verarbeitet werden`, 'warning');
    showFailedFilesForRetry(failedFiles);
  }
}

/**
 * showFailedFilesForRetry(failedFiles)
 * Zeigt fehlgeschlagene Dateien in der Analysis-Sektion zur manuellen Bearbeitung
 */
function showFailedFilesForRetry(failedFiles) {
  // Erstelle Dialog mit Info
  const modalHtml = `
    <div class="modal-overlay" onclick="this.remove()">
      <div class="modal-dialog" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>⚠️ Dateien konnten nicht verarbeitet werden</h3>
          <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        
        <div class="modal-body">
          <p style="color: #6b7280; margin-bottom: 16px;">
            Die folgenden ${failedFiles.length} Datei(en) konnten nicht verarbeitet werden. Sie werden jetzt zur manuellen Bearbeitung angezeigt.
          </p>
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
            <strong>💡 Tipp:</strong> Überprüfen Sie die Metadaten, bearbeiten Sie falls nötig und versuchen Sie es erneut.
          </div>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; max-height: 300px; overflow-y: auto;">
            ${failedFiles.map(f => `<div style="padding: 8px; border-bottom: 1px solid #e5e7eb;">📄 ${escapeHtml(f)}</div>`).join('')}
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" onclick="resetApp(); this.closest('.modal-overlay').remove();">
            ← Zurück zum Upload
          </button>
          <button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); showFailedFilesInAnalysis(['${failedFiles.join("','")}']);">
            ✏️ Zur Bearbeitung
          </button>
        </div>
      </div>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.innerHTML = modalHtml;
  document.body.appendChild(overlay.firstElementChild);
  
  logDebug(`🔴 Dialog angezeigt - Benutzer kann Dateien zur Bearbeitung hinzufügen`, 'warning');
}

/**
 * showFailedFilesInAnalysis(failedFiles)
 * Filtert die Analyse-Sektion um nur fehlergeschlagene Dateien zu zeigen
 * Der User kann diese dann bearbeiten und erneut versuchen
 */
function showFailedFilesInAnalysis(failedFiles) {
  if (!failedFiles || failedFiles.length === 0) {
    return;
  }
  
  // Filtere analysisResults um nur fehlergeschlagene Dateien zu zeigen
  const filteredResults = {};
  failedFiles.forEach(filename => {
    if (STATE.analysisResults[filename]) {
      filteredResults[filename] = STATE.analysisResults[filename];
    }
  });
  
  // Aktualisiere analysisResults
  STATE.analysisResults = filteredResults;
  
  // Filtere userEdits um nur fehlergeschlagene Dateien zu behalten
  const filteredEdits = {};
  failedFiles.forEach(filename => {
    if (STATE.userEdits[filename]) {
      filteredEdits[filename] = STATE.userEdits[filename];
    }
  });
  STATE.userEdits = filteredEdits;
  
  logDebug(`🔄 Zeige ${failedFiles.length} fehlergeschlagene Datei(en) zur Bearbeitung`, 'info');
  
  // Zeige Analysis-Sektion
  DOM.uploadSection.style.display = 'none';
  DOM.analysisSection.style.display = 'block';
  
  // Rendere die Ergebnisse neu
  displayAnalysisResults();
  
  // Scrolla zur Analysis-Sektion
  setTimeout(() => {
    DOM.analysisSection.scrollIntoView({ behavior: 'smooth' });
  }, 100);
  
  // Zeige Info-Banner
  const bannerHtml = `
    <div id="retryBanner" style="
      background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 6px;
      color: #78350f;
    ">
      <strong>♻️ Erneuter Versuch:</strong> ${failedFiles.length} Datei(en) werden erneut verarbeitet. 
      Überprüfen Sie die Metadaten und klicken Sie auf "Fertigstellen" um erneut zu versuchen.
      <button onclick="document.getElementById('retryBanner')?.remove()" style="float: right; background: none; border: none; color: #78350f; cursor: pointer; font-size: 1.2rem;">✕</button>
    </div>
  `;
  
  DOM.categorizedList.insertAdjacentHTML('beforebegin', bannerHtml);
}

/**
 * resetApp()
 * Setzt die komplette Anwendung auf Initialzustand zurück
 * 
 * Was wird zurückgesetzt:
 *   - Neue SessionId generieren
 *   - Alle Upload-Einträge leeren
 *   - Analyse-Ergebnisse löschen
 *   - Temp-Dateiliste leeren
 *   - User-Edits auf {} setzen
 *   - Selected-Files leeren
 *   - UI Sichtbarkeit: Upload-Section sichtbar, Analysis-Section versteckt
 *   - Buttons deaktivieren bis neue Dateien hochgeladen
 */
function resetApp() {
  STATE = {
    sessionId: generateSessionId(),
    uploadedFiles: [],
    analysisResults: {},
    tempFilesList: [],
    userEdits: {},
    selectedFiles: new Set()  // Leere alle ausgewählten Dateien
  };
  
  DOM.uploadList.innerHTML = '';
  DOM.categorizedList.innerHTML = '';
  DOM.uploadSection.style.display = 'block';
  DOM.analysisSection.style.display = 'none';
  DOM.analyzeFilesBtn.disabled = true;
  DOM.fileInput.value = '';
  
  logDebug('App zurückgesetzt', 'info');
}

/* ================================
   UTILITIES
================================ */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ================================
   INITIALIZATION
================================ */
document.addEventListener('DOMContentLoaded', async () => {
  logDebug('=== DOMContentLoaded ===', 'info');
  
  // 1. ZUERST: Config aus app.json laden (MUSS WARTEN!)
  // KRITISCH: initUploadSystem() braucht CONFIG.upload um korrekt zu arbeiten!
  await loadConfig();
  logDebug('✓ Config aus app.json geladen', 'config');
  
  // 2. Init debug
  initDebugMode();
  
  // 3. After config load: Update debug UI (NUR wenn Debug aktiviert!)
  if (DEBUG_ENABLED) {
    populateDebugEndpoints();
    updateDebugUrlEnvironment();
    logDebug('✓ Debug-UI mit Config aktualisiert', 'success');
  }
  
  // 4. Init DOM
  initDOM();
  
  // 5. Generate Session
  generateSessionId();
  
  // 6. JETZT: Upload-System mit vollständiger Config initialisieren
  // CONFIG.upload ist jetzt aus app.json geladen!
  initUploadSystem();
  initNavigation();
  
  logDebug('✓ Alle Systeme online', 'success');
});

async function loadConfig() {
  try {
    const response = await fetch('app.json');
    if (response.ok) {
      const json = await response.json();
      CONFIG = { ...CONFIG, ...json };
      console.log('Config geladen:', CONFIG);
      logDebug('✅ Config aus app.json geladen', 'config');
      return true;
    }
  } catch (error) {
    console.warn('app.json nicht gefunden, verwende Defaults');
    logDebug('⚠️ Config-Fehler, verwende Defaults', 'warning');
  }
  return false;
}
