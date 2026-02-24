# BUGFIX SUMMARY V4.1

## 🎯 Überblick
V4.1 behebt **5 kritische Fehler** die verhinderten, dass Benutzer-Edits gespeichert und zum Server gesendet wurden.

---

## ❌ Fehler #1: Edit-Werte werden nicht gespeichert
**Severity:** 🔴 CRITICAL

### Das Problem
```javascript
// FALSCH - saveEditModal speichert Werte nur wenn gefüllt:
if (fskSelect?.value) STATE.userEdits[filename].fsk = fskSelect.value;
```
...
