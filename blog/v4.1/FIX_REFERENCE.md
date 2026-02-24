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

... (gekürzt)
```
