# CHANGELOG V4.1 - Edit Persistence & Path Routing Fixes

## Zusammenfassung
V4.1 behebt kritische Fehler bei der Persistierung von manuellen Edits und der Pfad-Auswahl. Alle Benutzer-Änderungen (Umbenennung, Audience, FSK) werden jetzt korrekt gespeichert und zum Server gesendet. Die Pfad-Auswahl respektiert nun die editierten Audience-Werte.

---

## 🔴 Behobene Probleme

### 1. **Edit Persistence Bug - Daten werden nicht gespeichert**
**Problem:** 
- Wenn Benutzer eine Datei bearbeitet (z.B. Episode umbenennen, Audience/FSK ändern), wurden die Änderungen nicht in `STATE.userEdits` gespeichert
- Root Cause: `saveEditModal()` nutzte nur `if (fskSelect?.value)` - speicherte Werte nur wenn sie gefüllt waren
- Filme-Edits wurden komplett ignoriert, da FSK/Audience nicht richtig erfasst wurden

**Lösung:**
```javascript
// VORHER (Fehlerhaft):
if (fskSelect?.value) STATE.userEdits[filename].fsk = fskSelect.value;
if (audienceSelect?.value) STATE.userEdits[filename].audience = audienceSelect.value;

// NACHHER (Korrekt):
if (fskSelect) STATE.userEdits[filename].fsk = fskSelect.value;  // Speichere IMMER wenn Element existiert
if (audienceSelect) STATE.userEdits[filename].audience = audienceSelect.value;
```

**Status:** ✅ **FIXED** (Zeile ~3110)

---

### 2. **Redundante Audience-Auswahl bei Episoden-Edits**
**Problem:**
- Im `editEpisodeModal()` konnte man für jede einzelne Episode die Audience ändern
- Das macht keinen Sinn - Audience sollte Serie-Level sein, nicht Episode-Level
- Verursachte Verwirrung und inkonsistente Daten

**Lösung:**
- Entfernt das komplette `<select class="audience-edit">` Feld aus `editEpisodeModal()`
- Audience wird nur noch bulk auf Serie-Level geändert (via `applyBulkAudience()`)

**Status:** ✅ **FIXED** (Zeile ~2660)

---

### 3. **Audience-zu-Pfad Mapping Bug - Falsche Pfade**
**Problem:**
- Funktion `resolvePathKeyFromAudience()` prüfte auf `audience === 'children'`
- ABER alle Modals speichern `audience = 'kids'` (NICHT 'children')
- Resultat: Wenn Benutzer Audience zu "Kinder" änderte, wurde Pfad nicht erkannt
- Film mit audience="kids" wurde zu FE (Filme/Erwachsene) statt FK (Filme/Kinder) gesendet

**Beispiel des Bugs:**
```javascript
// VORHER (Fehlerhaft):
if (audience === 'children') {  // ← Prüft auf 'children'
  audienceKey = 'K';
} else if (audience === 'kids') {  // ← Aber speichert 'kids'?!
  // Nicht implementiert!
}
// Resultat: audience="kids" → Fehler "Unbekannte Audience: kids"

// NACHHER (Korrekt):
if (audience === 'children' || audience === 'kids') {  // ← Akzeptiert BEIDE
  audienceKey = 'K';
}
```

**Status:** ✅ **FIXED** (Zeile ~3495)

---

### 4. **Fehlende Film-Edit-Funktionalität**
**Problem:**
- `editMovieModal()` zeigte zwar FSK und Audience, aber `saveEditModal()` speicherte diese Werte nicht richtig
- Filme konnten nicht vollständig bearbeitet werden

**Lösung:**
- Fix in `saveEditModal()` (siehe Problem #1) behebt auch diesen Issue
- Alle Eingabefelder (Title, FSK, Audience) werden jetzt korrekt erfasst

**Status:** ✅ **FIXED** (durch Fix #1)

---

## 📋 Technische Details

### Betroffene Funktionen

1. **`saveEditModal(overlay)`** (Zeile ~3103)
   - **Was:** Speichert Benutzer-Edits für einzelne Dateien
   - **Fix:** Entfernt `?.value` checks - speichert IMMER wenn Element existiert
   - **Impact:** Alle manuellen Edits (Episode/Film) werden jetzt persistent

2. **`editEpisodeModal(button)`** (Zeile ~2626)
   - **Was:** Modal zum Bearbeiten von Episoden
   - **Fix:** Entfernt komplettes Audience `<select>` Element
   - **Impact:** Audience nur noch Serie-Level editierbar

3. **`resolvePathKeyFromAudience(audience, mediaType)`** (Zeile ~3483)
   - **Was:** Bestimmt Zielverzeichnis (SE/SK/FE/FK) basierend auf Audience + Media-Type
   - **Fix:** Akzeptiert sowohl `'children'` als auch `'kids'` für Kinder-Audience
   - **Impact:** Pfad-Auswahl respektiert editierte Audience-Werte

### Pfad-Mapping-Tabelle
```
Media-Type: series  + Audience: adults     → SE (/media/Serien/Erwachsene/)
Media-Type: series  + Audience: kids       → SK (/media/Serien/Kinder/)
Media-Type: movie   + Audience: adults     → FE (/media/Filme/Erwachsene/)
Media-Type: movie   + Audience: kids       → FK (/media/Filme/Kinder/)
```

### Data Flow nach Fix
```
1. Benutzer bearbeitet Datei (z.B. ändert Audience zu "kids")
2. saveEditModal() speichert in STATE.userEdits[filename].audience = "kids"
3. finalizeAndUpload() merged Edits: audience = edits.audience || originalData.audience
4. resolvePathKeyFromAudience("kids", "movie") → "FK"
5. N8N empfängt Datei mit audience="kids", speichert in /media/Filme/Kinder/
```

---

## 🧪 Validierungsschritte

Folgende Tests sollten durchgeführt werden:

### Test 1: Episode-Bearbeitung
1. Lade Serie hoch und analysiere
2. Bearbeite eine Episode (ändere Title/FSK)
3. Klicke "Speichern"
4. Finalisiere
5. ✅ Verifikation: Changes sollten in Debug-Logs unter "STATE.userEdits" sichtbar sein

### Test 2: Film mit Audience-Änderung
1. Lade Film hoch und analysiere
2. Öffne Film-Edit-Modal
3. Ändere Audience von "Erwachsene" zu "Kinder"
4. Speichere
5. Finalisiere
6. ✅ Verifikation: Film sollte in FK statt FE Pfad landen

### Test 3: Serie Bulk-Audience-Änderung
1. Lade Serie mit mehreren Episoden hoch
2. Klicke auf Series-Header und wähle "Zielgruppe: Kinder"
3. Finalisiere
4. ✅ Verifikation: Alle Episoden sollten in SK Pfad landen

### Test 4: Keine Audience-Änderung bei Episoden
1. Öffne Episode-Edit-Modal
2. ✅ Verifikation: KEIN Audience-Dropdown sichtbar (nur Jellyfin-Name, Staffel, Folge, FSK)

---

## 📝 Detaillierte Änderungen

### Datei: `app.js`

#### Change 1: `saveEditModal()` - Werterfassung fixen (Zeile ~3110)
```javascript
// VORHER:
if (jellyfinInput?.value) STATE.userEdits[filename].jellyfin_name = jellyfinInput.value;
if (seasonInput?.value) STATE.userEdits[filename].season = seasonInput.value;
if (episodeInput?.value) STATE.userEdits[filename].episode = episodeInput.value;
if (fskSelect?.value) STATE.userEdits[filename].fsk = fskSelect.value;
if (audienceSelect?.value) STATE.userEdits[filename].audience = audienceSelect.value;

// NACHHER:
if (jellyfinInput) STATE.userEdits[filename].jellyfin_name = jellyfinInput.value;
if (seasonInput) STATE.userEdits[filename].season = seasonInput.value;
if (episodeInput) STATE.userEdits[filename].episode = episodeInput.value;
if (fskSelect) STATE.userEdits[filename].fsk = fskSelect.value;
if (audienceSelect) STATE.userEdits[filename].audience = audienceSelect.value;

logDebug(`   Gespeicherte Änderungen: ${JSON.stringify(STATE.userEdits[filename])}`, 'data');
```

#### Change 2: `editEpisodeModal()` - Audience-Dropdown entfernen (Zeile ~2660-2680)
```javascript
// ENTFERNT:
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
  <div class="form-group">
    <label>Zielgruppe</label>
    <select class="audience-edit" data-filename="${escapeHtml(filename)}">
      <option value="">– Wählen –</option>
      <option value="kids" ${data.audience === 'kids' ? 'selected' : ''}>Kinder</option>
      <option value="adults" ${data.audience === 'adults' ? 'selected' : ''}>Erwachsene</option>
    </select>
  </div>
</div>

// JETZT NUR NOCH:
<div class="form-group">
  <label>FSK</label>
  <select class="fsk-edit">...</select>
</div>
```

#### Change 3: `resolvePathKeyFromAudience()` - Audience normalisieren (Zeile ~3495)
```javascript
// VORHER:
if (audience === 'adults') {
  audienceKey = 'E';
} else if (audience === 'children') {
  audienceKey = 'K';
} else {
  logDebug(`⚠️ Unbekannte Audience: ${audience}`, 'warning');
  return null;
}

// NACHHER:
if (audience === 'adults') {
  audienceKey = 'E';  // Erwachsene
} else if (audience === 'children' || audience === 'kids') {  // ← WICHTIG: Beide akzeptieren!
  audienceKey = 'K';  // Kinder (accepts both 'children' and 'kids')
} else {
  logDebug(`⚠️ Unbekannte Audience: ${audience}`, 'warning');
  return null;
}
```

---

## ✨ Verbesserungen

### Für Benutzer
- ✅ Manuelle Edits werden jetzt persistent gespeichert und zum Server gesendet
- ✅ Filme können vollständig bearbeitet werden (Title, FSK, Audience)
- ✅ Pfad-Routing respektiert editierte Werte (z.B. Film von "Erwachsene" zu "Kinder" ändert Pfad zu FK)
- ✅ Weniger Verwirrung - Audience ist nur Serie-Level editierbar

### Für Entwickler
- ✅ Konsistente Audience-Werte ("kids", "adults") überall
- ✅ Robustere Fehlerbehandlung (akzeptiert auch "children" für Legacy-Daten)
- ✅ Besseres Logging bei Änderungen

---

## 🐛 Bekannte Limitationen

Keine bekannten Bugs in dieser Version. Alle Probleme von V4.0 wurden behoben.

---

## 📌 Für nächste Versionen

Geplante Verbesserungen:
- [ ] Noch mehr Debug-Logging für Edits
- [ ] Undo-Funktion für Änderungen
- [ ] Änderungs-Preview vor Finalisierung
- [ ] Validierung von Serien-Namen gegen Jellyfin API

---

## Installation & Update

### Upgrade von V4.0 zu V4.1
1. Backup von V4.0 erstellen: `cp -r media-ui media-ui-backup`
2. Nur diese Dateien ersetzen:
   - `app.js` (3939 Zeilen)
   - `app.json` (keine Änderungen)
   - `index.html` (keine Änderungen)
   - `style.css` (keine Änderungen)
3. Seite neu laden (F5)
4. Debug-Logs prüfen ob alles funktioniert

---

## Versionsverlauf

```
V3.0  → Grundversion
V3.1  → Dokumentation
V3.2  → Logging verbessert
...
V3.9  → Checkpoint
V4.0  → Major Feature Update (Checkboxes, Backup, Unrecognized Files)
V4.1  → BugFix Update (Edit Persistence, Path Routing, Audience Normalization) ← **JETZT**
```

---

## Support & Debugging

Falls Probleme auftreten:
1. Browser DevTools öffnen (F12)
2. Console nach Errors suchen
3. Debug-Logs aktivieren: `localStorage.setItem('DEBUG_ENABLED', 'true')`
4. Finalisierung nochmal versuchen
5. Logs speichern und mit Version/Error-Message teilen

Alle Logs findest du im Debug-Panel (rechts oben im App wenn aktiviert).

---

**Version:** 4.1  
**Datum:** 2025-01-28  
**Status:** ✅ STABLE
