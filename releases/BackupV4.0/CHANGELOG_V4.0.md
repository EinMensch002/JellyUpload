# CHANGELOG - Version 4.0
## Jellyfin Media Sortierung - Vollständige Release Notes

**Veröffentlichung:** 28. Januar 2026
**Status:** Stable Release

---

## 🎯 Zusammenfassung der Änderungen

Version 4.0 ist eine **umfassende Überarbeitung** mit fokus auf **Benutzerfreundlichkeit**, **Datenübertragung** und **Debug-Funktionalität**. Alle Dateien können jetzt nach Analyse **selektiv abgewählt** werden, bevor sie finalisiert werden.

---

## ✨ Neue Features

### 1. **Datei-Abwahl System** ⭐
- **Serien:** Checkbox neben Serienname zum Ein-/Ausschalten aller Episoden
- **Staffel-Abwahl:** Möglichkeit einzelne Staffeln oder ganze Serien zu deselektieren  
- **Filme:** Checkbox im Filme-Header und bei jedem Film einzeln
- **Automatische Synchronisierung:** Quando episoden ab/gewählt werden, synchronisiert sich Serie-Checkbox
- **Standard:** Alle Dateien sind nach Analyse **automatisch ausgewählt**
- **Funktion:** Nur ausgewählte Dateien werden zum Server gesendet

### 2. **Erweiterte Dateiinformationen**
- **File Extension:** Neue Variable `fileExtension` wird mit zum Server gesendet
- **Saubere Formatierung:** Leerzeichen vor Extension entfernt
- **Trimming:** `jellyfin_name` und `series_name` werden automatisch von Whitespace bereinigt
- **Dateiendung-Beispiele:** `.mp4`, `.mkv`, `.avi`

### 3. **Zwei-Stufen Logging System**
- **Normale Logs:** Einfache, aussagekräftige Logs (immer aktiv)
  - Icon + Timestamp + Nachricht
  - Farb-kodiert nach Typ
  - In normaler Log-Liste sichtbar
  
- **Detaillierte Logs:** Umfangreiche Debug-Infos (nur mit `?debug=true`)
  - JSON-formatierte Detailinformationen
  - Expandbar im Debug-Panel
  - Vollständige Datenstrukturen
  - Console.group() für DevTools
  
- **Hilfs-Funktionen:**
  - `logInfo(message, details)` - Info-Logs
  - `logSuccess(message, details)` - Success-Logs
  - `logError(message, details)` - Error-Logs
  - `logWarn(message, details)` - Warning-Logs
  - `logData(message, data)` - Daten-Logs

### 4. **Seite automatisch neu laden**
- Nach erfolgreicher Finalisierung wird die Seite automatisch neu geladen
- Verzögerung von 1,5 Sekunden für Benutzer-Feedback
- State wird vorher zurückgesetzt
- Temp-Folder-Liste wird aktualisiert

### 5. **Debug-Panel Verbesserungen**
- 🐛-Button ist jetzt **immer sichtbar** (nicht nur mit URL-Parameter)
- Logs werden **immer gesammelt**
- Expandbare Detail-Views im Debug-Panel
- Bessere Fehlerbehandlung

---

## 🐛 Bug Fixes

### Kritische Fixes
1. **Keine Daten werden gesendet (FIXED)**
   - Problem: `finalizeAndUpload()` iterierte nur über `STATE.userEdits`
   - Lösung: Jetzt über `STATE.analysisResults` mit Optional-Edits
   - Ergebnis: Auch Dateien ohne explizite Edits werden verarbeitet

2. **Fehlende Logs (FIXED)**
   - Problem: `DEBUG_ENABLED` Check verhinderte Log-Updates
   - Lösung: Logs werden immer gesammelt, `debugOpen` kontrolliert UI-Update
   - Ergebnis: Logs sind verfügbar ohne `?debug=true` URL-Parameter

3. **Formatierungsprobleme (FIXED)**
   - Leerzeichen vor File Extension entfernt
   - Whitespace in Namen wird getrimmt
   - Episode/Film-Reihen haben korrekte Grid-Layouts

---

## 📊 Datenstruktur - Verbesserungen

### Gesendete Daten (POST zu /finalize)
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

### Änderungen in v4.0
- ✅ `fileExtension` - NEU: Dateiendung als separate Variable
- ✅ `path` - Bereits vorhanden, korrekt formatiert
- ✅ Trimmed `jellyfin_name` - Keine Whitespace
- ✅ Trimmed `series_name` - Keine Whitespace
- ❌ `pathKey` - Entfernt (redundant)

---

## 🎨 UI/UX Verbesserungen

### Checkboxen & Auswahl
- Neue Checkbox-Styles mit hover-Effekt
- Visuelle Feedback bei Auswahl
- Korrekte Grid-Layout-Anpassung
- Konsistente Positionierung (FSK/Zielgruppe am rechten Rand)

### Navigation & Workflow
1. **Upload** → 2. **Analyse** → 3. **Bearbeitung + Auswahl** → 4. **Finalisierung**
5. **Auto-Reload** → Zurück zu Schritt 1

---

## 🔧 Technische Details

### Neue Funktionen im Code
- `toggleFileSelection(filename, selected)` - Verwaltet Auswahl
- `selectAllInSeries(seriesName, select)` - Serien-Bulk-Toggle
- `selectAllMovies(select)` - Film-Bulk-Toggle
- `updateCheckboxesForSeries()` - Synchronisiert Serie-Checkboxen
- `updateCheckboxesForMovies()` - Synchronisiert Film-Checkboxen
- `logDebug(message, type, details)` - Zwei-Stufen Logging
- `logInfo/Success/Error/Warn/Data()` - Hilfs-Funktionen

### State Erweiterungen
```javascript
STATE = {
  sessionId: '',
  uploadedFiles: [],
  analysisResults: {},
  tempFilesList: [],
  userEdits: {},
  selectedFiles: new Set()  // ← NEU: Nachverfolgt ausgewählte Dateien
}
```

---

## 📋 Bekannte Limitationen

1. **Datenbank-Integration:** Dateinamen werden ohne Erweiterung zum Server gesendet (für DB-Optimierung)
2. **Bulk-Edits:** FSK/Zielgruppe müssen vor Auswahl geändert werden (sonst beeinflussen sie nicht finalisierte Dateien)
3. **Session-Timeout:** Sehr lange Sessions können gelöscht werden

---

## 🚀 Performance

- **Log-Sammlung:** O(n) - Linear mit Anzahl der Events
- **Checkbox-Updates:** O(n) - Linear mit Anzahl der Dateien pro Serie
- **Finalisierung:** O(n) mit 100ms Verzögerung pro Request
- **Memory:** Logs können optional gelöscht werden um Speicher zu sparen

---

## 📦 Dateien in diesem Backup

### UI-Dateien
- `app.js` - Hauptanwendung (3647 Zeilen)
- `app.json` - Konfiguration (Paths, API-Endpoints)
- `style.css` - Styling (2456 Zeilen)
- `index.html` - HTML-Struktur

### Server-Konfigurationen
- `serverbackend V2.0.json` - N8N Workflow Export
- `serverbackend aicluster V1.1.5.json` - AI-Cluster Integration

### Dokumentation
- `CHANGELOG_V4.0.md` - Diese Datei
- `QUICKSTART.md` - Schnelleinstieg
- `README_V4.0.md` - Vollständige Dokumentation

---

## 🔄 Migration von v3.x zu v4.0

### Kompatibilität
- ✅ Abwärtskompatibel mit v3.x Server-APIs
- ✅ Bestehende `app.json` Konfigurationen funktionieren
- ✅ Keine Datenmigration nötig

### Upgrade-Schritte
1. Alte `app.js` und `style.css` sichern (BackupV3.x)
2. Neue Dateien aus `BackupV4.0/` kopieren
3. `app.json` überprüfen (sollte unverändert sein)
4. Seite im Browser neu laden (F5)
5. Session wird automatisch neu erstellt

---

## 👤 Support & Feedback

- **Debug-Mode:** `?debug=true` in der URL aktivieren
- **Logs exportieren:** 🐛-Button → "Export" (speichert als JSON)
- **Logs löschen:** 🐛-Button → "Clear" (bestätigung erforderlich)

---

## 📈 Versionsverlauf

- **v3.9** - Previous Stable
- **v4.0** - Current Release (28. Jan 2026)

---

**Version 4.0 ist produktionsreif und wird empfohlen für alle Installationen!** ✅
