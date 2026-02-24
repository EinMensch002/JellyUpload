# 🎬 JellyUpload

Automatisierte Datei-Upload-Plattform mit KI-gestützter Metadaten-Analyse für Jellyfin.

---

## 🎯 Was kann JellyUpload?

- 📤 **Datei-Upload** - Mehrere Dateien gleichzeitig hochladen
- 🔍 **Automatische Analyse** - N8N erkennt Titel, Serie, Episode, FSK automatisch
- 🏷️ **Jellyfin-Format** - Optimale Benennungskonventionen wird automatisch erzeugt
- ✏️ **Media-Editor** - Bearbeite Metadaten direkt im Browser
- 🎬 **Serie-Management** - Verschiebe Episoden zwischen Serien, bearbeite Staffeln
- ✅ **Smart File Handling** - 50+ Video-Formate + URL-Suffix-Support (.to, .la, etc.)

---

## 🚀 Quick Start

### 1. Installation
```bash
# Repo clonen
git clone <repo-url>
cd jellyupload

# Im Browser öffnen
open index.html
# oder mit lokalem Server:
python -m http.server 8000
```

### 2. N8N konfigurieren

Öffne `app.json` und setze deine N8N-URLs:

```json
{
  "api": {
    "n8nBaseUrl": "https://deine-n8n-url:5678/webhook/jellyupload",
    "n8nBaseUrlTest": "https://deine-n8n-url:5678/webhook-test/jellyupload"
  }
}
```

### 3. Dateien hochladen

1. App öffnen → **Upload-Button**
2. Dateien wählen (unterstützt: `.mp4`, `.mkv`, `.avi`, `.webm` etc.)
3. N8N analysiert automatisch
4. Im Editor prüfen & speichern

---

## 📡 API Endpoints

Alle Requests gehen via N8N Webhook. Die App testet Endpoints über das **Debug-Panel** (🐛-Button).

### 1. `check-exists` - Datei-Existenzprüfung

**Request:**
```json
{
  "filename": "Arcane S01E01.mkv",
  "sessionId": "abc123"
}
```

**Response:**
```json
{
  "exists": false,
  "path": "/media/Serien/Erwachsene/Arcane/Season 1/",
  "message": "Datei existiert nicht"
}
```

---

### 2. `upload` - Datei hochladen

**Request:**
```json
{
  "filename": "Arcane S01E01.to.mkv",
  "fileContent": "base64encoded...",
  "originalName": "Arcane S01E01",
  "sessionId": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "path": "/media/Serien/Erwachsene/Arcane/",
  "file": "Arcane S01E01.mkv"
}
```

---

### 3. `analyse` - Metadaten-Analyse

**Request:**
```json
{
  "originalFiles": ["Arcane S01E01.mkv", "Show.watch.mp4"],
  "sessionId": "abc123"
}
```

**Response:**
```json
[
  {
    "original_name": "Arcane S01E01",
    "media_type": "series",
    "series_name": "Arcane",
    "jellyfin_name": "Arcane S01E01",
    "season": 1,
    "episode": 1,
    "audience": "adults",
    "fsk": 12,
    "status": "success"
  }
]
```

---

### 4. `list` - Dateien auflisten

**Request:**
```json
{
  "path": "/media/Serien/Erwachsene/",
  "sessionId": "abc123"
}
```

**Response:**
```json
{
  "files": ["Arcane/", "Breaking Bad/"],
  "count": 2
}
```

---

### 5. `finalize` - Verarbeitung abschließen

**Request:**
```json
{
  "sessionId": "abc123",
  "finalizeData": {
    "processed": 2,
    "failed": 0
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verarbeitung abgeschlossen"
}
```

---

## ⚙️ Konfiguration (app.json)

```json
{
  "version": "4.4",
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
  "paths": {
    "SE": "/media/Serien/Erwachsene/",
    "SK": "/media/Serien/Kinder/",
    "FE": "/media/Filme/Erwachsene/",
    "FK": "/media/Filme/Kinder/"
  }
}
```

**Parameter:**
- `n8nBaseUrl` - Production URL
- `n8nBaseUrlTest` - Test-URL zum Debuggen
- `paths` - Zielverzeichnisse pro Kategorie

---

## 📁 Projektstruktur

```
jellyupload/
├── app.js              # Hauptanwendung (4,189 Zeilen)
├── app.json            # Konfiguration (N8N URLs, Pfade)
├── index.html          # UI Layout
├── style.css           # Styling
└── README.md           # Diese Datei
```

---

## 🎓 Best Practices

### Dateiendungen
Unterstützte Video-Formate sind automatisch definiert:
```
.mp4, .mkv, .avi, .mov, .webm, .flv, .wmv, .m4v, .3gp,
.ts, .m2ts, .mts, .m3u8, .vob, .m2v, .ogv, .asf, .rm, .rmvb,
.divx, .dv, .f4v, .mxf, .wtv, .ogg, .ogm, .mpg, .mpeg, .mpe
```

### URL-Suffixe
Dateien wie `Arcane S01E01.to.mkv` werden korrekt verarbeitet:
- Frontend + Backend erkennen `.mkv` als Video-Endung
- `.to` bleibt als Dateiname-Teil erhalten
- Kein Mapping-Fehler mehr ✓

### Debug-Modus
Nutze den **Debug-Button** (🐛) zum Testen einzelner Endpoints:
```
1. Klick auf 🐛-Button
2. Tab "Endpoint Tester" wählen
3. Endpoint + Parameter eingeben
4. Testen klicken
5. Response in Logs ansehen
```

---

## 📞 Dokumentation

- **N8N Setup:** `N8N_ANALYSIS_PROMPT_V4.4.md`
- **Dateiendungs-Fix:** `BackupV4.4/BUGFIX_FILEEXTENSION.md`

---

**Version 4.4** | Production Ready | Last Updated: Feb 2026

