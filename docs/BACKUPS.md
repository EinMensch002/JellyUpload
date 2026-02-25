# 📦 Backups & Server-Konfigurationen

Dokumentation aller Backups und Server-Konfigurationen für N8N und AI Cluster.

---

## 📁 Backup-Dateien

### N8N Server & AI Cluster

#### `serverbackend V2.2.json`
- **Version:** 2.2
- **Letztes Update:** 2026-02-25
- **Beschreibung:** N8N Server Konfiguration mit vollständiger OVA/Special-Support
- **Standorte:**
  - `src/serverbackend V2.2.json` (Quelle)
  - `releases/v4.5/serverbackend V2.2.json` (v4.5 Release)

**Features:**
- ✅ OVA/Special Episode Erkennung
- ✅ Dateiendungs-Erkennung (50+ Formate)
- ✅ Metadata-Extraction für Jellyfin
- ✅ JSON Payload Formatting
- ✅ Session Management

**Verwendung:**
```bash
# N8N Server importieren
curl -X POST http://n8n-server:5678/api/v1/workflows/import \
  -H "Content-Type: application/json" \
  -d @serverbackend\ V2.2.json
```

---

#### `serverbackend aicluster V1.1.5.json`
- **Version:** 1.1.5
- **Letztes Update:** 2026-02-25
- **Beschreibung:** AI Cluster Backup mit aktualisierter OVA-Verarbeitungs-Logik
- **Standorte:**
  - `src/serverbackend aicluster V1.1.5.json` (Quelle)
  - `releases/v4.5/serverbackend aicluster V1.1.5.json` (v4.5 Release)

**Features:**
- ✅ OVA/Special Klassifikation
  - Setzt `season: -1` für OVA/Special
  - Setzt `episode: ""` (empty string) statt "OVA"/"Special"
- ✅ Robuste Fehlerbehandlung
- ✅ Batched Processing für mehrere Dateien
- ✅ Detaillierte Response-Payloads

**Verwendung:**
```bash
# AI Cluster Konfiguration laden
curl -X POST http://aicluster:8080/api/v1/config/import \
  -H "Content-Type: application/json" \
  -d @"serverbackend aicluster V1.1.5.json"
```

---

## 🔄 Versionsverlauf

### V4.5 (Aktuell)
- ✅ OVA/Special Support vollständig integriert
- ✅ N8N Server & AI Cluster synchronisiert
- ✅ Frontend & Backend Konsistenz gewährleistet

### V4.4
- ✅ Dateiendungs-Erkennung Algorithmus
- ✅ 50+ Video-Format Support
- ✅ URL-Suffix Handling (z.B. `.to.mp4`)

### V4.3
- ✅ Basis Jellyfin Integration
- 🔲 OVA Support (geplant)

---

## 📊 Backup-Struktur

### Allgemeine JSON-Struktur (serverbackend V2.2.json)

```json
{
  "version": "2.0",
  "name": "Jellyfin Media Analysis & Upload",
  "nodes": [
    {
      "name": "File Upload",
      "type": "http",
      "parameters": {
        "method": "POST",
        "url": "{{ $env.N8N_BASE_URL }}/webhook/upload"
      }
    },
    {
      "name": "AI Analysis",
      "type": "function",
      "description": "Metadata extraction mit OVA-Erkennung"
    },
    {
      "name": "Jellyfin Finalize",
      "type": "http",
      "parameters": {
        "method": "POST",
        "url": "{{ $env.N8N_BASE_URL }}/webhook/finalize"
      }
    }
  ]
}
```

### AI Cluster Response Format

```json
{
  "original_name": "One Piece - OVA",
  "media_type": "series",
  "audience": "kids",
  "series_name": "One Piece",
  "jellyfin_name": "One Piece OVA",
  "season": -1,
  "episode": "",
  "fsk": 6,
  "status": "success",
  "message": "OVA erkannt - Standard-Behandlung angewendet",
  "suggestions": ""
}
```

---

## 🔐 Recovery & Restore

### Backup Restoration

1. **N8N Server Recovery:**
   ```bash
   # Backup laden
curl http://n8n-server:5678/api/v1/workflows/export > n8n_backup.json

# Mit Restore Recovery Starten
curl -X POST http://n8n-server:5678/api/v1/workflows/import \
  -H "Content-Type: application/json" \
  -d @n8n_backup.json
2. **AI Cluster Recovery:**
   ```bash
   # Konfiguration sichern
   curl http://aicluster:8080/api/v1/config/export > aicluster_backup.json
   
   # Wiederherstellen
   docker restart aicluster
   curl -X POST http://aicluster:8080/api/v1/config/import \
     -H "Content-Type: application/json" \
     -d @aicluster_backup.json
   ```

---

## ⚠️ Wichtige Hinweise

- **Versionskonsistenz:** Stelle sicher, dass N8N Server und AI Cluster auf gleiches Backup-Level aktualisiert sind
- **OVA/Special Handling:** Beide Systeme müssen `-1` für season und `""` für episode verwenden
- **Metadata Mapping:** Original prompt in [src/N8N_ANALYSIS_PROMPT_V4.4.md](../src/N8N_ANALYSIS_PROMPT_V4.4.md) beachten
- **Backup-Häufigkeit:** Mindestens wöchentliche Backups empfohlen

---

## 📝 Wartungs-Checkliste

- [ ] Wöchentliche Backups durchführen
- [ ] Version-Kompatibilität überprüfen
- [ ] OVA-Test-Cases ausführen
- [ ] Logs auf Fehler prüfen
- [ ] Dateiendungs-Liste aktualisieren (falls nötig)

---

**Zuletzt aktualisiert:** 2026-02-25  
**Maintainer:** JellyUpload Team
