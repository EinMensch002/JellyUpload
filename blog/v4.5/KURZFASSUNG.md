# JellyUpload v4.5 — Kurzfassung

Veröffentlicht: 25. Februar 2026

Kurz: Komplett Debug-System Überhaul + OVA/Special-Episode Integration. N8N Server V2.2 & AI Cluster V1.1.5 mit vollständigem OVA-Support.

Details: https://github.com/EinMensch002/JellyUpload/blob/main/blog/v4.5/CHANGELOG.md

Enthalten: `app.js`, `app.json`, `index.html`, `style.css`, `serverbackend V2.2.json`, `serverbackend aicluster V1.1.5.json`

## Changelog (aus blog/v4.5)

### 🎬 OVA/Special-Episode Integration
- Automatische OVA/Special Erkennung via N8N AI Cluster
- `season: -1` und `episode: ""` (leer) statt "OVA"/"Special" Werte
- Frontend Visual Distinction mit CSS-Styling
- Jellyfin-konforme Formatierung

### 🔍 Debug-System Überhaul
- Konfigurierbare Debug-Kontrolle via `app.json`
- Konsolidierte Log-Erfassung (IMMER gespeichert)
- 🐛-Button nur sichtbar wenn Debug aktiviert
- Exportierbare Dateiendungs-Konfiguration (50+ Formate)

### 📦 Server Integration
- N8N Server V2.2 mit OVA-Support
- AI Cluster V1.1.5 mit verbesserter Metadaten-Verarbeitung
- Vollständige Backup-Dokumentation

### 🐛 Bug Fixes
- OVA/Special schreiben keine unsauberen Werte mehr
- Debug-Button war immer sichtbar → Fixed
- Logs werden jetzt konsistent gespeichert
- VIDEO-Formate sind jetzt zentral konfigurierbar
