# Changelog — v4.5

Veröffentlicht: **25. Februar 2026**

## 🔧 Debug-System Überhaul

### ✨ Neue Features

#### 1. **Konfigurierbare Debug-Kontrolle**
- Debug-Modus über `app.json` konfigurierbar: `debug.enabled`
- URL-Parameter Unterstützung: `?debug=true` (wenn `allowUrlOverride: true`)
- Debug-Panel bei Produktionsumgebungen vollständig ausblendbar

#### 2. **Exportierbare Dateiendungs-Konfiguration** ✨ NEU
- 50+ Video-Formate zentral in `fileExtensions` konfigurierbar
- Strukturierte Kategorien:
  - `common`: .mp4, .avi, .mkv, .mov, .webm, .flv, .wmv, .m4v, .3gp
  - `streaming`: .ts, .m2ts, .mts, .m3u8
  - `dvdBluray`: .vob, .m2v
  - `apple`: .m4v, .mov
  - `other`: .ogv, .asf, .rm, .rmvb, .divx, .dv, .f4v, .f4p, .f4a, .f4b, .mxf, .wtv, .ogg, .ogm, .mpg, .mpeg, .mpe, .m1v, .tp, .trp
- Keine Code-Änderungen nötig für neue Formate
- Einfaches Hinzufügen/Entfernen via Config

#### 3. **Verbesserte Log-Erfassung**
- IMMER alle Logs speichern, unabhängig von Konfiguration
- Expandable Details-Objekte im Debug-Panel
- Ordnungsgemäße Fehlerdetails in JSON-Format

#### 3. **Bedingte UI-Renderung**
- 🐛-Button nur sichtbar wenn Debug aktiviert
- Debug-UI wird nur erstellt wenn `DEBUG_ENABLED = true`
- Spart Ressourcen in Produktionsumgebungen

### 🔧 Technische Verbesserungen

#### Debug Aktivierungsprioritäten
```javascript
DEBUG_ENABLED = CONFIG.debug.enabled OR (allowUrlOverride AND ?debug=true)
```

**Neue Initialisierungssequenz:**
1. `loadConfig()` — Konfiguration laden
2. `initDebugMode()` — DEBUG_ENABLED berechnen
3. Weitere Systeme initialisieren

#### Konsistente Funktionssignauren
```javascript
logDebug(message, type, details)
logInfo(message, details)
logSuccess(message, details)
logError(message, details)
```

### 🐛 Fixed Issues

- [#DEBUG-001] Debug-Button war immer sichtbar
- [#DEBUG-002] Logs wurden nicht korrekt gespeichert wenn `?debug=true` nicht in URL
- [#DEBUG-003] `detailedLogs` Array wurde nicht richtig geleert
- [#DEBUG-004] `DEBUG_ENABLED` wurde vor `CONFIG.load()` gesetzt
- [#DEBUG-005] Debug-UI wurde auch bei deaktiviertem Debug erstellt
- [#CONFIG-001] Video-Formate waren hardcoded → Jetzt in `fileExtensions` Config

### 📊 Konfigurationsbeispiele

**Produktiv (kein Debug):**
```json
{
  "debug": {
    "enabled": false,
    "allowUrlOverride": false
  }
}
```

**Development (Debug aktiviert):**
```json
{
  "debug": {
    "enabled": true,
    "allowUrlOverride": true
  }
}
```

**Optional Debug (via URL):**
```json
{
  "debug": {
    "enabled": false,
    "allowUrlOverride": true
  }
}
```
→ Aktivierbar mit: `?debug=true`

### 🎯 Use Cases

#### Use Case 1: Produktionsserver
```
Config: enabled=false, allowUrlOverride=false
→ Debug komplett deaktiviert
→ Keine Debug-UI sichtbar
→ Maximale Performance
```

#### Use Case 2: Development
```
Config: enabled=true, allowUrlOverride=true
→ Debug IMMER aktiv
→ Detaillierte Logs in Console
→ Debug-Panel immer verfügbar
```

#### Use Case 3: Emergency Debugging
```
Config: enabled=false, allowUrlOverride=true
Normal: http://localhost/index.html → Kein Debug
Emergency: http://localhost/index.html?debug=true → Debug aktiv
```

### 📝 Breaking Changes

❌ **Keine Breaking Changes!**

- Bestehender API bleibt identisch
- Bestehender Code funktioniert ohne Änderungen
- Nur interne Initialisierung ändert sich

### 🚀 Performance Impact

- **Positiv:** Debug-UI wird nicht erstellt wenn deaktiviert (spart ~50KB)
- **Neutral:** Log-Speicherung hat minimal Impact (< 1KB pro 100 Log-Einträge)
- **Optimiert:** Detaillierte Console-Ausgabe nur im DEBUG-Mode

---

**Für vollständige Dokumentation siehe:** [README v4.5](README.md)
