# N8N Analysis Prompt - V4.4 (Mit Dateiendungs-Erkennung)

## INPUT:
```
filenames: {{ $json['body.originalFiles'] }}
session: {{ $('list1').item.json.body.sessionId }}
```

## DATEIENDUNGS-ERKENNUNG (NEU IN V4.4):

**Erkannte Video-Dateierweiterungen (Whitelist):**
```
.mp4 .avi .mkv .mov .webm .flv .wmv .m4v .3gp
.ts .m2ts .mts .m3u8
.vob .m2v
.ogv .asf .rm .rmvb .divx .dv .f4v .f4p .f4a .f4b
.mxf .wtv .ogg .ogm
.mpg .mpeg .mpe
.vro .tp .trp
```

**Algorithmus für original_name:**
1. Erhalte Dateiname mit Endung: z.B. `"Arcane S01E01 S.to.mp4"`
2. Prüfe die **LETZTE Dateiendung** (case-insensitive)
3. **Falls** letzte Endung in der Whitelist ist:
   - Entferne diese Endung → `"Arcane S01E01 S.to"`
   - Das ist der `original_name`
4. **Falls** letzte Endung NICHT in der Whitelist ist:
   - Behalte die Endung im Namen
   - Prüfe ob es einen Punkt gibt, entferne diesen
   - Das ist der `original_name`

**Beispiele:**
```
Input: "Arcane S01E01 S.to.mp4"
→ .mp4 ist Video-Format ✓
→ original_name = "Arcane S01E01 S.to"

Input: "Show.watch.mkv"
→ .mkv ist Video-Format ✓
→ original_name = "Show.watch"

Input: "Film S.stream.avi"
→ .avi ist Video-Format ✓
→ original_name = "Film S.stream"

Input: "Movie.unknown_ext.xyz"
→ .xyz ist NICHT in Whitelist ✗
→ original_name = "Movie.unknown_ext"

Input: "Document"
→ Keine Endung
→ original_name = "Document"
```

---

## ERLAUBTE WERTE:
```
media_type: "movie" | "series"
audience: "kids" | "adults"
fsk: 0, 6, 12, 16, 18 oder null  // MUSS immer versucht werden zu ermitteln
```

---

## AUFGABEN:

Extrahiere folgende Felder:

### 1. original_name
   - Dateiname **ohne erkannte Video-Endung**
   - Siehe Dateiendungs-Erkennung oben
   - Unverändert (außer Endung entfernt)

### 2. media_type
   - "movie" oder "series"

### 3. audience
   - "kids" oder "adults"
   - MUSS immer gesetzt sein
   - Ableiten aus Inhalt, Genre, FSK, allgemeinem Wissen

### 4. series_name
   - Exakter Serienname
   - Nur bei series, sonst null

### 5. jellyfin_name
   - Film: "Titel (Jahr)"
   - Serie Episode: "Serienname S1 E2"
   - Serie Staffel: "Serienname S1"
   - Keine Bindestriche
   - Rechtschreibung prüfen und korrigieren
   - Erscheinungsjahr aus Dateinamen falls vorhanden
   - Bei Serie nur wenn es Verwechslungspartner gibt (z.B. One Piece(1999) und One Piece(2025))

### 6. season
   - Zahl oder null

### 7. episode
   - Zahl oder null

### 8. fsk
   - Versuche die Altersfreigabe zu ermitteln
   - Mögliche Wege:
     - Bekanntes Genre, bekannte Serien/Filme, typische FSK-Werte
     - Logische Ableitung aus bekannten Informationen (z.B. Landser = 16)
     - Offizielle Altersfreigaben (z.B. über FSK)
   - Wenn keine Information verfügbar ist, bleibt das Feld leer ("")
   - Niemals spekulativ hoch setzen

### 9. status
   - "success" oder "error"

### 10. message
   - Kurz & präzise Beschreibung
   - Bei Dateiendung: "Unbekannte Endung .xyz beibehalten"

### 11. suggestions
   - Gib ALLE alternativen Titel als EINEN STRING zurück
   - Verwende AUSSCHLIESSLICH diesen Separator zwischen Einträgen: `|||`
   - KEINE Kommas als Trennzeichen verwenden
   - Beispiel (gültig):
     ```
     "Inferno (1915)|||Inferno (1980)|||Inferno (2016)"
     ```
   - Beispiel (ungültig):
     ```
     "Inferno (1915), Inferno (1980)"
     ```
   - Leerer String "" wenn eindeutig

---

## REGELN:

- **audience MUSS immer gesetzt sein**
- **fsk MUSS aktiv versucht werden zu ermitteln**, darf leer sein wenn keine Information gefunden
- **Dateiendungs-Erkennung MUSS vor original_name erfolgen**
- Rechtschreibung prüfen und korrigieren
- Nur "movie" oder "series" erlaubt
- season/episode nur bei series
- null-Werte nicht weglassen
- Ausgabe = reines JSON
- **Unbekannte Endungen (.xyz, .to, etc.) gehören zum original_name**

---

## AUSGABE-FORMAT:

```json
{
  "original_name": "Arcane S01E01 S.to",
  "media_type": "series",
  "audience": "adults",
  "series_name": "Arcane",
  "jellyfin_name": "Arcane S01E01",
  "season": 1,
  "episode": 1,
  "fsk": 12,
  "status": "success",
  "message": "Analysiert - unbekannte Endung .to beibehalten",
  "suggestions": ""
}
```

---

## CHANGELOG (V4.4):

✅ **HINZUGEFÜGT:**
- Whitelist mit 50+ Video-Dateierweiterungen
- Dateiendungs-Erkennungs-Algorithmus
- Handling für unbekannte Endungen (.to, .la, .net, etc.)
- Beispiele für verschiedene Endungs-Szenarien

✅ **GRUND:**
- Frontend und Backend müssen gleiche Logik haben
- Verhindert Mapping-Fehler bei URL-Suffixen
- Robustheit gegen Namensvarianten von Streaming-Seiten

✅ **IMPACT:**
- Konsistente Dateiverarbeitung
- Keine "Mapping NICHT GEFUNDEN" Fehler mehr
- original_name passt immer zu Request-Key

---

## BEISPIEL-SZENARIEN:

### Szenario 1: Streaming-Seite Suffix
```
Input: "Arcane - Staffel 1 Folge 1.to.mp4"
Backend-Verarbeitung:
  1. Letzte Endung = .mp4 ✓ (in Whitelist)
  2. Entferne .mp4 → "Arcane - Staffel 1 Folge 1.to"
  3. original_name = "Arcane - Staffel 1 Folge 1.to"
  4. Analysiere und erstelle jellyfin_name = "Arcane S01E01"
  
Output:
{
  "original_name": "Arcane - Staffel 1 Folge 1.to",
  "jellyfin_name": "Arcane S01E01",
  "message": "Erfolgreich - .to Suffix erkannt und beibehalten"
}
```

### Szenario 2: Unbekannte Endung
```
Input: "Show.custom_format.xyz"
Backend-Verarbeitung:
  1. Letzte Endung = .xyz ✗ (NICHT in Whitelist)
  2. Behalte .xyz im Namen → "Show.custom_format"
  3. original_name = "Show.custom_format"
  
Output:
{
  "original_name": "Show.custom_format",
  "status": "success",
  "message": "Unbekannte Endung .xyz beibehalten"
}
```

### Szenario 3: Mehrfache Endungen (bekannt)
```
Input: "Movie.2024.720p.mkv"
Backend-Verarbeitung:
  1. Letzte Endung = .mkv ✓ (in Whitelist)
  2. Entferne .mkv → "Movie.2024.720p"
  3. original_name = "Movie.2024.720p"
  
Output:
{
  "original_name": "Movie.2024.720p",
  "jellyfin_name": "Movie (2024)"
}
```

---

## SICHERHEIT:

✅ Frontend **UND** Backend überprüfen Endungen  
✅ Konsistenz gewährleistet  
✅ Unerwartete Endungen werden behalten (nicht verloren)  
✅ original_name im Backend = Request-Key im Frontend  
✅ Mapping-Fehler unmöglich  

---

**Status:** ✅ READY FOR DEPLOYMENT V4.4

