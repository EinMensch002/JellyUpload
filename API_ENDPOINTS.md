# 🔌 API Endpoints Dokumentation

Vollständige Dokumentation aller verfügbaren API-Endpunkte für das JellyUpload Backend (N8N Webhooks).

## 📋 Übersicht

| Endpunkt | Methode | Datei | Anforderung | Beschreibung |
|----------|---------|--------|------------|-------------|
| [`/check-exists`](#check-exists) | POST | ❌ | **REQUIRED** | Prüfung ob Datei existiert |
| [`/upload`](#upload) | POST | ✅ | **REQUIRED** | Datei hochladen |
| [`/list`](#list) | POST | ❌ | OPTIONAL | Temp-Ordner auflisten |
| [`/analyse`](#analyse) | POST | ❌ | OPTIONAL | KI-Analyse starten |
| [`/finalize`](#finalize) | POST | ✅ | **REQUIRED** | Finale Speicherung |

---

## `/check-exists`

Prüft, ob eine Datei mit dem selben Namen bereits existiert.

### Request

**Content-Type:** `application/json`

```javascript
POST /webhook/jellyupload/check-exists

{
  "filename": "Episode 1.mp4",
  "sessionId": "session-1706384521-a1b2c3d4e"
}
```

| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `filename` | string | Dateiname inkl. Endung |
| `sessionId` | string | Eindeutige Session-ID (für Tracking) |

### Response

```json
{
  "exists": false,
  "path": "/media/temp/Episode 1.mp4",
  "size": 0,
  "checksum": null
}
```

**Erfolgreich:** HTTP 200

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `exists` | boolean | `true` wenn Datei existiert |
| `path` | string | Vollständiger Pfad der existierenden Datei |
| `size` | number | Dateigröße in Bytes (fallback: 0) |
| `checksum` | string\|null | MD5/SHA256 falls vorhanden (optional) |

### Fehler

**HTTP 400** — Ungültige Parameter
```json
{
  "error": "Missing filename",
  "timestamp": "2026-01-28T10:30:45.123Z"
}
```

**HTTP 500** — Server-Fehler
```json
{
  "error": "FTP connection failed",
  "details": "Cannot reach /media/temp"
}
```

---

## `/upload`

Lädt eine Datei in den Temp-Ordner hoch.

### Request

**Content-Type:** `multipart/form-data`

```javascript
POST /webhook/jellyupload/upload

FormData:
├─ file: File                          // Die Binärdatei
├─ filename: "Episode 1.mp4"           // Dateiname (kann vom Original abweichen)
├─ sessionId: "session-..."            // Session-ID
├─ timestamp: "2026-01-28T10:30:45Z"   // ISO Timestamp
└─ overwrite: "false"                  // Überschreiben wenn existiert?
```

| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `file` | File | Die hochzuladende Binärdatei |
| `filename` | string | Zielname (kann abweichen von original) |
| `sessionId` | string | Session-ID |
| `timestamp` | string | ISO 8601 Timestamp |
| `overwrite` | boolean | `true` zum Überschreiben |

### Response

**HTTP 200** — Erfolgreich

```json
{
  "success": true,
  "filename": "Episode 1.mp4",
  "path": "/media/temp/",
  "size": 1048576,
  "duration": 2345,
  "md5": "5d41402abc4b2a76b9719d911017c592",
  "upload_time_ms": 1234
}
```

**HTTP 409** — Datei existiert bereits

```json
{
  "error": "File exists",
  "filename": "Episode 1.mp4",
  "exists": true,
  "action_required": "ask_user",
  "options": ["overwrite", "rename"]
}
```

---

## `/list`

Gibt eine Liste aller Dateien im Temp-Ordner zurück.

### Request

**Content-Type:** `application/json`

```javascript
POST /webhook/jellyupload/list

{
  "sessionId": "session-1706384521-a1b2c3d4e"
}
```

| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `sessionId` | string | Session-ID (optional für Tracking) |

### Response

**HTTP 200** — Erfolgreich

```json
{
  "files": [
    "Episode 1.mp4|||2026-01-28T10:30:45Z|||1048576",
    "Episode 2.mp4|||2026-01-28T10:31:12Z|||2097152",
    "Movie.mkv|||2026-01-28T10:35:00Z|||5242880"
  ],
  "count": 3,
  "total_size": 8388608,
  "path": "/media/temp"
}
```

**Format:** `filename|||timestamp|||size_bytes`

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `files` | array | Array von Dateieinträgen mit Metadaten |
| `count` | number | Anzahl der Dateien |
| `total_size` | number | Gesamtgröße aller Dateien |
| `path` | string | Pfad zum Temp-Ordner |

---

## `/analyse`

Analysiert Filmdateien mit KI um Metadaten (Titel, Serie/Film, Staffel, Episode, FSK) zu extrahieren.

### Request

**Content-Type:** `application/json`

```javascript
POST /webhook/jellyupload/analyse

{
  "files": [
    "Episode 1",           // Dateiname OHNE Endung!
    "Episode 2",
    "Movie Title"
  ],
  "originalFiles": [      // Original-Namen mit Endung (Backup)
    "Episode 1.mp4",
    "Episode 2.mp4",
    "Movie Title.mkv"
  ],
  "sessionId": "session-1706384521-a1b2c3d4e"
}
```

| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `files` | string[] | Dateinamen OHNE Endung (für DB-Lookup) |
| `originalFiles` | string[] | Dateinamen MIT Endung (Backup/Fallback) |
| `sessionId` | string | Session-ID |

### Response

**HTTP 200** — Erfolgreich (Array-Format)

```json
[
  {
    "original_name": "Episode 1.mp4",
    "db_name": "Episode 1",
    "media_type": "series",
    "jellyfin_name": "One Piece S01 E01",
    "series_name": "One Piece",
    "season": 1,
    "episode": 1,
    "fsk": "12",
    "audience": "kids",
    "suggestions": "One Piece (1999)|One Piece 2025|ワンピース"
  },
  {
    "original_name": "Episode 2.mp4",
    "media_type": "series",
    "jellyfin_name": "One Piece S01 E02",
    "series_name": "One Piece",
    "season": 1,
    "episode": 2,
    "fsk": "12",
    "audience": "kids",
    "suggestions": null
  },
  {
    "original_name": "Movie Title.mkv",
    "media_type": "movie",
    "jellyfin_name": "Movie Title",
    "fsk": "16",
    "audience": "adults",
    "suggestions": "Movie Title (2024)|Movie Title Extended"
  }
]
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `original_name` | string | Original-Dateiname (als Identifier) |
| `db_name` | string | Dateiname ohne Endung (wie gesendet) |
| `media_type` | "series" \| "movie" | Typ des Inhalts |
| `jellyfin_name` | string | Standard-Name nach Jellyfin-Konvention |
| `series_name` | string | (Serie) Name der Serie |
| `season` | number | (Serie) Staffelnummer |
| `episode` | number | (Serie) Episodennummer |
| `fsk` | string \| null | FSK-Einstufung (0, 6, 12, 16, 18) |
| `audience` | string | Zielgruppe ("kids" oder "adults") |
| `suggestions` | string | Pipe-separated Liste alternativer Namen |

### Error Response

**HTTP 200** (mit Error-Flag) — Analyse fehlgeschlagen

```json
{
  "status": "error",
  "message": "AI Service not available",
  "details": "OpenAI API timeout"
}
```

Oder **Array mit error-Feld**:

```json
[
  {
    "error": [
      "Episode 1",
      "Episode 2"
    ]
  }
]
```

---

## `/finalize`

Finalisiert die Upload-Verarbeitung und speichert Dateien in finale Verzeichnisse.

### Request

**Content-Type:** `application/json`

```javascript
POST /webhook/jellyupload/finalize

{
  "edits": {
    "Episode 1.mp4": {
      "name": "One Piece S01 E01",
      "season": 1,
      "episode": 1,
      "fsk": "12",
      "audience": "kids"
    },
    "Movie Title.mkv": {
      "name": "Movie Title",
      "fsk": "16",
      "audience": "adults"
    }
  },
  "sessionId": "session-1706384521-a1b2c3d4e"
}
```

| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `edits` | object | Key = Dateiname, Value = Metadaten-Objekt |

#### Edit-Objekt für Serienfolge

```javascript
{
  "filename": "Episode 1.mp4",
  "name": "One Piece S01 E01",        // Jellyfin-Name
  "season": 1,
  "episode": 1,
  "fsk": "12",
  "audience": "kids",                // oder "adults"
  "originalName": "Episode 1.mp4",
  "series_name": "One Piece"
}
```

#### Edit-Objekt für Film

```javascript
{
  "filename": "Movie Title.mkv",
  "name": "Movie Title",
  "fsk": "16",
  "audience": "adults",              // oder "kids"
  "originalName": "Movie Title.mkv"
}
```

### Response

**HTTP 200** — Erfolgreich

```json
{
  "success": true,
  "processed": 3,
  "results": [
    {
      "original_name": "Episode 1.mp4",
      "final_name": "One Piece S01 E01.mp4",
      "path": "/media/Serien/Kinder/One Piece/",
      "status": "moved"
    },
    {
      "original_name": "Episode 2.mp4",
      "final_name": "One Piece S01 E02.mp4",
      "path": "/media/Serien/Kinder/One Piece/",
      "status": "moved"
    },
    {
      "original_name": "Movie Title.mkv",
      "final_name": "Movie Title.mkv",
      "path": "/media/Filme/Erwachsene/",
      "status": "moved"
    }
  ],
  "cleanup": {
    "temp_files_deleted": 3,
    "session_cleaned": true
  }
}
```

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `success` | boolean | Erfolgreich abgeschlossen? |
| `processed` | number | Anzahl verarbeiteter Dateien |
| `results` | array | Details für jede Datei |
| `cleanup` | object | Aufräum-Informationen |

#### Result-Item Struktur

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `original_name` | string | Original-Dateiname |
| `final_name` | string | Final benannter Dateiname |
| `path` | string | Zielverzeichnis |
| `status` | string | "moved" \| "copied" \| "error" |

---

## 🔄 Kompletter Workflow-Beispiel

### Szenario: User lädt zwei Dateien hoch

```
┌──────────────────────────────────────────────────────────┐
│ 1. CHECK-EXISTS                                          │
├──────────────────────────────────────────────────────────┤
POST /check-exists
{ "filename": "Episode 1.mp4", "sessionId": "session-123" }

Response (200):
{ "exists": false }  → Kann hochladen
└──────────────────────────────────────────────────────────┘
              ⬇
┌──────────────────────────────────────────────────────────┐
│ 2. UPLOAD                                                │
├──────────────────────────────────────────────────────────┤
POST /upload (multipart/form-data)
FormData:
├─ file: <Episode 1.mp4 Binär>
├─ filename: "Episode 1.mp4"
├─ sessionId: "session-123"
└─ timestamp: "2026-01-28T10:30:45Z"

Response (200):
{ "success": true, "size": 1048576 }
└──────────────────────────────────────────────────────────┘
              ⬇
┌──────────────────────────────────────────────────────────┐
│ 3. LIST                                                  │
├──────────────────────────────────────────────────────────┤
POST /list
{ "sessionId": "session-123" }

Response (200):
{
  "files": [
    "Episode 1.mp4|||...",
    "Episode 2.mp4|||..."
  ]
}
└──────────────────────────────────────────────────────────┘
              ⬇
┌──────────────────────────────────────────────────────────┐
│ 4. ANALYSE                                               │
├──────────────────────────────────────────────────────────┤
POST /analyse
{
  "files": ["Episode 1", "Episode 2"],
  "sessionId": "session-123"
}

Response (200):
[
  { "original_name": "Episode 1.mp4", "media_type": "series", ... },
  { "original_name": "Episode 2.mp4", "media_type": "series", ... }
]
└──────────────────────────────────────────────────────────┘
              ⬇
┌──────────────────────────────────────────────────────────┐
│ 5. FINALIZE                                              │
├──────────────────────────────────────────────────────────┤
POST /finalize
{
  "edits": {
    "Episode 1.mp4": { "name": "One Piece S01 E01", ... },
    "Episode 2.mp4": { "name": "One Piece S01 E02", ... }
  },
  "sessionId": "session-123"
}

Response (200):
{
  "success": true,
  "processed": 2,
  "results": [...]
}
└──────────────────────────────────────────────────────────┘
```

---

## 📌 Wichtige Hinweise

### 🔐 Session-IDs

Alle Requests sollten eine eindeutige **Session-ID** mitgeben:

```javascript
// Format: session-<timestamp>-<random>
const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

// Beispiel: session-1706384521-a1b2c3d4e
```

### 📤 FormData vs. JSON

- **`/check-exists`, `/list`, `/analyse`, `/finalize`**: JSON (Content-Type: application/json)
- **`/upload`**: FormData (Content-Type: multipart/form-data)
  - WICHTIG: Browser setzt Content-Type automatisch für FormData!
  - Nie manuell setzen!

### ⚠️ CORS

Alle Endpoints müssen CORS-Header setzen:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### 🔍 Debugging

Aktiviere Debug-Mode für detaillierte Logs:

```
http://localhost:8000/src/index.html?debug=true
```

Debug-Panel bietet:
- 🧪 **Endpoint-Tester** — Request/Response direkt in UI
- 📋 **Log-Viewer** — Mit expandbaren JSON-Details
- 📊 **Test-Verlauf** — Alle Request-Response Paare
- 🔐 **Environment-Umschalt** — Test vs. Production

---

**Zuletzt aktualisiert: 24. Februar 2026**
