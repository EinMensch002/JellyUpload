# JellyUpload v4.5 — Release Notes

Veröffentlicht: **25. Februar 2026**

## 🎯 Kurzfassung

Komplettes Überhaul mit Debug-System Verbesserungen, OVA/Special-Episode Support und N8N-Integration. Debug ist jetzt über `app.json` konfigurierbar, OVA-Episoden werden standardisiert als `season: -1, episode: ""` verarbeitet.

**Highlights:**
- ✅ **OVA/Special Episode Support** (Frontend + N8N + AI Cluster)
- ✅ Konfigurierbare Debug-Kontrolle via `app.json`
- ✅ Konsolidierte Log-Erfassung (IMMER gespeichert)
- ✅ 🐛-Button nur sichtbar wenn Debug aktiviert
- ✅ Exportierbare Dateiendungs-Konfiguration (50+ Formate)
- ✅ N8N Server V2.0 & AI Cluster V1.1.5 Integration
- ✅ 6 Bug Fixes + 5 neue Features
- ✅ Keine Breaking Changes

## 📚 Detaillierte Dokumentation

👉 **Blog-Dokumentation:** [blog/v4.5](../../blog/v4.5)

- [README.md](../../blog/v4.5/README.md) — Komplett Feature-Übersicht
- [CHANGELOG.md](../../blog/v4.5/CHANGELOG.md) — Technische Details
- [RELEASE_SUMMARY.md](../../blog/v4.5/RELEASE_SUMMARY.md) — Executive Summary
- [TECHNICAL_CHANGES.md](../../blog/v4.5/TECHNICAL_CHANGES.md) — Code-Level Änderungen

## 🔧 Was ist neu?

### 1. **OVA/Special-Episode Integration** (NEW)

```json
{
  "season": -1,
  "episode": "",
  "jellyfin_name": "Serienname OVA"
}
```

**Features:**
- Automatische OVA/Special Erkennung
- N8N Server V2.0 Support
- AI Cluster V1.1.5 Verarbeitung
- Frontend Visual Distinction (CSS)
- Jellyfin-konforme Formatierung

**Auch enthalten:**
- `serverbackend V2.2.json` — N8N Server mit OVA-Support
- `serverbackend aicluster V1.1.5.json` — AI Cluster mit OVA-Verarbeitung
- `N8N_ANALYSIS_PROMPT_V4.4.md` — Updated Analysis Prompt

### 2. **Konfigurierbare Debug-Kontrolle**

```json
{
  "debug": {
    "enabled": false,        // Hauptschalter
    "allowUrlOverride": true // Erlaubt ?debug=true
  }
}
```

### 2. **Verbesserte Logs**

- IMMER alle Logs gespeichert
- Expandable Details-Objekte
- Farbcodierung nach Log-Typ

### 3. **Exportierbare Dateiendungs-Konfiguration**

```json
{
  "fileExtensions": {
    "video": {
      "common": [".mp4", ".avi", ".mkv", ".mov", ".webm", ".flv", ".wmv", ".m4v", ".3gp"],
      "streaming": [".ts", ".m2ts", ".mts", ".m3u8"],
      "dvdBluray": [".vob", ".m2v"],
      "apple": [".m4v", ".mov"],
      "other": [".ogv", ".asf", ".rm", ".rmvb", ".divx", "..."]
    }
  }
}
```

**Features:**
- 50+ Video-Formate in 5 Kategorien
- Zentral verwaltbar in `app.json`
- Keine Code-Änderungen für neue Formate nötig
- Einfaches Hinzufügen/Entfernen von Extensions

### 4. **Ressourcenoptimiert**

- 🐛-Button nur wenn aktiviert
- Debug-UI nicht geladen bei `enabled=false`
- ~130KB Einsparungen in Produktionsumgebungen

## 📋 Enthalten

- ✅ `app.js` (v4.5 — Debug-System überarbeitet + OVA Support)
- ✅ `app.json` (v4.5 — Debug Config + File Extensions)
- ✅ `index.html` (v4.5)
- ✅ `style.css` (v4.5 — OVA Episode Styling)
- ✅ `N8N_ANALYSIS_PROMPT_V4.4.md` (Analysis Prompt mit OVA-Regeln)
- `serverbackend V2.2.json` (N8N Server mit OVA-Support)
- ✅ `serverbackend aicluster V1.1.5.json` (AI Cluster mit OVA-Verarbeitung)
- ✅ `CHANGELOG.md` (Dieses Release — Haupt-Dokumentation)
- ✅ `RELEASE_NOTES.md` (Diese Datei)

## 🚀 Installation

```bash
# Option 1: Komplett ersetzen
cp -r releases/v4.5/* /var/www/jellyupload/

# Option 2: Selektive Dateien
cp releases/v4.5/app.js /var/www/jellyupload/
cp releases/v4.5/app.json /var/www/jellyupload/
```

## 🔄 Konfigurationsbeispiele

### Produktiv (no debug)
```json
{
  "debug": {
    "enabled": false,
    "allowUrlOverride": false
  }
}
```
→ Debug komplett deaktiviert ✅

### Development (debug active)
```json
{
  "debug": {
    "enabled": true,
    "allowUrlOverride": true
  }
}
```
→ Debug IMMER aktiv ✅

### Optional (troubleshooting)
```json
{
  "debug": {
    "enabled": false,
    "allowUrlOverride": true
  }
}
```
→ Mit `?debug=true` aktivierbar ✅

## 🔗 Repository

- **GitHub:** https://github.com/EinMensch002/JellyUpload
- **Hauptdokumentation:** [README.md](../../README.md)
- **Changelog:** [CHANGELOG.md](../../CHANGELOG.md)

## ✅ Kompatibilität

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (mit Polyfills)

## 📊 Changelog (Kurzfassung)

### Neue Features
- Konfigurierbare Debug-Kontrolle
- Verbesserte Log-Erfassung
- Bedingte UI-Renderung

### Bug Fixes
- Debug-Button war immer sichtbar
- Logs wurden nicht richtig gespeichert
- DEBUG_ENABLED wurde vor CONFIG-Load gesetzt
- Debug-UI wurde immer erstellt

### Breaking Changes
- ❌ **KEINE** — 100% backwards-compatible

---

**Status:** ✅ Production Ready  
**Lizenz:** Public Domain  

Für Support und Issues: [GitHub](https://github.com/EinMensch002/JellyUpload)
