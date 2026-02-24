# V4.3 Deployment Checklist

## Pre-Deployment

- [ ] **BackupV4.3 vollständig?**
  ```bash
  ls -la BackupV4.3/
  # Sollen sichtbar sein:
  # - app.js
  # - app.json
  # - index.html
  # - style.css
  # - RELEASE_SUMMARY.md
  # - SERIES_MANAGEMENT_FEATURES.md
  # - TECHNICAL_CHANGES.md
  # - EXECUTIVE_SUMMARY_FOR_USER.md
  ```

- [ ] **Syntax OK?**
  ```bash
  node -c app.js
  # Sollte: (keine Ausgabe = OK)
  ```

- [ ] **app.js Größe realistisch?**
  ```bash
  wc -l app.js
  # Sollte: 4140 Zeilen (war 4034, +106 neue Zeilen)
  ```

## Deployment

- [ ] **Sicherung erstellen**
  ```bash
  cp app.js app.js.backup-v4.2
  ```

- [ ] **V4.3 deployen**
  ```bash
  cp BackupV4.3/app.js ./
  echo "✅ Deployment complete"
  ```

- [ ] **Bestätigung checken**
  ```bash
  grep -n "Serie (zum Verschieben)" app.js
  # Sollte Zeilen mit dieser Text zeigen
  ```

## Post-Deployment Testing

### Browser Testing (öffne die App):

- [ ] **Page Load**
  - Seite lädt normal
  - Keine Fehler in DevTools Console (F12)
  - Keine roten Fehlermeldungen

- [ ] **Normale Funktionen funktionieren**
  - [✎ Edit] für Episode öffnet Modal
  - [✎] auf Serien-Name funktioniert
  - Bulk-Edit funktioniert

- [ ] **Neue Features sichtbar**
  - Episode-Editor zeigt NEUEN Abschnitt: "Serie (zum Verschieben)"
  - Dropdown zeigt existierende Serien
  - [+ Neue Serie] Button ist sichtbar und klickbar

### Feature Testing:

- [ ] **Serie-Wechsel funktioniert**
  ```
  1. [✎ Edit] auf Episode klicken
  2. Serie-Dropdown: andere Serie auswählen
  3. [✓ Speichern] klicken
  4. Erwartung: Episode wechselt zu neuem Reiter
  ```

- [ ] **Neue Serie erstellen funktioniert**
  ```
  1. [✎ Edit] auf Episode klicken
  2. [+ Neue Serie] klicken
  3. "Test Serie" eingeben
  4. [✓ Speichern] klicken
  5. Erwartung: Neuer Reiter "Test Serie" wird erstellt
  ```

- [ ] **Serie-Rename Überschrift wird aktualisiert**
  ```
  1. [✎] auf Serien-Namen klicken
  2. Neuen Namen eingeben (z.B. "Test (2025)")
  3. [✓ Umbenennen] klicken
  4. Erwartung: Reiter-Überschrift ändert sich sofort
  5. Erwartung: Episode-Namen werden auch aktualisiert
  ```

- [ ] **Auto-Rename nach Jellyfin-Standard**
  ```
  1. [✎ Edit] auf Episode klicken
  2. Serie zu "New Series" wechseln
  3. [✓ Speichern] klicken
  4. Erwartung: Jellyfin-Name wird zu "New Series SXX EYY"
  ```

- [ ] **FSK/Audience bleiben erhalten**
  ```
  1. Episode mit FSK=12, Audience=kids
  2. Serie-Wechsel durchführen
  3. [✓ Speichern]
  4. Erwartung: FSK=12 und Audience=kids bleiben
  ```

### Edge Cases:

- [ ] **Duplikat-Prüfung bei neue Serie**
  ```
  1. [+ Neue Serie] klicken
  2. Existierende Serie-Namen eingeben (z.B. "One Piece")
  3. Erwartung: Alert "existiert bereits"
  ```

- [ ] **Konsistenz nach Serie-Wechsel**
  ```
  1. Episode E1 zu "Serie A" verschieben
  2. Episode E2 zu "Serie A" verschieben
  3. Beide sollten unter "Serie A" sein
  4. Alte Serie sollte sie nicht mehr enthalten
  ```

## Rollback Plan (falls etwas schiefgeht)

- [ ] **V4.2 zurückstellen**
  ```bash
  cp app.js.backup-v4.2 app.js
  # Browser: Strg+Shift+R (Cache leeren)
  ```

- [ ] **Fehler dokumentieren**
  ```
  Notiere:
  - Was funktioniert nicht?
  - Welche Schritte führen zu Fehler?
  - Was zeigt die Browser-Console?
  ```

## Success Indicators

 Deployment erfolgreich wenn:
- [ ] Keine JavaScript-Fehler in Console
- [ ] Episode-Editor zeigt neue Serie-Dropdown
- [ ] Serie-Wechsel funktioniert (Episode wechselt Reiter)
- [ ] Neue Serien können erstellt werden
- [ ] Serienname-Überschrift wird aktualisiert
- [ ] Alte Features funktionieren noch

## Sign-Off

- [ ] **Deployment durchgeführt von:** _______________
- [ ] **Datum:** _______________
- [ ] **Testing abgeschlossen:** _______________
- [ ] **Alles funktioniert:** ✅ JA / ❌ NEIN
- [ ] **Notizen:** _______________

---

**Status: Bereit zum Deployment** ✅

Fahre fort mit: `cp BackupV4.3/app.js ./app.js`
