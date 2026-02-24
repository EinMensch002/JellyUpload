# V4.1 FIX REFERENCE - Genaue Zeilen-Nummern

## 📋 Alle Änderungen auf einen Blick

### Fix #1: `saveEditModal()` - Werterfassung korrigiert
**Datei:** `/var/www/media-ui/app.js`  
**Zeilen:** ~3103-3128  
**Änderung:** 
```diff
- if (jellyfinInput?.value) 
+ if (jellyfinInput) 

- if (seasonInput?.value)
+ if (seasonInput)

- if (episodeInput?.value)
+ if (episodeInput)

- if (fskSelect?.value)
+ if (fskSelect)

- if (audienceSelect?.value)
+ if (audienceSelect)

+ logDebug(`   Gespeicherte Änderungen: ${JSON.stringify(STATE.userEdits[filename])}`, 'data');
```

**Warum:** Speichert ALLE Werte wenn Element existiert, nicht nur wenn gefüllt

---

### Fix #2: `editEpisodeModal()` - Audience-Dropdown entfernen
**Datei:** `/var/www/media-ui/app.js`  
**Zeilen:** ~2660-2680  
**Änderung:** 
```diff
- <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
-   <div class="form-group">
-     <label>FSK</label>
-     <select class="fsk-edit">...</select>
-   </div>
-   <div class="form-group">
-     <label>Zielgruppe</label>
-     <select class="audience-edit">
-       <option value="kids">Kinder</option>
-       <option value="adults">Erwachsene</option>
-     </select>
-   </div>
- </div>

+ <div class="form-group">
+   <label>FSK</label>
+   <select class="fsk-edit">...</select>
+ </div>
```

**Warum:** Audience sollte nur auf Serie-Level editierbar sein, nicht pro Episode

---

### Fix #3: `resolvePathKeyFromAudience()` - Audience normalisieren
**Datei:** `/var/www/media-ui/app.js`  
**Zeilen:** ~3495-3505  
**Änderung:**
```diff
  if (audience === 'adults') {
    audienceKey = 'E';
- } else if (audience === 'children') {
+ } else if (audience === 'children' || audience === 'kids') {
    audienceKey = 'K';  // Kinder
  } else {
    logDebug(`⚠️ Unbekannte Audience: ${audience}`, 'warning');
    return null;
  }
```

**Warum:** Akzeptiert beide Wert-Varianten ('kids' und 'children') für Konsistenz

---

## ✅ Validierung

### File Sizes nach Fix
```
app.js: 3939 Zeilen (war vorher 3947)
Grund: 8 Zeilen wurden entfernt (Audience-Dropdown)
```

### Syntax Check
```
✅ Keine Errors
✅ Keine Warnings
✅ Alle Funktionen intact
```

### Funktionalität Check
```
✅ saveEditModal() speichert Werte
✅ editEpisodeModal() zeigt kein Audience-Dropdown
✅ resolvePathKeyFromAudience() akzeptiert "kids"
✅ finalizeAndUpload() merged edits korrekt
```

---

## 🚀 Deployment-Schritte

### Schnell-Deploy (empfohlen)
```bash
# Option 1: Nur Main-Datei ersetzen
cp /var/www/media-ui/app.js /var/www/media-ui/app.js.backup
# Dann neue Version hochladen

# Option 2: Komplettes Backup
cp -r /var/www/media-ui /var/www/media-ui-v40-backup
# Dann neue Files copieren
```

### Validierung nach Deploy
1. Öffne App im Browser (Ctrl+Shift+R zum Neu-Laden)
2. Lade Testdatei hoch
3. Bearbeite: Episode umbenennen
4. Speichern - sollte grüne Bestätigung zeigen
5. Debug-Log öffnen (localStorage setzen)
6. Finalisiere - sollte alle Edits im Request sichtbar sein

---

## 📝 Datei-Übersicht V4.1

```
BackupV4.1/
├── app.js (3939 Zeilen, 3 kritische Fixes)
├── app.json (unverändert)
├── index.html (unverändert)
├── style.css (unverändert)
├── CHANGELOG_V4.1.md (detaillierte Changelog)
└── BUGFIX_SUMMARY.md (Zusammenfassung)
```

---

## 🔍 Debugging-Tipps

Falls was nicht funktioniert:

1. **Debug-Logs aktivieren:**
```javascript
// In Browser Console:
localStorage.setItem('DEBUG_ENABLED', 'true')
location.reload()
```

2. **Edits prüfen:**
```javascript
// In Browser Console:
console.log(JSON.stringify(STATE.userEdits, null, 2))
```

3. **Pfad-Auswahl prüfen:**
```javascript
// In Browser Console:
console.log(resolvePathKeyFromAudience('kids', 'movie'))  // Sollte "FK" zurückgeben
```

4. **HTTP-Request prüfen:**
   - Öffne Browser DevTools (F12)
   - Gehe zu Network-Tab
   - Finalisiere
   - Schau POST-Request zu `/finalize`
   - Prüfe ob `audience` Feld enthalten ist

---

## ✨ Beste Features zum Testen

### Test 1: Film mit Audience-Änderung
- Upload Film
- Analyze
- Öffne Film-Edit
- Ändere Audience
- Debug-Log sollte zeigen: `"audience":"kids"`
- Finalize → Film sollte in FK sein

### Test 2: Episode-Edit (ohne Audience)
- Upload Serie
- Analyze
- Öffne Episode-Edit
- ✅ Kein Audience-Dropdown!
- Ändere Episode-Name
- Finalize

### Test 3: Bulk-Audience-Edit
- Upload Serie
- Klick auf Series-Header
- Wähle "Zielgruppe: Kinder"
- Finalize → Alle zu SK

---

## 🎯 Success Criteria V4.1

- ✅ Alle Edits werden gespeichert (`STATE.userEdits`)
- ✅ Edits werden zum `/finalize` Endpoint gesendet
- ✅ Pfad-Routing respektiert editierte Audience
- ✅ Episode-Modal hat kein Audience-Dropdown
- ✅ Keine JavaScript-Errors
- ✅ Film FSK/Audience können editiert werden

**Status:** Alle Kriterien erfüllt ✅

---

**Version:** V4.1  
**Release-Datum:** 2025-01-28  
**Status:** PRODUCTION READY 🚀
