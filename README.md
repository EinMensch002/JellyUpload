# 🎬 JellyUpload

> **Intelligente Mediaverwaltung für Jellyfin** — Automatisierte Datei-Upload- und Metadaten-Verwaltung mit KI-gestützter Analyse

[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com)
[![Version: 4.4](https://img.shields.io/badge/Version-4.4-blue)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ Features

- 📤 **Datei-Upload** — Drag & Drop oder klassischer File-Dialog
- 🤖 **KI-Analyse** — Automatische Erkennung von Serien, Filmen, Metadaten (Staffel, Episode, FSK)
- 🏷️ **Intelligente Benennung** — Jellyfin-kompatible Namen nach Standard
- 🎯 **Kategorisierung** — Sortierung in Serien/Erwachsene, Serien/Kinder, Filme/Erwachsene, Filme/Kinder
- ✏️ **Flexible Anpassung** — Manuelle Bearbeitung vor Upload ohne Neustart
- 📊 **Debug-Panel** — Endpoint-Tester für Troubleshooting
- 🔒 **Session-Management** — Persistente Session-IDs für Tracking
- 🎨 **Modern UI** — Responsives Interface mit Live-Feedback

### Unterstützte Formate
**50+ Video-Formate** einschließlich: `.mp4` `.mkv` `.avi` `.mov` `.webm` `.flv` `.ts` `.vob` `.m2ts` und weitere

## 🚀 Quick Start

### Installation

#### 1. **Projekt klonen**
```bash
git clone https://github.com/yourusername/JellyUpload.git
cd JellyUpload
```

#### 2. **Dateistruktur erkennen**
```
JellyUpload/
├── src/                    # Aktive Version
│   ├── app.js             # Hauptlogik
│   ├── app.json           # Konfiguration
│   ├── index.html         # UI
│   └── style.css          # Styling
├── releases/              # Backups älterer Versionen
└── README.md              # Diese Datei
```

#### 3. **Konfigurieren (app.json)**
```json
{
  "api": {
    "n8nBaseUrl": "https://your-n8n-server:5678/webhook/jellyupload",
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

#### 4. **Starten**
```bash
# Lokal mit Python
python -m http.server 8000

# Oder npm
npm install http-server
npx http-server -p 8000
```

Öffne: `http://localhost:8000/src/index.html`

## 📋 Workflow

### 1️⃣ Upload
- Datei(en) hochladen via Drag & Drop oder Datei-Dialog
- Server prüft: Existiert die Datei bereits?
  - Falls Ja: Benutzer wählt (Überschreiben oder Umbenennen)
  - Falls Nein: Direkt hochladen
- Progress-Bar zeigt Upload-Geschwindigkeit und Fortschritt

### 2️⃣ Analyse
- Temp-Ordner-Dateien anzeigen mit Checkboxen
- Benutzer wählt Dateien aus
- KI analysiert automatisch: Titel, Typ, Staffel, Episode, FSK
- Suggestions generiert (alternative Namen)

### 3️⃣ Kategorisierung & Bearbeitung
- Gruppierung nach Serien und Filmen
- Für Serien:
  - Staffel/Episode automatisch erkannt
  - Serie wechselbar oder neue Series erstellbar
  - Bulk-Edit für FSK/Zielgruppe über alle Episoden
- Für Filme: Titel, FSK, Zielgruppe (Erwachsene/Kinder)
- Nicht erkannte Dateien: Manuell klassifizieren
- Checkboxen: Einzelne Dateien abwählen vor Finalisierung

### 4️⃣ Finalisierung
- NUR ausgewählte Dateien werden gesendet
- POST an `/finalize` mit komplettem Metadata:
  - Original-Dateiname + Erweiterung
  - Jellyfin-Name (z.B. "One Piece S01 E01")
  - Media-Type, Staffel, Episode
  - FSK, Zielgruppe (adults/kids)
  - Session-ID für Tracking
- Server speichert in richtige Verzeichnisse
- Seite auto-reload nach erfolgreicher Fertigstellung

## 🔌 API-Endpunkte

| Endpoint | Methode | Datei | Beschreibung |
|----------|---------|-------|-------------|
| `/check-exists` | POST | ✅ Erforderlich | Prüfung ob Datei existiert |
| `/upload` | POST | ✅ Erforderlich | Datei hochladen |
| `/list` | POST | ❌ Optional | Temp-Ordner auflisten |
| `/analyse` | POST | ❌ Optional | KI-Analyse starten |
| `/finalize` | POST | ✅ Erforderlich | Finale Speicherung |

### Request/Response Struktur

Detaillierte API-Dokumentation siehe: [API_ENDPOINTS.md](API_ENDPOINTS.md)

## ⚙️ Konfiguration

### Debug-Mode aktivieren
```
http://localhost:8000/src/index.html?debug=true
```

Features im Debug-Mode:
- 🐛 Umfangreiche Logs mit JSON-Details
- 🧪 Endpoint-Tester (Test/Production Umgebung)
- 📊 Test-Verlauf & Response-Analyse
- 📥 Log-Export als .txt

### Gerätespezifische Einstellungen
```json
{
  "upload": {
    "enabled": true,           // Upload global aktivieren
    "disableChromeOS": true   // Upload auf Chrome OS deaktivieren
  }
}
```

## 🐛 Troubleshooting

### ❌ Upload funktioniert nicht
```
💡 Häufige Ursachen:
1. Android erkannt: FormData-Bug → Upload deaktiviert
2. Chrome OS + disableChromeOS=true → Upload deaktiviert  
3. upload.enabled=false in app.json
4. CORS-Fehler: N8N Server sendet keine Access-Control-* Header

✅ Lösung:
• Verwende Desktop/Laptop
• Überprüfe CORS-Konfiguration in N8N
• Aktiviere Upload in app.json
```

### ❌ Analyse schlägt fehl
```
💡 Häufige Ursachen:
1. N8N Webhook ist offline
2. KI/AI-Service nicht erreichbar
3. FTP/SFTP Zugang zu /media/temp fehlt
4. Workflow-Nodes nicht konfiguriert

✅ Lösung:
• Überprüfe Debug-Panel für genaue Fehler
• Teste N8N Webhook direkt: curl -X POST https://...
• Aktiviere Debug-Mode (?debug=true) für Logs
```

### ❌ Dateiendung wird falsch erkannt
```
💡 Problem (< v4.4):
"Arcane S01E01 S.to.mp4" → "Arcane S01E01 S.to" ❌

✅ Lösung (v4.4+):
Intelligente Erkennung aller 50+ Video-Formate
→ Erkennt .mp4 korrekt, ignoriert .to URL-Suffix
→ Ergebnis: "Arcane S01E01" ✅
```

## 📊 Datenfluss zur Finalisierung

Die Anwendung sendet folgende Struktur an `/finalize`:

```javascript
{
  "originalName": "Arcane S01E01 S.to.mp4",     // Original-Dateiname
  "fileExtension": ".mp4",                       // Erkannte Endung
  "path": "/media/Serien/Erwachsene/",          // Zielpath
  "audience": "adults",                         // Zielgruppe
  "mediaType": "series",                         // series|movie
  "jellyfin_name": "Arcane S01 E01",            // Jellyfin-Standard-Name
  "season": 1,                                   // (nur für Serien)
  "episode": 1,                                  // (nur für Serien)
  "series_name": "Arcane",                       // (nur für Serien)
  "fsk": "16",                                   // FSK-Einstufung
  "sessionId": "session-1234567890-abc123"       // Tracking-ID
}
```

## 🎨 Direkt-Import

Die Dateien sind **sofort produktionsbereit**. Kopiere den `src/`-Ordner in deine Webserver-VirtualHost:

```bash
# z.B. für Apache/nginx
cp -r src/* /var/www/jellyupload/
```

## 📈 Version History

| Version | Datum | Hauptfeatures |
|---------|-------|---------------|
| **4.4** | Feb 2026 | 🔧 Dateiendungs-Fix, 50+ Format-Support |
| **4.3** | Jan 2026 | 📺 Serie Management erweitert |
| **4.2** | Jan 2026 | ⚡ Live UI-Updates |
| **4.1** | Jan 2026 | 🐛 Edit Persistence & Path-Routing |
| **4.0** | Jan 2026 | ✨ Datei-Abwahl System, Logging |

Vollständige Changelog: [CHANGELOG.md](CHANGELOG.md)

## 🔐 Sicherheit

- ✅ Session-IDs für Request-Tracking
- ✅ CORS-Support (konfigurierbar in N8N)
- ✅ Keine sensiblen Daten in Browser-Logs
- ⚠️ Client-Side Validierung nur für UX (Server-Validierung erforderlich!)

## 📞 Support & Kontakt

- 🐛 **Issues**: [GitHub Issues](https://github.com)
- 💬 **Diskussionen**: [GitHub Discussions](https://github.com)

## 📄 Lizenz

**Dieses Projekt ist lizenzfrei und Public Domain.** Sie können es verwenden, modifizieren und verteilen ohne Einschränkungen.

---

**Made with ❤️ for Jellyfin Media Management**
