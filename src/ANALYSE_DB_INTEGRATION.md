# Analyse-Funktion Update - Datenbank Integration

## Problem
- Vorher: Vollständige Dateinamen mit Endungen wurden zum Server geschickt
- Jetzt: Nur Dateinamen OHNE Endungen werden zum Server geschickt
- Grund: Neue Datenbank für Token-Einsparung bei wiederholten Analysen

## Lösung

### 1. Helper-Funktion: `removeFileExtension()`
```javascript
function removeFileExtension(filename) {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}
```

**Was es tut:**
- Entfernt die Dateiendung
- "Episode 1.mp4" → "Episode 1"
- "Movie Title.mkv" → "Movie Title"
- Fallback: Falls kein Punkt vorhanden, wird Original zurückgegeben

---

## 2. Datenfluss in `analyzeFiles()`

### Request zum Server:
```javascript
const requestBody = {
  files: fileNamesWithoutExt,      // ["Episode 1", "Episode 2"]
  originalFiles: filesToAnalyze,   // ["Episode 1.mp4", "Episode 2.mp4"]
  sessionId: STATE.sessionId
};
```

**Erklärung:**
- `files`: Dateinamen OHNE Endung für Datenbank-Abfrage
- `originalFiles`: Backup der Original-Namen mit Endung (optional, für Server-Logging)
- `sessionId`: Session-Kennung

### Server-Verarbeitung (N8N):
1. ✅ **Datenbank-Abfrage** mit Namen ohne Endung
   - Schnell (nur String-Vergleich)
   - Token-sparen (keine AI-Anfrage nötig)
   
2. ✅ **Falls in DB gefunden:**
   - Direkt zurückgeben (gecacht)
   - Schnell und effizient
   
3. ✅ **Falls NICHT in DB gefunden:**
   - AI-Cluster Analyse starten
   - Ergebnis in DB speichern
   - Zurückgeben

---

## 3. Response-Verarbeitung

### Name-Mapping:
```javascript
// Erstelle Mapping von Namen ohne Endung zu Original-Namen
const nameMapping = {};
filesToAnalyze.forEach((originalName, idx) => {
  const nameWithoutExt = fileNamesWithoutExt[idx];
  nameMapping[nameWithoutExt] = originalName;
});

// Beispiel:
// nameMapping = {
//   "Episode 1": "Episode 1.mp4",
//   "Episode 2": "Episode 2.mp4"
// }
```

### Response vom Server:
Der Server sendet Analyse-Ergebnisse mit Namen OHNE Endung zurück:
```json
{
  "output": {
    "original_name": "Episode 1",  // OHNE Endung
    "media_type": "series",
    "series_name": "One Piece"
  }
}
```

### Umwandlung zurück zu Original-Namen:
```javascript
const dbName = data.original_name; // "Episode 1"
const originalFileName = nameMapping[dbName]; // "Episode 1.mp4"

// Speichere mit Original-Namen
analysis[originalFileName] = data;
```

---

## 4. Fehlerbehandlung

### Wenn Namen nicht im Mapping vorhanden:
```javascript
if (dbName && nameMapping[dbName]) {
  // Normal verarbeiten
  analysis[originalFileName] = data;
} else {
  // Fallback: nutze dbName direkt
  logDebug(`Mapping nicht gefunden - Fallback`, 'warning');
  analysis[dbName] = data;
}
```

---

## 5. Logging & Debugging

### Debug-Ausgaben:
```
📋 Dateiliste (mit Endung): ["Episode 1.mp4", "Episode 2.mp4"]
📋 Dateiliste (OHNE Endung für DB): ["Episode 1", "Episode 2"]
💾 Hinweis: Nur Datei-NAMEN ohne Endung werden zum Server gesendet!
🗄️ Server prüft zuerst die Datenbank (Tokens sparen)
🤖 Falls nicht in DB: wird über AI Cluster analysiert und dann gespeichert
🔄 Name-Mapping erstellt:
   "Episode 1" ← "Episode 1.mp4"
   "Episode 2" ← "Episode 2.mp4"
```

---

## 6. Vorteile dieser Implementierung

✅ **Token-Einsparung:** Wiederholte Analysen lesen aus DB statt AI zu nutzen
✅ **Schneller:** Datenbank-Abfragen sind viel schneller als AI-Analysen
✅ **Kompatibilität:** UI arbeitet weiterhin mit Original-Namen + Endungen
✅ **Fallback:** Wenn Mapping fehlschlägt, funktioniert es trotzdem noch
✅ **Logging:** Alles wird detailliert geloggt für Debugging

---

## 7. Änderungen im Code

### `analyzeFiles()` Funktion:
- ✅ Neue Helper-Funktion `removeFileExtension()`
- ✅ Entfernt Endungen vor dem Server-Request
- ✅ Sendet `files` (ohne Endung) UND `originalFiles` (mit Endung)
- ✅ Erweiterte Logging-Ausgaben

### Response-Verarbeitung:
- ✅ Erstellt Name-Mapping (ohne Endung → mit Endung)
- ✅ Mappt Server-Response zurück zu Original-Namen
- ✅ Speichert Ergebnisse mit vollständigen Dateinamen
- ✅ Fehlerbehandlung für fehlende Mappings

### Kompatibilität:
- ✅ `displayAnalysisResults()` arbeitet unverändert
- ✅ Alle anderen Funktionen erhalten Original-Dateinamen
- ✅ Keine Breaking Changes

---

## 8. Beispiel-Workflow

```
Benutzer wählt 2 Dateien:
├─ "Breaking Bad S01E01.mkv"
└─ "Breaking Bad S01E02.mkv"

UI sendet:
├─ files: ["Breaking Bad S01E01", "Breaking Bad S01E02"]
└─ originalFiles: ["Breaking Bad S01E01.mkv", "Breaking Bad S01E02.mkv"]

Server (N8N):
├─ Prüft DB nach "Breaking Bad S01E01"
│  └─ GEFUNDEN! → Liest aus DB (0 Tokens)
├─ Prüft DB nach "Breaking Bad S01E02"
│  └─ NICHT GEFUNDEN → Analysiert mit AI (Tokens)
│  └─ Speichert in DB
└─ Gibt beide Ergebnisse zurück

UI empfängt:
├─ "Breaking Bad S01E01": {original_name: "Breaking Bad S01E01", ...}
├─ "Breaking Bad S01E02": {original_name: "Breaking Bad S01E02", ...}
└─ Mappt zurück zu "Breaking Bad S01E01.mkv" und "Breaking Bad S01E02.mkv"

Ergebnis:
✅ Beide Dateien sind analysiert
✅ 1 Datei aus DB (schnell, kostenlos)
✅ 1 Datei von AI (langsam, kostet Tokens)
✅ Tokens gespart!
```

---

## 9. Für N8N Server konfigurieren

Der N8N Workflow muss angepasst werden:

```
Eingang:
- body.files: Array von Namen OHNE Endung
- body.originalFiles: Array von Namen MIT Endung
- body.sessionId: Session-ID

Verarbeitung:
1. Für jeden Namen in body.files:
   2a. Datenbank-Abfrage mit OHNE-Endung-Namen
   2b. Falls gefunden → Rückgabe aus DB
   2c. Falls nicht → AI-Analyse → Speichern in DB
   2d. Rückgabe mit original_name (ohne Endung)

Ausgang:
- Array mit Analyse-Ergebnissen
```

---

## Zusammenfassung

Die `analyzeFiles()` Funktion wurde angepasst, um mit dem neuen Datenbank-System zu arbeiten:

1. **Vorher:** `analyzeFiles()` → Server erhält Namen MIT Endung
2. **Nachher:** `analyzeFiles()` → Server erhält Namen OHNE Endung + Backup mit Endung
3. **Mapping:** Server sendet zurück, UI mappt Namen OHNE Endung zu Originalname MIT Endung
4. **Ergebnis:** UI arbeitet transparent mit vollständigen Dateinamen, Server optimiert Datenbank-Abfragen

✅ Code ist bereit für Datenbank-Integration!
