# 🎬 JellyUpload v4.5 Dokumentation

Veröffentlicht: **25. Februar 2026**

> **Debug-System Überhaul** — Komplett überarbeitetes Logging und Konfigurationsmanagement

## 🎯 Highlights v4.5

### 🔧 Debug-System Rewrite

Das Debug-System wurde von Grund auf neu geschrieben für bessere Kontrollierbarkeit und Zuverlässigkeit:

- **Konfigurierbar über `app.json`**: `debug.enabled` und `debug.allowUrlOverride`
- **URL-Parameter Support**: `?debug=true` aktiviert Debug (wenn konfiguriert)
- **Konsistente Logs**: Alle Browser-Logs werden gespeichert und im Debug-Panel angezeigt
- **Detaillierte Fehlerbehandlung**: Umfassende Error-Details in expandbaren Logs
- **Bedingte UI-Anzeige**: 🐛-Button nur sichtbar wenn Debug aktiviert ist

### 📁 Exportierbare Dateiendungs-Konfiguration ✨

Ein großes neues Feature: Video-Formate sind nun zentral in `app.json` konfigurierbar:

```json
{
  "fileExtensions": {
    "video": {
      "common": [".mp4", ".avi", ".mkv", ".mov", ".webm", ".flv", ".wmv", ".m4v", ".3gp"],
      "streaming": [".ts", ".m2ts", ".mts", ".m3u8"],
      "dvdBluray": [".vob", ".m2v"],
      "apple": [".m4v", ".mov"],
      "other": [".ogv", ".asf", ".rm", ".rmvb", ".divx", ".dv", ".f4v", ...]
    }
  }
}
```

**Vorteile:**
- ✅ **50+ Video-Formate** in strukturierten Kategorien
- ✅ **Zentrale Verwaltung** — Kein Code-Änderungen für neue Formate nötig
- ✅ **Einfache Anpassung** — Formate einfach hinzufügen/entfernen via Config
- ✅ **Umgebungsspezifisch** — Verschiedene Konfigurationen pro Server möglich
- ✅ **Wartbar** — Alle Formate an zentraler Stelle dokumentiert

### 🔒 Konfigurationsoptionen

```json
{
  "debug": {
    "enabled": false,      // Hauptschalter für Debug-Modus
    "allowUrlOverride": true  // Erlaubt ?debug=true zum Überschreiben
  }
}
```

**Szenarien:**

| Szenario | `enabled` | `allowUrlOverride` | Result |
|----------|-----------|-------------------|--------|
| Debug immer aktiv | `true` | `true` | ✅ Debug IMMER an |
| Debug nur mit URL | `false` | `true` | ✅ Aktivierbar via `?debug=true` |
| Debug komplett deaktiviert | `false` | `false` | ❌ Debug NICHT möglich |

### 📝 Logging-Verbesserungen

#### 1. **Konsistente Log-Erfassung**
- Alle `logDebug()`, `logInfo()`, `logSuccess()`, `logError()` Aufrufe werden gespeichert
- Logs sind IMMER verfügbar, unabhängig von `DEBUG_ENABLED`

#### 2. **Expandable Details**
- Details-Objekte werden als JSON in expandbaren Log-Zeilen angezeigt
- Details werden nur im Debug-Modus detailliert in der Console ausgegeben

#### 3. **Farbcodierung**
- 🚀 System
- ℹ️ Info (blau)
- ✅ Success (grün)
- ❌ Error (rot)
- ⚠️ Warning (orange)
- 📤 Upload
- 🔍 Analyse
- 💾 Daten
- ⚙️ Config

### 🐛 Debug-Panel Features

#### Tabs

**1. 📋 Logs**
- Alle System-Logs mit Zeitstempel
- Clickable für expandbare Details
- Farbcodierte Log-Typen

**2. 🧪 Endpoint Tester**
- Server URL oder Custom URL wählen
- Test/Production Umgebung Switcher
- Endpoint-Selektor
- File Upload für POST-Requests
- JSON Request Body Editor
- Response Viewer
- Test-Verlauf

**3. ℹ️ Info**
- System-Informationen
- Config-Details
- Log-Export funktionalität
- Logs löschen

### 🎛️ Aktivierungsprioritäten

```
1. CONFIG.debug.enabled = true
   → Debug IMMER aktiv
   
2. CONFIG.debug.enabled = false + allowUrlOverride = true + ?debug=true
   → Debug AKTIV (nur mit URL-Parameter)
   
3. CONFIG.debug.enabled = false + allowUrlOverride = false
   → Debug NIEMALS aktiv (auch nicht mit URL)
   
4. Keine Config vorhanden
   → Default: debug.enabled = false, allowUrlOverride = true
```

### 📊 Neue Initialisierungssequenz

1. **Config laden** (`loadConfig()`)
2. **Debug-Modus initialisieren** (`initDebugMode()`)
   - DEBUG_ENABLED wird basierend auf Config gesetzt
   - Debug-UI wird nur erstellt wenn DEBUG_ENABLED = true
3. **Weitere Systeme initialisieren**

### 🔍 Console-Ausgabe

**Standard-Modus:**
```javascript
[14:44:06] ℹ️ Debug Mode: ✗ Deaktiviert
```

**Debug-Modus (mit Details):**
```javascript
[14:44:06] ✅ Debug Mode: ✓ URL (?debug=true)
  DETAILS:
  {
    enabled: true,
    configEnabled: false,
    urlParam: true,
    allowUrlOverride: true
  }
```

### 🚀 Beispiele

#### Szenario 1: Produktionsserver ohne Debug

```json
{
  "debug": {
    "enabled": false,
    "allowUrlOverride": false
  }
}
```

**Ergebnis:** 
- 🐛-Button ist nicht sichtbar
- Debug-Panel ist komplett deaktiviert
- Logs werden NICHT gespeichert

#### Szenario 2: Development mit aktiviertem Debug

```json
{
  "debug": {
    "enabled": true,
    "allowUrlOverride": true
  }
}
```

**Ergebnis:**
- 🐛-Button ist IMMER sichtbar
- Debug-Panel zeigt alle Logs
- URL-Parameter `?debug=true` ist optional

#### Szenario 3: Optional Debug (Troubleshooting)

```json
{
  "debug": {
    "enabled": false,
    "allowUrlOverride": true
  }
}
```

**Ergebnis:**
- Ohne `?debug=true`: 🐛-Button nicht sichtbar
- Mit `?debug=true`: Debug-Panel aktiv
- Ideal für zielgerichtetes Troubleshooting

## 🔄 Migration von v4.4 zu v4.5

### Was ändert sich?

1. **Debug-Button ist nicht mehr immer sichtbar**
   - Kontrolle über `app.json`
   - Deaktivierbar für Produktionsumgebungen

2. **Initialisierungssequenz**
   - Config muss vor Debug-Init geladen werden
   - `DEBUG_ENABLED` ist jetzt ein `let`, nicht `const`

3. **Logs sind zentralisiert**
   - Alle Logs werden in `debugLogs` array gespeichert
   - `logDebug()`, `logInfo()`, `logSuccess()`, `logError()` sind zentral

### Keine Breaking Changes!

- Bestehender Code funktioniert ohne Änderungen
- Nur interne Initialisierung ändert sich
- API für `logDebug()` bleibt identisch

## 📚 Weitere Dokumentation

- [CHANGELOG (Blog)](CHANGELOG.md) — Detaillierte technische Änderungen
- [Hauptdokumentation](../../README.md) — Allgemeine Infos
- [Hauptchangelog](../../CHANGELOG.md) — Alle Versionen

---

**Status:** ✅ Production Ready  
**Kompatibilität:** Chrome, Firefox, Safari, Edge (mit Polyfills)  
**Node.js:** 14.x+

