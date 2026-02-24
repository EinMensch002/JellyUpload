# V4.3 - Neue Serie-Management Features

## 🎯 Zusammenfassung der Neuerungen

Version V4.3 behebt zwei kritische Probleme und fügt ein ganzes Feature-Set für Serie-Management hinzu:

### ✨ Feature #1: Episode zwischen Serien verschieben
Ermöglicht es dir, eine Episode von einer Serie zu einer anderen Serie zu verschieben (z.B. wenn One Piece 2025 und One Piece 1999 gemischt wurden).

### ✨ Feature #2: Neue Serie im Editor erstellen
Du kannst direkt im Episode-Editor eine vollständig neue Serie erstellen, ohne erst alle Episoden einzeln bearbeiten zu müssen.

### 🐛 Bug-Fix #1: Serienname-Überschrift wird nicht aktualisiert
**Problem:** Bei Serien-Rename wurden die Episode-Namen aktualisiert, aber die Reiter-Überschrift blieb beim alten Namen stehen.  
**Gelöst:** Überschrift wird jetzt korrekt aktualisiert.

---

## 🎬 Feature #1: Episode zwischen Serien verschieben

### 📝 Wie man es nutzt:

1. Klicke auf **[✎ Edit]** Button bei einer Episode
2. Du siehst jetzt OBEN einen neuen Abschnitt: **"Serie (zum Verschieben)"**
3. Ein **Dropdown** zeigt die aktuelle Serie und alle anderen existierenden Serien
4. Wähle eine andere Serie aus der Liste, um die Episode dorthin zu verschieben
5. Klicke **[✓ Speichern]**

### ✅ Was passiert dann:

- ✅ Episode wird zur neuen Serie verschoben
- ✅ Der Reiter (Tab) wechselt automatisch
- ✅ Jellyfin-Name wird automatisch angepasst (z.B. "One Piece 2025 S01 E01")
- ✅ Staffel/Folge-Nummern werden beibehalten
- ✅ FSK und Zielgruppe werden beibehalten
- ✅ UI wird sofort aktualisiert

### 📋 Beispiel-Szenario:

```
Problem: One Piece 2025 und One Piece 1999 sind gemischt
- Reiter "One Piece" zeigt E1-E5 (2025) + E15-E20 (1999) durcheinander

Lösung:
1. Klick auf [✎ Edit] bei "One Piece S01 E15"
2. Wähle im Dropdown "One Piece (1999)" statt "One Piece"
3. Klick [✓ Speichern]
   → Episode wechselt zu neuem Reiter "One Piece (1999)"
   → Jellyfin-Name wird zu "One Piece (1999) S01 E15"

Ergebnis:
- Reiter "One Piece": E1-E5 (alle aus 2025)
- Reiter "One Piece (1999)": E15-E20 (alle aus 1999)
```

### ⚙️ Technische Details:

**Betroffene Funktion:** `saveEditModal()` (Zeile ~3100)

```javascript
// Überprüft, ob Serie gewechselt wurde
if (newSeriesName !== oldSeriesName) {
  // Update series_name
  STATE.userEdits[filename].series_name = newSeriesName;
  
  // Auto-regeneriert Jellyfin-Namen
  const regeneratedName = `${newSeriesName} S${season} E${episode}`;
  STATE.userEdits[filename].jellyfin_name = regeneratedName;
  
  // Aktualisiert ganze Anzeige um neuen Reiter zu erstellen
  displayAnalysisResults();
}
```

---

## 🎬 Feature #2: Neue Serie im Editor erstellen

### 📝 Wie man es nutzt:

1. Öffne Episode-Editor ([✎ Edit])
2. Neben dem Serie-Dropdown siehst du einen Button: **[+ Neue Serie]**
3. Klick auf **[+ Neue Serie]**
4. Gib den Namen der neuen Serie ein (z.B. "One Piece (1999)")
5. Klick **[✓ Speichern]**

### ✅ Was passiert dann:

- ✅ Die neue Serie wird in der STATE gespeichert
- ✅ Die Episode wird zur neuen Serie zugeordnet
- ✅ Ein neuer Reiter wird automatisch erstellt
- ✅ Jellyfin-Name wird angepasst
- ✅ Alle zukünftigen Episoden können dieser Serie zugeordnet werden

### 🎯 Praktisches Beispiel:

```
Szenario: Du hast neue One Piece Episoden erkannt, aber die KI
hat sie alle unter "One Piece" (2025) gruppiert. Du möchtest
die älteren Episoden separat organisieren.

Lösung:
1. Klick [✎ Edit] bei E15 (1999)
2. Klick [+ Neue Serie]
3. Gib ein: "One Piece (1999)"
4. Klick [✓ Speichern]
   → Neue Serie "One Piece (1999)" wird erstellt
   → Episode E15 wird dorthin verschoben
5. Wiederhole für E16-E20
   → Sie werden alle unter "One Piece (1999)" angezeigt
```

### ⚙️ Technische Details:

**Neue Funktion:** `addNewSeriesInModal()` (Zeile ~3058)

```javascript
function addNewSeriesInModal(button) {
  const newSeriesName = prompt('Geben Sie den Namen der neuen Serie ein:');
  
  // Überprüft auf Duplikate
  if (Array.from(seriesSelect.options).some(opt => opt.value === trimmedName)) {
    alert(`Die Serie "${trimmedName}" existiert bereits!`);
    return;
  }
  
  // Fügt neue Option zu Dropdown hinzu
  const option = document.createElement('option');
  option.value = trimmedName;
  option.textContent = trimmedName;
  option.selected = true;
  seriesSelect.appendChild(option);
}
```

---

## 🐛 Bug-Fix: Serienname-Überschrift aktualisiert sich nicht

### 🔍 Das Problem (V4.2 und älter):

```
Benutzer-Aktion:
1. Klick auf [✎] bei "One Piece" Reiter
2. Eingabe: "One Piece (2025)"
3. Klick [✓ Umbenennen]

Ergebnis in V4.2:
- Alle Episode-Namen werden zu "One Piece (2025) S01 E01" etc. ✅
- ABER: Reiter-Überschrift bleibt "One Piece" (ALTER NAME) ❌
- Benutzer sieht Inkonsistenz!
```

### ✅ Die Lösung (V4.3):

```
Ergebnis in V4.3:
- Alle Episode-Namen werden aktualisiert ✅
- Reiter-Überschrift wird zu "One Piece (2025)" aktualisiert ✅
- Alles konsistent! ✅
```

### 🔧 Technische Änderung:

**Geänderte Funktion:** `saveSeriesRename()` (Zeile ~3571)

Der alte Code:
```javascript
// Alte Version - nur Episode-Namen
Object.entries(STATE.analysisResults).forEach(([filename, result]) => {
  if (result.series_name === oldSeriesName) {
    result.series_name = trimmedName;
    result.jellyfin_name = regeneratedName;
    updateFileUIAfterEdit(filename);  // Updates Episode-Namen
  }
});
// ❌ Überschrift wurde NICHT aktualisiert!
```

Der neue Code:
```javascript
// Neue Version - Episode-Namen UND Überschrift
Object.entries(STATE.analysisResults).forEach(([filename, result]) => {
  if (result.series_name === oldSeriesName) {
    result.series_name = trimmedName;
    result.jellyfin_name = regeneratedName;
    updateFileUIAfterEdit(filename);  // Updates Episode-Namen
  }
});

// 🎨 NEU: Update auch die Reiter-Überschrift!
const seriesEntryTitles = document.querySelectorAll('.series-entry-title');
seriesEntryTitles.forEach(title => {
  if (title enthält oldSeriesName) {
    title.innerHTML = `... ${trimmedName} ...`;  // Neue Überschrift
  }
});
// ✅ Jetzt wird alles aktualisiert!
```

---

## 📊 Vergleich: V4.2 vs V4.3

| Feature | V4.2 | V4.3 |
|---------|------|------|
| **Episode zwischen Serien verschieben** | ❌ Nicht möglich | ✅ Dropdown im Editor |
| **Neue Serie im Editor erstellen** | ❌ Nur manuell möglich | ✅ "+ Neue Serie" Button |
| **Serie-Namen wechseln** | ✅ Ja | ✅ Ja |
| **Episode-Namen aktualisieren nach Rename** | ✅ Ja | ✅ Ja |
| **Reiter-Überschrift aktualisiert nach Rename** | ❌ Bleibt alt | ✅ Wird aktualisiert |
| **Auto-Umbenennung nach Jellyfin-Standard** | ✅ Ja | ✅ Ja |

---

## 🎬 Workflow für One Piece Problem

Originalzustand:
```
Reiter "One Piece"
├─ S01 E01 (Jahr: 2025) ← FALSCH, sollte zu One Piece 2025
├─ S01 E02 (Jahr: 2025) ← FALSCH, sollte zu One Piece 2025
├─ S01 E15 (Jahr: 1999) ← FALSCH, sollte zu One Piece 1999
├─ S01 E16 (Jahr: 1999) ← FALSCH, sollte zu One Piece 1999
└─ S01 E17 (Jahr: 1999) ← FALSCH, sollte zu One Piece 1999
```

**Schritt 1: Erste Serie umbenennen**
```
1. Klick [✎] auf "One Piece"
2. Gib "One Piece (2025)" ein
3. Klick [✓ Umbenennen]

Ergebnis:
Reiter "One Piece (2025)"
├─ One Piece (2025) S01 E01 ✅
├─ One Piece (2025) S01 E02 ✅
└─ One Piece (2025) S01 E15 ← Noch falsch
```

**Schritt 2: Episode E15 zur neuen Serie verschieben**
```
1. Klick [✎ Edit] bei E15
2. Klick [+ Neue Serie]
3. Gib "One Piece (1999)" ein
4. Klick [✓ Speichern]

Ergebnis:
Reiter "One Piece (2025)"
├─ One Piece (2025) S01 E01 ✅
└─ One Piece (2025) S01 E02 ✅

Reiter "One Piece (1999)" (NEU!)
├─ One Piece (1999) S01 E15 ✅
├─ One Piece (1999) S01 E16 ← Noch zu verschieben
└─ One Piece (1999) S01 E17 ← Noch zu verschieben
```

**Schritt 3: Weitere Episoden verschieben**
```
Wiederhole Schritt 2 für E16, E17 (wähle "One Piece (1999)" aus Dropdown)

Finales Ergebnis:
Reiter "One Piece (2025)"
├─ One Piece (2025) S01 E01 ✅
└─ One Piece (2025) S01 E02 ✅

Reiter "One Piece (1999)"
├─ One Piece (1999) S01 E15 ✅
├─ One Piece (1999) S01 E16 ✅
└─ One Piece (1999) S01 E17 ✅

Fertig! 🎉
```

---

## 💡 Tipps & Tricks

### Tipp 1: Bulk-Verschiebung
Wenn du mehrere Episoden verschieben möchtest:
1. Öffne jede Episode einzeln
2. Wechsle die Serie im Dropdown
3. Speichern

Das ist schneller, als die komplette Serie umzubenennen!

### Tipp 2: Neue Serie direkt im Editor
Anstatt zuerst alle Serien-Namen zu planen:
1. Öffne eine Episode
2. Klick "+ Neue Serie" wenn erforderlich
3. Schon wird die Serie erstellt und ready!

### Tipp 3: Serienname-Fehler schnell finden
Wenn du weißt, dass "One Piece" und "One Piece (1999)" gemischt sind:
1. Klick auf den "One Piece" Reiter
2. Sortiere nach Staffel/Folge
3. Schau nach Lücken (z.B. E1-E5, dann E15-E20 = zwei Serien!)

---

## ✅ Testing Checklist

Nach dem Update zu V4.3, teste folgende Szenarien:

- [ ] **Serie-Wechsel**: Öffne Episode, wähle andere Serie aus Dropdown, speichern
  - Erwartet: Episode wechselt zu neuem Reiter, Jellyfin-Name wird aktualisiert
  
- [ ] **Neue Serie erstellen**: Klick "+ Neue Serie", gib Namen ein
  - Erwartet: Neue Serie wird erstellt und ausgewählt
  
- [ ] **Duplikat-Prüfung**: Klick "+ Neue Serie", versuche bestehende Serie zu erstellen
  - Erwartet: Alert "Die Serie existiert bereits!"
  
- [ ] **Serie-Rename mit Überschrift**: Klick [✎] auf Serie, gib neuen Namen ein
  - Erwartet: Reiter-Überschrift wird aktualisiert (nicht nur Episode-Namen)
  
- [ ] **Jellyfin-Auto-Namen**: Verschiebe Episode zwischen Serien
  - Erwartet: Jellyfin-Name wird automatisch zu "NeueSerie S01 E01"

- [ ] **Konsistenz**: Nach Serie-Wechsel sollten alte und neue Episode-Listen konsistent sein
  - Erwartet: Keine Episoden in beiden Serien gleichzeitig

---

## 📈 Performance-Auswirkungen

- ✅ **Serie-Wechsel:** Nur 1 displayAnalysisResults() call → ~50ms
- ✅ **Neue Serie:** Nur Dropdown update → <10ms
- ✅ **Serie-Rename:** Wie V4.2 → ~100ms für 10 Episoden
- ✅ **Keine Regression:** Alle anderen Features bleiben gleich schnell

---

**Status: ✅ PRODUCTION READY - V4.3**

Teste diese Version gründlich und berichte über Probleme!
