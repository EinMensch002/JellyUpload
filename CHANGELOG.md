# 📋 CHANGELOG

Alle wesentlichen Änderungen an diesem Projekt sind in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/) und folgt [Semantic Versioning](https://semver.org/).

---

## [4.5] - 2026-02-25

### 🎬 OVA/Special-Episode Integration (N8N & Frontend)

#### ✨ Neue Features

- **OVA/Special-Episode Unterstützung**:
  - N8N AI Cluster erkennt automatisch OVA und Special Episoden
  - Setzt `season: -1` und `episode: ""` (leer) für OVA/Special statt "OVA"/"Special" Werte
  - Konsistente Verarbeitung zwischen N8N AI Cluster und Frontend

- **Verbesserte Metadaten-Verarbeitung**:
  - N8N Server integriert OVA-Erkennung in der `N8N_ANALYSIS_PROMPT_V4.4p1`
  - AI Cluster verarbeitet Dateien korrekt ohne "OVA"/"Special" in den Feldern

#### 🔧 Technische Verbesserungen

- **Standardisierte OVA-Behandlung**:
  - Frontend (JavaScript): OVA-Episoden erhalten visual distinction
  - Backend (N8N): Setzt `-1` für season, leeren String für episode
  - Jellyfin-Kompatibilität durch standardisierte Werte

#### 📚 Neue Backups & Dokumentation

- `serverbackend V2.2.json` - N8N Server Konfiguration mit OVA-Support
- `serverbackend aicluster V1.1.5.json` - AI Cluster Backup mit aktualisierter Logik
- Vollständige Backup-Dokumentation: [docs/BACKUPS.md](docs/BACKUPS.md)

---

### 🔍 Debug-System Überhaul

#### ✨ Neue Features

- **Konfigurierbare Debug-Kontrolle** via `app.json`:
  - `debug.enabled`: Hauptschalter für Debug-Modus
  - `debug.allowUrlOverride`: Erlaubt `?debug=true` zum Überschreiben
  
- **Verbesserte Log-Erfassung**:
  - IMMER alle Logs speichern (unabhängig von Konfiguration)
  - Expandable Details-Objekte im Debug-Panel
  - Farbcodierung für verschiedene Log-Typen

- **Bedingte UI-Renderung**:
  - 🐛-Button nur sichtbar wenn Debug aktiviert
  - Debug-UI wird nicht beim Laden erstellt wenn deaktiviert
  - Ressourcensparend für Produktionsumgebungen

- **Exportierbare Dateiendungs-Konfiguration** (NEW):
  - 50+ Video-Formate zentral in `fileExtensions` Sektion
  - Strukturierte Kategorien: `common`, `streaming`, `dvdBluray`, `apple`, `other`
  - Keine Code-Änderungen für neue Formate nötig
  - Zentrale Verwaltung aller unterstützten Video-Extensions

#### 🔧 Technische Verbesserungen

- **Neue Initialisierungssequenz**:
  1. Config laden (`loadConfig()`)
  2. Debug-Modus initialisieren (`initDebugMode()`)
  3. Weitere Systeme initialisieren

- **Aktivierungsprioritäten**:
  ```javascript
  DEBUG_ENABLED = CONFIG.debug.enabled OR (CONFIG.debug.allowUrlOverride AND ?debug=true)
  ```

#### 🐛 Fixed Issues

- Debug-Button war immer sichtbar
- Logs wurden nicht korrekt gespeichert bei normalen Anfragen
- `DEBUG_ENABLED` wurde vor Config-Load gesetzt
- Debug-UI wurde auch bei deaktiviertem Debug erstellt
- Video-Formate waren hardcoded → Jetzt zentral in `fileExtensions` Config konfigurierbar

#### 📚 Dokumentation

- Ausführliche Dokumentation: [blog/v4.5](blog/v4.5)
- Konfigurationsbeispiele
- Use-Case Beschreibungen

**Keine Breaking Changes!** — Bestehender Code funktioniert ohne Änderungen.

---

## [4.4] - 2026-02-24

### 📝 Endpunkt-Korrektur
- Beim Upload ist eine Datei erforderlich (POST `/upload`)
- Beim Finalisieren (`/finalize`) werden nur Metadaten aus dem Temp-Ordner verschoben, es wird keine Datei mehr benötigt

### 🔧 Critical Bug Fix: Dateiendungs-Erkennung

**Problem:** Dateien mit URL-Suffixen (z.B. `Arcane S01E01 S.to.mp4`) wurden falsch verarbeitet.

```javascript
// VORHER (FALSCH):
"Arcane S01E01 S.to.mp4"
  → lastIndexOf('.') findet .mp4
  → Entfernt nur .mp4
  → Ergebnis: "Arcane S01E01 S.to" ❌ (FALSCH!)

// NACHHER (RICHTIG):
"Arcane S01E01 S.to.mp4"
  → Erkennt .mp4 als Video-Format
  → Entfernt .mp4 komplett
  → Prüft .to: IST KEINE Video-Endung → Behält .to
  → Findet letzten Punkt "S.to"
  → Schneidet beim Punkt ab
  → Ergebnis: "Arcane S01E01 S" ✅ (RICHTIG!)
```

#### ✨ Neue Features

- **50+ Video-Formate Support**: Umfassende Datenbank aller gängigen Video-Dateitypen
  - Häufige: `.mp4` `.mkv` `.avi` `.mov` `.webm` `.flv` `.wmv` `.m4v`
  - Streaming: `.ts` `.m2ts` `.mts` `.m3u8`
  - DVD/Blu-ray: `.vob` `.m2v`
  
- **Intelligente Endungs-Erkennung**: Unterstützt Dateien mit URL-Suffixen
  - ✅ `Filename.to.mp4` → `Filename` (ignoriert `.to`)
  - ✅ `Show.watch.mkv` → `Show` (ignoriert `.watch`)
  - ✅ `Movie.stream.avi` → `Movie` (ignoriert `.stream`)

#### 🔍 Technische Details

```javascript
// Neue removeFileExtension() Funktion
// 1. Prüfe ob Filename mit bekannter Video-Endung ENDET
// 2. Falls ja: Entferne diese Endung komplett
// 3. Falls nein: Nutze Fallback (letzter Punkt)
// 4. Fallback verhindert ".to" / ".la" / ".net" Fehler

Beispiel: removeFileExtension("Arcane S01E01 S.to.mp4")
  → endsWith('.mp4')? TRUE
  → return "Arcane S01E01 S.to"
  → Server: removeFileExtension("Arcane S01E01 S.to")
  → endsWith('.to')? FALSE (nicht in VideoExtensions)
  → lastIndexOf('.')? Found → "Arcane S01E01 S"
```

#### 🐛 Fixed Issues

- [#CRITICAL] Mapping-Fehler bei Serien mit URL-Suffixen
- [#HIGH] `.to` / `.la` / `.net` wurde als Dateiendung behandelt
- [#HIGH] Episode-Erkennung versagte bei "Movie.to.mkv" Auslösemustern

---

## [4.3] - 2026-01-29

### 🚀 Serie Management erweitert

#### ✨ Neue Features

##### 1. **Episode zwischen Serien verschieben** 📺↔️

**Problem:** One Piece 1999 und One Piece 2025 sind gemischt — kann ich sie nicht separieren?

**Lösung:** Neuer Serie-Dropdown im Episode-Editor
```javascript
Workflow:
1. [✎ Edit] auf Episode klicken
2. "Serie (zum Verschieben)" Dropdown nutzen
3. Andere Serie auswählen ODER "+ Neue Serie" Button
4. [✓ Speichern]
→ Episode wechselt zu neuem Reiter ✅
```

**Features:**
- ✅ Dropdown mit allen existierenden Serien
- ✅ "+ Neue Serie" Button direkt im Modal
- ✅ Automatische Jellyfin-Namen-Regeneration nach Wechsel
- ✅ Neue Reiter werden automatisch erstellt

##### 2. **Neue Serie im Editor erstellen** ✨

**Problem:** Ich kann keine neuen Serien erstellen ohne manuell alles zu tippen!

**Lösung:** Button **"+ Neue Serie"** neben dem Dropdown

```javascript
Workflow:
1. [✎ Edit] auf Episode klicken
2. "+ Neue Serie" Button klicken
3. Prompt: Serie-Namen eingeben (z.B. "One Piece (1999)")
4. Duplikat-Prüfung: Verhindert doppelte Einträge
5. Neue Serie wird sofort ausgewählt und aktiv
6. [✓ Speichern]
→ Neue Serie mit Episode erstellt ✅
```

#### 🔧 Technische Änderungen

- **editEpisodeModal()**: Serie-Dropdown mit dynamischen Optionen hinzugefügt
- **addNewSeriesInModal()**: Prompt-basierte Serie-Erstellung
- **saveEditModal()**: Serie-Wechsel erkannt und UI aktualisiert
- **displayAnalysisResults()**: Neue Reiter automatisch generiert

---

## [4.2] - 2026-01-28

### ⚡ UI Updates sofort sichtbar

#### 🎯 Das gelöste Problem

Änderungen wurden gespeichert aber NICHT angezeigt:
```
Benutzer-Aktion          State    UI-Anzeige
─────────────────────────────────────────────
Audience → "Kinder"      ✅ Gespeichert    ❌ Zeigt noch "Erwachsene"
Name editiert            ✅ Geändert       ❌ Zeigt alten Text
FSK → "16"               ✅ Gespeichert    ❌ Zeigt alten FSK
```

#### ✨ Neue Features

**updateFileUIAfterEdit()** — Sofortige UI-Aktualisierung ohne Page-Reload

```javascript
// Mergt Original-Daten + User-Edits
data = { ...originalData, ...userEdits }

// Updated einzelnes Element in der UI:
// 1. Name/Titel aktualisiert
// 2. FSK-Badge aktualisiert/erstellt
// 3. Audience-Icon wechselt (👶 ↔️ 👨)
// 4. Episode-Info aktualisiert (Staffel/Folge)
// Alles ohne Page-Reload! ⚡
```

#### 📊 Performance-Verbesserung

| Operation | Vorher | Nachher | Gewinn |
|-----------|--------|---------|--------|
| Alle 1000 Items neu rendern | 5-10s | - | - |
| Ein Item aktualisieren | - | 10-50ms | **100-500x schneller** |

#### 🔧 Technische Details

| Datei | Funktion | Änderung | Zeile |
|-------|----------|----------|-------|
| app.js | `updateFileUIAfterEdit()` | ➕ NEUE FUNKTION | ~3145 |
| app.js | `saveEditModal()` | ✏️ Ruft updateFileUIAfterEdit() auf | ~3120 |
| app.js | `saveSuggestion()` | ✏️ Nutzt updateFileUIAfterEdit() | ~3407 |

---

## [4.1] - 2026-01-27

### 🐛 Edit Persistence & Path Routing Fixes

#### 🔴 Behobene kritische Fehler

##### 1. **Edit Persistence Bug — Daten werden nicht gespeichert** 🚨

**Problem:**
```javascript
Benutzer ändert Episode:
  → Name: "One Piece E1" → gespeichert ✅ STATE.userEdits
  → FSK: "0" → NICHT gespeichert ❌ (leer!)
  → Audience: "kids" → NICHT gespeichert ❌ (undefined!)

Grund: saveEditModal() prüfte if (fskSelect?.value)
  → FSK-Wert war "0"
  → if ("0") → FALSE! (0 ist falsy in JavaScript)
  → Nicht gespeichert!
```

**Lösung:**
```javascript
// VORHER (Falsch):
if (fskSelect?.value) STATE.userEdits.fsk = fskSelect.value;  // "0" wird nicht gespeichert!

// NACHHER (Richtig):
if (fskSelect) STATE.userEdits.fsk = fskSelect.value;  // Prüfe auf Element, nicht auf Wert!
```

**Status:** ✅ **FIXED**

##### 2. **Audience-zu-Pfad Mapping Bug** 🔴

**Problem:**
```javascript
// Modals speichern: audience = "kids"
// Aber resolvePathKeyFromAudience() prüft: audience === "children"
// Resultat: "kids" wird nicht erkannt → Fehler!

Film mit audience="kids"
  → Funktion prüft: if (audience === 'children') { ... }
  → FALSE! (kids ≠ children)
  → Film wird zu FE (Filme/Erwachsene) statt FK ❌
```

**Lösung:**
```javascript
// Akzeptiere beide Varianten:
if (audience === 'children' || audience === 'kids') {
  audienceKey = 'K';  // Kids
}
```

**Status:** ✅ **FIXED**

#### ✨ Weitere Verbesserungen

- ✅ Redundante Audience-Auswahl bei Episoden entfernt
- ✅ Film-Edit-Funktionalität vervollständigt
- ✅ Alle manuellen Edits sind jetzt persistent

#### 📝 Betroffene Funktionen

| Funktion | Zeile | Änderung |
|----------|-------|----------|
| `saveEditModal()` | ~3110 | ✅ Fix: `if (element)` statt `if (element?.value)` |
| `editEpisodeModal()` | ~2660 | ✅ Audio-Dropdown entfernt |
| `resolvePathKeyFromAudience()` | ~3495 | ✅ 'kids' und 'children' akzeptiert |

---

## [4.0] - 2026-01-28

### ✨ Major Release: Benutzerfreundlichkeit & Debug

#### 🎯 Zusammenfassung

Version 4.0 ist eine **umfassende Überarbeitung** mit Fokus auf:
- **Benutzerfreundlichkeit**: Datei-Abwahl vor Finalisierung
- **Debug-Funktionalität**: Zwei-Stufen Logging System
- **Datenqualität**: Automatisches Trimming von Whitespace

#### ✨ Neue Features

##### 1. **Datei-Abwahl System** ⭐

**Problem:** Alle Dateien wurden automatisch finalisiert — keine Kontrolle über einzelne Items.

**Lösung:** Checkboxen zur Auswahl/Abwahl

```javascript
Struktur:
┌─────────────────────────────────────┐
│ 📺 One Piece (2025)         [✓]    │  Serie-Checkbox
├─────────────────────────────────────┤
│ [✓] S01 E01 ...                     │  Episode 1 (ausgewählt)
│ [✓] S01 E02 ...                     │  Episode 2 (ausgewählt)
│ [ ] S01 E03 ...                     │  Episode 3 (NICHT ausgewählt)
└─────────────────────────────────────┘

Finalisierung:
→ NUR ausgewählte Dateien werden gesendet!
→ Episode 3 wird nicht verarbeitet
```

**Features:**
- ✅ Checkbox neben Serienname (Ein-/Ausschalten aller Episoden)
- ✅ Checkbox neben jeder Episode/Film
- ✅ Serie-Checkbox synchronisiert mit Episoden-Checkboxen
- ✅ Standardeinstellung: Alle Dateien ausgewählt (nach Analyse)

##### 2. **Erweiterte Dateiinformationen**

- ✅ **fileExtension** — Wird mit zum Server gesendet (z.B. `.mp4`)
- ✅ **Whitespace-Trimming** — `jellyfin_name` und `series_name` automatisch bereinigt
- ✅ **Saubere Formatierung** — Leerzeichen vor Extension entfernt

##### 3. **Zwei-Stufen Logging System**

**Normal-Mode (IMMER aktiv):**
```
[14:32:15] 🚀 Jellyfin Sortierung v3.0 gestartet
[14:32:16] ✅ Upload erfolgreich
[14:32:17] 🔍 Analyse wird durchgeführt...
```

**Detail-Mode (nur mit ?debug=true):**
```
[14:32:15] 🚀 Jellyfin Sortierung v3.0 gestartet
└─ Details: {version: "3.0", timestamp: 1234567890, ...}

[14:32:16] ✅ Upload erfolgreich
└─ Details: {
    filename: "test.mp4",
    size: 1024000,
    duration: 2345,
    ...
  }
```

**Hilfs-Funktionen:**
```javascript
logInfo(message, details)       // Info-Logs
logSuccess(message, details)    // Success-Logs
logError(message, details)      // Error-Logs
logWarn(message, details)       // Warning-Logs
logData(message, data)          // Daten-Logs mit JSON
```

##### 4. **Auto-Reload nach Finalisierung**

- ✅ Nach erfolgreicher Finalisierung wird die Seite automatisch neu geladen
- ✅ Verzögerung von 1,5 Sekunden für visuelles Feedback
- ✅ App-State wird zurückgesetzt
- ✅ Temp-Folder-Liste wird aktualisiert

##### 5. **Debug-Panel Verbesserungen**

- ✅ 🐛-Button ist **immer sichtbar** (nicht nur mit URL-Parameter)
- ✅ Logs werden **immer gesammelt**
- ✅ Expandbare Detail-Views im Debug-Panel
- ✅ Bessere Fehlerbehandlung

#### 🐛 Kritische Bug Fixes

| Issue | Problem | Status |
|-------|---------|--------|
| **Keine Daten werden gesendet** | `finalizeAndUpload()` iterierte nur über `STATE.userEdits` → Dateien ohne Edits ignored | ✅ FIXED |
| **Fehlende Logs** | `DEBUG_ENABLED` Check verhinderte Log-Updates | ✅ FIXED |
| **Formatierungsprobleme** | Leerzeichen vor Extension, Whitespace in Namen | ✅ FIXED |

#### 📊 Datenstruktur — Finalize Request

```json
{
  "originalName": "Episode 1.mp4",
  "fileExtension": ".mp4",
  "path": "/media/Serien/Erwachsene/",
  "audience": "adults",
  "mediaType": "series",
  "jellyfin_name": "One Piece(2025) S1 E1",
  "season": 1,
  "episode": 1,
  "series_name": "One Piece(2025)",
  "sessionId": "session-..."
}
```

---

## [3.0] - 2025-12-01

### 🎬 Initial Release

#### ✨ Features

- 📤 Datei-Upload mit Drag & Drop
- 🤖 KI-gestützte Datei-Analyse
- 🏷️ Jellyfin-kompatible Benennung
- ✏️ Manuelle Bearbeitung von Metadaten
- 🔒 Session-Management
- 📊 Basic Logging

---

## Migrations-Guide

### Upgrade von 4.3 → 4.4

✅ **Vollständig kompatibel** — Keine Änderungen notwendig

```bash
cp releases/BackupV4.4/app.js src/app.js
# Fertig! Browser reload (Ctrl+Shift+R für Cache-Clear)
```

### Upgrade von 4.1 → 4.2

✅ **Vollständig kompatibel** — Nur UI-Updates

```bash
cp releases/BackupV4.2/app.js src/app.js
# UI-Aktualisierungen sind sofort sichtbar
```

### Upgrade von 4.0 → 4.1

⚠️ **Breaking:** Edit-Daten-Format geändert

Alte Edit-Sessions sind **nicht kompatibel** mit neuer Version.

```bash
cp releases/BackupV4.1/app.js src/app.js
# App sollte neu geladen werden (alte Edits gehen verloren, aber kein Datenverlust!)
```

---

## 📌 Known Issues

### ⚠️ Chrome OS + FormData

- Android hat einen Fehler mit FormData-Upload (wird dauerhaft deaktiviert)
- Chrome OS Upload kann in `app.json` deaktiviert werden (`disableChromeOS: true`)

### ⚠️ Fehlende Endpunkte

Einige Features benötigen alle 5 Endpoints im N8N Webhook:
- `/check-exists` — Existenzprüfung (REQUIRED)
- `/upload` — Upload (REQUIRED)
- `/list` — Temp-Auflistung (OPTIONAL, aber empfohlen)
- `/analyse` — KI-Analyse (OPTIONAL, wird autodetektiert)
- `/finalize` — Finalisierung (REQUIRED)

---

## 🔮 Geplante Features

- [ ] Batch-Import von Metadaten
- [ ] IMDb/TMDB Integration
- [ ] Custom Naming-Templates
- [ ] Subtitle-Management
- [ ] Mobile-optimierte UI
- [ ] Export-Funktion für Metadaten

---

**Zuletzt aktualisiert: 24. Februar 2026**
