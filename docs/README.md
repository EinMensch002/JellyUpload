# 📚 Dokumentation

Vollständige technische Dokumentation für JellyUpload v4.5.

## 📑 Inhaltsverzeichnis

### Core Dokumentation
- [BACKUPS.md](BACKUPS.md) — Server Backups & Konfigurationen
  - N8N Server Configuration (V2.0)
  - AI Cluster Backup (V1.1.5)
  - OVA/Special Support
  - Recovery & Restore Anleitung

### Hauptprojekt-Referenzenz
- [../README.md](../README.md) — Allgemeine Projektübersicht
- [../CHANGELOG.md](../CHANGELOG.md) — Kompletter Versionsverlauf
- [../API_ENDPOINTS.md](../API_ENDPOINTS.md) — API-Referenz

### Version-Dokumentation (blog/)
- [blog/v4.5](../blog/v4.5) — Aktuelle Version mit OVA-Integration
- [blog/v4.4](../blog/v4.4) — Dateiendungs-Erkennungs-Überhaul
- [blog/v4.3](../blog/v4.3) — Series Management Features
- [blog/v4.2](../blog/v4.2) — UI-Fixes & Dokumentation
- [blog/v4.1](../blog/v4.1) — Edit Persistence
- [blog/v4.0](../blog/v4.0) — Initial Release

### Release-Pakete
- [releases/v4.5](../releases/v4.5) — Aktuelle Production Version
- [releases/v4.4](../releases/v4.4) — Stabile Version mit 50+ Formate
- [releases/v4.3](../releases/v4.3) — Series Management Version
- [releases/v4.2](../releases/v4.2) — UI-Enhanced Version
- [releases/v4.1](../releases/v4.1) — Persistence Version
- [releases/v4.0](../releases/v4.0) — Initial Release

### Source Code
- [../src/app.js](../src/app.js) — Frontend Logik (4476 Zeilen)
- [../src/index.html](../src/index.html) — HTML Structure
- [../src/style.css](../src/style.css) — CSS Styling
- [../src/app.json](../src/app.json) — Konfigurationsdatei
- [../src/N8N_ANALYSIS_PROMPT_V4.4.md](../src/N8N_ANALYSIS_PROMPT_V4.4.md) — AI Analysis Prompt

---

## 🚀 Quick Start

### Für Endnutzer
1. Lese [../README.md](../README.md) für Überblick
2. Folge Installation & Setup
3. Bei Problemen: Siehe Troubleshooting

### Für Entwickler
1. Siehe [../src/README.md](../src/README.md) für Code-Struktur
2. Siehe [../CHANGELOG.md](../CHANGELOG.md) für Änderungen
3. Siehe [BACKUPS.md](BACKUPS.md) für Server-Setup

### Für DevOps
1. Siehe [BACKUPS.md](BACKUPS.md) für Backups
2. Siehe [../API_ENDPOINTS.md](../API_ENDPOINTS.md) für API Setup
3. Recovery-Anleitungen in [BACKUPS.md](BACKUPS.md)

---

## 📌 Key Features in v4.5

- ✅ **OVA/Special Episodes** — Vollständige Integration
  - N8N Server Support
  - AI Cluster Verarbeitung
  - Frontend Markierung
  
- ✅ **Debug System** — Erweiterte Fehlerbehandlung
  - Konfigurierbar via app.json
  - URL-Parameter Unterstützung
  - Detaillierte Log-Erfassung

- ✅ **50+ Video-Formate** — Umfassende Unterstützung
  - Streaming-Seiten (.to, .la, .net)
  - DVD/Blu-ray (.vob, .m2v)
  - Apple Formate (.mov, .m4v)

---

## 🔄 Update-Procedure

```bash
# 1. Backup aktuell (optional)
cp releases/v4.5/* backup/

# 2. Neue Version deployen
cp src/* /var/www/jellyupload/

# 3. Konfiguration überprüfen
cat app.json | grep -E "version|debug"

# 4. N8N Server Update
curl -X POST http://n8n-server:5678/api/v1/workflows/import \
  -d @"serverbackend V2.2.json"

# 5. AI Cluster Update
docker restart aicluster
curl -X POST http://aicluster:8080/api/v1/config/import \
  -d @"serverbackend aicluster V1.1.5.json"
```

---

## 🆘 Support & Kontakt

- **Fehler melden:** Siehe [../README.md#support](../README.md#-support)
- **Fragen stellen:** GitHub Discussions
- **Dokumentation:** Dieses Verzeichnis
- **Version Anfragen:** Siehe [../CHANGELOG.md](../CHANGELOG.md)

---

## 📊 Dateistruktur

```
JellyUpload/
├── docs/                          # 📚 Diese Dokumentation
│   ├── BACKUPS.md                # Server Backups
│   └── README.md                 # Dies hier
├── blog/                          # 📝 Version-Dokumentation
│   ├── v4.5/                     # Aktuelle Dokumentation
│   ├── v4.4/                     # Dateiendungs-Fix Docs
│   └── ...
├── releases/                      # 📦 Release-Pakete
│   ├── v4.5/                     # Production
│   │   ├── app.js
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── app.json
│   │   ├── serverbackend V2.2.json
│   │   ├── serverbackend aicluster V1.1.5.json
│   │   └── RELEASE_NOTES.md
│   └── ...
├── src/                          # 💻 Source Code
│   ├── app.js                    # 4476 Zeilen Logik
│   ├── index.html
│   ├── style.css
│   ├── app.json
│   ├── N8N_ANALYSIS_PROMPT_V4.4.md
│   └── README.md
├── README.md                     # 🎬 Hauptdoku
├── CHANGELOG.md                  # 📋 Version History
└── API_ENDPOINTS.md              # 🔌 API-Referenz
```

---

**Zuletzt aktualisiert:** 2026-02-25  
**Version:** 4.5  
**Dokumentations-Status:** ✅ Up-to-Date
