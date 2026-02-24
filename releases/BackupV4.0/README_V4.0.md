# 📁 Jellyfin Media Sortierung v4.0
## Vollständige Dokumentation & Setup Guide

**Status:** ✅ Stable Release  
**Version:** 4.0  
**Datum:** 28. Januar 2026

---

## 🎯 Überblick

Die **Jellyfin Media Sortierung v4.0** ist eine vollständig überarbeitete Web-Anwendung zur automatisierten Analyse und Sortierung von Mediendateien.

### Kernfunktionalität
- 📤 **Upload:** Drag & Drop oder aus Temp-Ordner
- 🔍 **Analyse:** AI-basierte Erkennung von Serien/Filme + Metadaten
- ✏️ **Bearbeitung:** Manuelle Anpassung vor Finalisierung
- ☑️ **Auswahl:** Neue Funktion - Dateien vor Upload deselektieren
- 🚀 **Finalisierung:** Automatische Organisierung in Zielverzeichnisse

---

## ✨ Was ist neu in v4.0?

### Major Features
1. **☑️ Datei-Abwahl System** - Dateien vor Finalisierung auswählen/abwählen
2. **📊 Zwei-Stufen Logging** - Normale + detaillierte Debug-Logs
3. **📄 File Extension** - Dateiendungen werden separat verarbeitet
4. **🔄 Auto-Reload** - Seite lädt nach erfolgreicher Finalisierung automatisch neu
5. **🐛 Verbesserte Debug-UI** - Logs immer sichtbar, expandbare Details

### Bug Fixes
- ✅ Kritischer Bug: "Keine Daten werden gesendet" - BEHOBEN
- ✅ Log-System funktioniert ohne `?debug=true` Parameter
- ✅ Formatierungsprobleme behoben
- ✅ Whitespace-Handling verbessert

---

## 🏗️ Systemarchitektur

```
┌─────────────────────────────────────────────────────┐
│          Web Browser (Client-Side)                  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Jellyfin Media Sortierung v4.0               │  │
│  │  - app.js (3647 Zeilen)                       │  │
│  │  - style.css (2456 Zeilen)                    │  │
│  │  - index.html                                 │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                     ↓ HTTP/HTTPS ↓
┌─────────────────────────────────────────────────────┐
│        N8N Automation Platform (Server-Side)       │
│  ┌──────────────────────────────────────────────┐  │
│  │  Webhook Listener                             │  │
│  ├─ /upload (Datei-Upload + Existenzprüfung)   │  │
│  ├─ /list (Temp-Ordner auflisten)              │  │
│  ├─ /analyse (AI-basierte Erkennung)           │  │
│  └─ /finalize (Organisierung & Speicherung)    │  │
│  ┌──────────────────────────────────────────────┐  │
│  │  AI-Cluster Integration (v1.1.5)              │  │
│  ├─ Dateianalyse                                │  │
│  ├─ Datenbank-Cache                            │  │
│  └─ Tokens-Optimierung                         │  │
│  ┌──────────────────────────────────────────────┐  │
│  │  Dateisystem                                  │  │
│  ├─ /media/temp (Upload-Staging)               │  │
│  ├─ /media/Serien/Erwachsene/                  │  │
│  ├─ /media/Serien/Kinder/                      │  │
│  ├─ /media/Filme/Erwachsene/                   │  │
│  └─ /media/Filme/Kinder/                       │  │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Voraussetzungen

### Hardware
- Server mit min. 2GB RAM
- Ausreichend Speicherplatz für Mediendateien
- Stabile Internetverbindung

### Software
- ✅ Node.js 14+ (für N8N)
- ✅ N8N 0.180+
- ✅ Browser mit ES6+ Support:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

### Netzwerk
- Port 5678 (N8N) erreichbar
- Port 80/443 (HTTPS) für Web-UI
- Firewall konfiguriert für lokale/externe Zugriffe

---

## 🚀 Installation

### 1. Dateien kopieren

```bash
# Aus BackupV4.0 Ordner
cp -r BackupV4.0/* /var/www/media-ui/

# Oder einzeln
cp BackupV4.0/app.js /var/www/media-ui/
cp BackupV4.0/app.json /var/www/media-ui/
cp BackupV4.0/style.css /var/www/media-ui/
cp BackupV4.0/index.html /var/www/media-ui/
```

### 2. Konfiguration anpassen (`app.json`)

```json
{
  "version": "4.0",
  "api": {
    "n8nBaseUrl": "https://deine-ip-oder-domain:5678/webhook/jellyupload",
    "endpoints": {
      "checkExists": "/check-exists",
      "upload": "/upload",
      "list": "/list",
      "analyse": "/analyse",
      "finalize": "/finalize"
    }
  },
  "paths": {
    "SE": "/media/Serien/Erwachsene/",
    "SK": "/media/Serien/Kinder/",
    "FE": "/media/Filme/Erwachsene/",
    "FK": "/media/Filme/Kinder/"
  }
}
```

### 3. Verzeichnisse erstellen

```bash
mkdir -p /media/{Serien,Filme}/{Erwachsene,Kinder}
mkdir -p /media/temp
chmod 755 /media/{Serien,Filme}/{Erwachsene,Kinder}
chmod 777 /media/temp
```

### 4. N8N Workflows importieren

```bash
# Workflow 1: Basic Backend (serverbackend V2.0.json)
# Workflow 2: AI-Integration (serverbackend aicluster V1.1.5.json)

# N8N UI → Import → JSON-Datei wählen
```

### 5. Web-Server konfigurieren

```nginx
# Nginx Example
location /media-ui {
    alias /var/www/media-ui;
    try_files $uri $uri/ =404;
}
```

---

## 📖 Verwendungsanleitung

### Normale Nutzung
1. Öffne `https://your-domain/media-ui`
2. Folge dem Schritt-für-Schritt Wizard
3. Siehe `QUICKSTART.md` für detaillierte Anleitung

### Advanced Features

#### Debug-Mode aktivieren
```
https://your-domain/media-ui?debug=true
```

**Zeigt:**
- Detaillierte Logs mit JSON-Daten
- Expandbare Debug-Informationen
- Console.group() in DevTools
- Test-Panel für API-Calls

#### Debug-Panel (immer verfügbar)
- 🐛-Button unten rechts klicken
- Logs ansehen/exportieren
- SessionId kopieren
- Manuelle API-Tests

---

## 🔧 Konfiguration

### `app.json` - Wichtige Settings

```javascript
{
  "version": "4.0",
  
  "debug": {
    "enabled": false,
    "allowUrlOverride": true  // ?debug=true erlauben
  },
  
  "paths": {
    "SE": "/media/Serien/Erwachsene/",  // Serie + Erwachsene
    "SK": "/media/Serien/Kinder/",      // Serie + Kinder
    "FE": "/media/Filme/Erwachsene/",   // Film + Erwachsene
    "FK": "/media/Filme/Kinder/"        // Film + Kinder
  },
  
  "api": {
    "n8nBaseUrl": "https://192.168.178.145:5678/webhook/jellyupload",
    "n8nBaseUrlTest": "https://192.168.178.145:5678/webhook-test/jellyupload",
    "endpoints": {
      "checkExists": "/check-exists",
      "upload": "/upload",
      "list": "/list",
      "analyse": "/analyse",
      "finalize": "/finalize"
    }
  },
  
  "upload": {
    "enabled": true,
    "disableChromeOS": true  // ChromeBook-Workaround
  }
}
```

### `app.js` - Wichtige Konstanten

```javascript
const DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debug') === 'true';

const CONFIG = {
  version: '4.0',
  // ... geladen aus app.json
};

const STATE = {
  sessionId: '',                // Eindeutige Session
  uploadedFiles: [],           // Hochgeladene Dateien
  analysisResults: {},         // AI-Analyse-Ergebnisse
  tempFilesList: [],          // Dateien im temp-Ordner
  userEdits: {},              // Benutzer-Bearbeitungen
  selectedFiles: new Set()    // ← NEU: Ausgewählte Dateien
};
```

---

## 📊 API Endpoints

### 1. `/check-exists` (POST)
**Prüft ob Datei bereits existiert**

Request:
```json
{
  "filename": "Episode 1.mp4",
  "sessionId": "session-12345"
}
```

Response:
```json
{
  "exists": true,
  "path": "/media/temp/Episode 1.mp4"
}
```

### 2. `/upload` (POST)
**Lädt Datei hoch**

Request: FormData
- file: Binary
- sessionId: string
- filename: string
- overwrite: boolean

Response:
```json
{
  "success": true,
  "filename": "Episode 1.mp4",
  "path": "/media/temp/Episode 1.mp4"
}
```

### 3. `/list` (POST)
**Listet temp-Ordner auf**

Request:
```json
{
  "sessionId": "session-12345"
}
```

Response:
```json
{
  "files": ["Episode 1.mp4", "Episode 2.mp4", ...]
}
```

### 4. `/analyse` (POST)
**Analysiert Dateien mit AI**

Request:
```json
{
  "files": ["Episode 1", "Episode 2"],        // OHNE Endung!
  "originalFiles": ["Episode 1.mp4", ...],   // Mit Endung
  "sessionId": "session-12345"
}
```

Response:
```json
{
  "output": [
    {
      "original_name": "Episode 1",
      "media_type": "series",
      "series_name": "One Piece",
      "season": 1,
      "episode": 1,
      "jellyfin_name": "One Piece S1 E1",
      "audience": "adults",
      "fsk": 12,
      "suggestions": ["Suggestion 1|Suggestion 2"]
    }
  ]
}
```

### 5. `/finalize` (POST)
**Organisiert Dateien in Zielverzeichnisse**

Request (für jede Datei einzeln):
```json
{
  "originalName": "Episode 1.mp4",
  "fileExtension": ".mp4",
  "path": "/media/Serien/Erwachsene/",
  "audience": "adults",
  "mediaType": "series",
  "jellyfin_name": "One Piece S1 E1",
  "season": 1,
  "episode": 1,
  "series_name": "One Piece(2025)",
  "sessionId": "session-12345"
}
```

Response:
```json
{
  "success": true,
  "message": "Datei organisiert",
  "newPath": "/media/Serien/Erwachsene/One Piece S1 E1.mp4"
}
```

---

## 🐛 Debugging & Troubleshooting

### Debug-Logs aktivieren

**Option 1: URL-Parameter**
```
https://your-domain/media-ui?debug=true
```

**Option 2: Lokal öffnen**
```javascript
// Browser Console
localStorage.setItem('debug', 'true');
location.reload();
```

### Häufige Fehler

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| "Network Error" | N8N nicht erreichbar | N8N Server starten, IP prüfen |
| "Path-Key nicht gefunden" | Falsche app.json | Paths überprüfen, SE/SK/FE/FK |
| "Keine Daten gesendet" | Dateien nicht ausgewählt | Mindestens 1 Checkbox ☑️ |
| "AI-Analyse fehlgeschlagen" | Server-Problem | Logs im Debug-Panel prüfen |

### Console-Output prüfen

```javascript
// Browser Dev Tools: F12 → Console
// Grüne Logs = Success
// Rote Logs = Error
// Blaue Logs = Info
```

---

## 📈 Performance Tips

### Optimale Konfiguration
- **Max. Dateien pro Session:** 50-100
- **Recommend Upload-Größe:** < 5GB pro Batch
- **AI-Analyse Verzögerung:** 100ms zwischen Requests
- **Auto-Reload Verzögerung:** 1500ms nach Finalisierung

### Speicher-Optimierung
- Logs regelmäßig löschen (🐛 → Clear)
- Cache leeren (Browser F12 → Application → Clear)
- Session abschließen (nach Finalisierung)

---

## 🔐 Sicherheit

### Empfehlungen
- ✅ HTTPS verwenden (nicht HTTP!)
- ✅ N8N mit Authentifizierung absichern
- ✅ Firewall: Port 5678 nur intern erlauben
- ✅ Sessions mit Timeout (z.B. 1 Stunde)
- ✅ CORS-Header richtig konfigurieren

### Input-Validierung
- Dateinamen werden escaped (XSS-Schutz)
- Dateiendungen werden validiert
- Pfade werden überprüft

---

## 🚀 Deployment

### Development
```bash
# Lokal testen (mit einfachem HTTP Server)
cd /var/www/media-ui
python3 -m http.server 8000
# Öffne http://localhost:8000
```

### Production
```bash
# Mit Nginx + SSL
# Siehe Nginx-Config oben

# Mit Apache
# Siehe .htaccess konfigurieren
```

### Docker (Optional)
```dockerfile
FROM nginx:latest
COPY . /var/www/media-ui
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
```

---

## 📚 Dateien in diesem Backup

```
BackupV4.0/
├── app.js                              # Hauptanwendung
├── app.json                            # Konfiguration
├── style.css                           # Styling
├── index.html                          # HTML-Struktur
├── serverbackend V2.0.json             # N8N Workflow
├── serverbackend aicluster V1.1.5.json # AI-Integration
├── CHANGELOG_V4.0.md                   # Diese Datei
├── QUICKSTART.md                       # Schnelleinstieg
└── README_V4.0.md                      # Vollständige Doku
```

---

## 🔄 Update von älteren Versionen

### Von v3.x zu v4.0

1. **Backup erstellen**
   ```bash
   cp -r /var/www/media-ui /var/www/media-ui.backup.v3.x
   ```

2. **Neue Dateien kopieren**
   ```bash
   cp BackupV4.0/{app.js,style.css} /var/www/media-ui/
   ```

3. **app.json überprüfen** (sollte kompatibel sein)

4. **Browser-Cache leeren**
   ```
   F12 → Application → Clear All
   ```

5. **Seite neu laden**
   ```
   F5 oder Ctrl+Shift+R
   ```

**Keine Datenmigrationen nötig!** ✅

---

## 💬 FAQ

### F: Welche N8N Version wird benötigt?
**A:** Mindestens v0.180, empfohlen v1.0+

### F: Kann ich alte Dateien löschen?
**A:** Ja, aus /media/temp nach erfolgreicher Finalisierung

### F: Wie viele Dateien kann ich gleichzeitig hochladen?
**A:** Theoretisch unbegrenzt, praktisch: 50-100 empfohlen

### F: Werden Dateien duplifiziert?
**A:** Nein, mit "Overwrite" wird überschrieben, ohne "Overwrite" umbenannt

### F: Kann ich die Session speichern?
**A:** SessionId ist im Debug-Panel sichtbar, aber nicht für Wiederverwendung vorgesehen

### F: Support für Subtitles/Posters?
**A:** Nein, nur Media-Dateien, Custom-Fields sind möglich

---

## 🎓 Weitere Ressourcen

- **Jellyfin Dokumentation:** https://jellyfin.org/docs/
- **N8N Dokumentation:** https://docs.n8n.io/
- **JavaScript Referenz:** https://developer.mozilla.org/

---

## 📝 Lizenz & Credits

**Jellyfin Media Sortierung v4.0**  
- Vollständig überarbeitet Januar 2026
- Basierend auf v3.9 Fundament
- Optimiert für Jellyfin + N8N

---

## 📞 Support

### Debug-Information sammeln
```javascript
// 1. Debug-Panel öffnen (🐛-Button)
// 2. "Export Logs" klicken
// 3. JSON-Datei speichern
// 4. SessionId notieren
// 5. Browser-Console (F12) auch speichern
```

### Fragen/Probleme?
- Schau `QUICKSTART.md` für Anfänger
- Aktiviere Debug-Mode für detaillierte Logs
- Schau N8N Workflow-Logs
- Prüfe app.json Konfiguration

---

**Version 4.0 ist bereit für produktiven Einsatz! ✅**

*Viel Erfolg mit Jellyfin Media Sortierung v4.0!*
