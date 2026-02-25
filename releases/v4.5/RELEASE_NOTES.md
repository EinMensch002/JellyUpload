# JellyUpload v4.5 — Release Notes

Veröffentlicht: **25. Februar 2026**

## 🎯 Kurzfassung

Komplettes Debug-System Überhaul mit verbesserter Kontrollierbarkeit, konsolidierter Log-Erfassung und ressourceneffizienten UI-Rendering. Debug ist jetzt über `app.json` konfigurierbar und nur sichtbar wenn aktiviert.

**Highlights:**
- ✅ Konfigurierbare Debug-Kontrolle via `app.json`
- ✅ Konsolidierte Log-Erfassung (IMMER gespeichert)
- ✅ 🐛-Button nur sichtbar wenn Debug aktiviert
- ✅ Exportierbare Dateiendungs-Konfiguration (50+ Formate)
- ✅ 5 Bug Fixes + 4 neue Features
- ✅ Keine Breaking Changes

## 📚 Detaillierte Dokumentation

👉 **Blog-Dokumentation:** [blog/v4.5](../../blog/v4.5)

- [README.md](../../blog/v4.5/README.md) — Komplett Feature-Übersicht
- [CHANGELOG.md](../../blog/v4.5/CHANGELOG.md) — Technische Details
- [RELEASE_SUMMARY.md](../../blog/v4.5/RELEASE_SUMMARY.md) — Executive Summary
- [TECHNICAL_CHANGES.md](../../blog/v4.5/TECHNICAL_CHANGES.md) — Code-Level Änderungen

## 🔧 Was ist neu?

### 1. **Konfigurierbare Debug-Kontrolle**

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

- ✅ `app.js` (v4.5 — Debug-System überarbeitet)
- ✅ `app.json` (v4.5 — Debug Config hinzugefügt)
- ✅ `index.html` (unverändert)
- ✅ `style.css` (unverändert)
- ✅ `CHANGELOG.md` (Dieses Release)
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
