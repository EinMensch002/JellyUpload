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
... (vollständige Details in FIX_REFERENCE.md)
