# 🎬 JellyUpload

> **Intelligente Mediaverwaltung für Jellyfin** — Automatisierte Datei-Upload- und Metadaten-Verwaltung mit KI-gestützter Analyse

[![Statu4s: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com)
[![Version: 4.5](https://img.shields.io/badge/Version-4.5-blue)](https://github.com)

## ✨ Kernfeatures
 
| Feature | Beschreibung |
|---------|-------------|
| 📤 **Upload** | Drag & Drop oder File-Dialog |
| 🤖 **KI-Analyse** | Automatische Erkennung (Genre, FSK, Staffel/Episode) |
| 🏷️ **Auto-Benennung** | Jellyfin-Standard Format |
| 🎯 **Kategorisierung** | Serien/Filme × Erwachsene/Kinder |
| ✏️ **Flexible Bearbeitung** | Vor-Upload Anpassung möglich |
| 📊 **Debug-Tools** | Endpoint-Tester & Log-Export |
| 🎨 **Modern UI** | Responsive Design mit Live-Feedback |

**Unterstützte Formate:** 50+ Video-Formate (.mp4, .mkv, .avi, .mov, .webm, .flv, .ts, .vob, .m2ts…)

## 🚀 Installation & Setup

### 1. Projekt klonen
```bash
git clone https://github.com/EinMensch002/JellyUpload.git
cd JellyUpload
```

### 2. Konfigurieren (app.json)
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

### 3. Starten
```bash
python -m http.server 8000
# oder: npm install http-server && npx http-server -p 8000
```

Öffnen Sie: `http://localhost:8000/src/index.html`

## 📋 Workflow

### 🔄 Ablauf

1️⃣ **Upload**
- Datei hochladen via Drag & Drop  
- System prüft: Existiert die Datei bereits?
- Optional: Überschreiben oder mit neuem Namen speichern

2️⃣ **Analyse**
- KI analysiert Dateien automatisch
- Erkannt: Titel, Typ (Serie/Film), Staffel, Episode, FSK

3️⃣ **Bearbeitung**
- Manuell anpassen möglich
- Zielgruppe wählen (Erwachsene/Kinder)
- Nicht erkannte Dateien klassifizieren
- Checkboxen: Einzelne Dateien abwählen

4️⃣ **Finalisierung**
- POST an `/finalize` mit komplettem Metadata
- Dateien aus Temp-Ordner in richtige Verzeichnisse verschieben
- Auto-Reload nach erfolgreichem Abschluss

### 📤 Finalisierungs-Payload
```javascript
{
  "originalName": "Arcane S01E01 S.to.mp4",          // Original-Dateiname
  "fileExtension": ".mp4",                            // Erkannte Erweiterung
  "path": "/media/Serien/Erwachsene/",               // Zielverzeichnis
  "audience": "adults",                               // Zielgruppe
  "mediaType": "series",                              // series|movie
  "jellyfin_name": "Arcane S01 E01",                 // Jellyfin-Standard
  "season": 1,                                        // Staffel (nur Serien)
  "episode": 1,                                       // Episode (nur Serien)
  "series_name": "Arcane",                           // Serienname (nur Serien)
  "fsk": "16",                                        // FSK-Einstufung
  "sessionId": "session-1234567890-abc123"           // Tracking-ID
}
```

## 🔌 API-Endpunkte

| Endpoint | Methode | Datei | Beschreibung |
|----------|---------|-------|-------------|
| `/check-exists` | POST | ✅ | Existiert Datei bereits? |
| `/upload` | POST | ✅ | Datei hochladen |
| `/list` | POST | ❌ | Temp-Ordner auflisten |
| `/analyse` | POST | ❌ | KI-Analyse starten |
| `/finalize` | POST | ❌ | Speichern & verschieben |

Vollständige API-Dokumentation: [API_ENDPOINTS.md](API_ENDPOINTS.md)  
Backup & Server-Konfigurationen: [docs/BACKUPS.md](docs/BACKUPS.md)

## 🐛 Troubleshooting & Debug

### Upload funktioniert nicht?

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Auf Android | FormData-Bug | Desktop/Laptop verwenden |
| Auf Chrome OS | `disableChromeOS: true` | Einstellung ändern oder anderes Gerät |
| Upload deaktiviert | `upload.enabled: false` | In app.json aktivieren |
| CORS-Fehler | N8N fehlende Header | CORS-Konfiguration in N8N prüfen |

### Analyse schlägt fehl?
- **N8N Webhook offline?** → Direkt testen: `curl -X POST https://...`
- **KI-Service nicht erreichbar?** → Backend-Logs prüfen
- **Keine Zugriffe auf /media/temp?** → FTP/SFTP-Berechtigungen kontrollieren
- **Detaillierte Fehler?** → Debug-Mode aktivieren: `?debug=true`

### Dateiendung falsch erkannt? (v4.4+)
✅ **Gelöst:** Intelligente Erkennung für 50+ Video-Formate  
Beispiel: "Arcane S01E01 S.to.mp4" → "Arcane S01 E01" ✓

## ⚙️ Erweiterte Konfiguration

### Debug-Mode aktivieren
```
http://localhost:8000/src/index.html?debug=true
```

**Enthält:** JSON-Logs • Endpoint-Tester • Response-Analyse • Log-Export

### Session-Management
```json
{
  "upload": {
    "enabled": true,
    "disableChromeOS": true
  }
}
```

## 📦 Direkt-Deployment

Die `src/`-Dateien sind **sofort einsatzbereit**:
```bash
cp -r src/* /var/www/jellyupload/  # Apache/nginx
```

## 📈 Version History

| Version | Datum | Features |
|---------|-------|----------|
| **4.5** | Feb 2026 | OVA/Special-Support, Debug-System Überhaul, N8N/AI Cluster Integration |
| **4.4** | Feb 2026 | Dateiendungs-Fix, 50+ Formate, URL-Suffix Handling |
| **4.3** | Jan 2026 | Series Management erweitert |
| **4.2** | Jan 2026 | Live UI-Updates |
| **4.1** | Jan 2026 | Edit Persistence & Path-Routing |
| **4.0** | Jan 2026 | Datei-Abwahl System |

→ [Vollständiger CHANGELOG](CHANGELOG.md)  
→ [v4.5 Dokumentation](blog/v4.5)

## 🔐 Sicherheit

- ✅ Session-IDs für Request-Tracking
- ✅ CORS-Support (konfigurierbar)
- ✅ Keine sensiblen Daten in Browser-Logs
- ⚠️ Server-seitige Validierung erforderlich!

## 📞 Support

- [GitHub Issues](https://github.com)
- [GitHub Discussions](https://github.com)

## 📄 Lizenz

**Public Domain** - Frei verwendbar, modifizierbar und weitergabefähig.