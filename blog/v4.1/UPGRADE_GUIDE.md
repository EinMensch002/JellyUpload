# UPGRADE GUIDE V4.0 → V4.1

## 🎯 Warum upgraden?

### V4.0 Problem
```
Benutzer bearbeitet Film-Audience: kids
        ↓
saveEditModal() speichert NICHT (optional chaining bug)
        ↓
finalizeAndUpload() sendet Film ohne Audience-Änderung
        ↓
Film landet in FALSCHER Ordner (FE statt FK) ❌
```

### V4.1 Lösung
```
Benutzer bearbeitet Film-Audience: kids
        ↓
saveEditModal() speichert in STATE.userEdits ✅
        ↓
finalizeAndUpload() mergt edits + sendet audience="kids" ✅
        ↓
resolvePathKeyFromAudience akzeptiert "kids" ✅
        ↓
Film landet im RICHTIGEN Ordner (FK) ✅
```

---

## 📋 Upgrade Checklist

- [ ] Backup von V4.0 erstellen
- [ ] app.js von V4.1 in Production kopieren
- [ ] Browser-Cache leeren (Ctrl+Shift+R)
- [ ] Test: Film-Audience ändern
- [ ] Test: Episode-Name ändern
- [ ] Test: Bulk-Audience für Serie
