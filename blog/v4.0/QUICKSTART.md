# 🚀 QUICKSTART - Jellyfin Media Sortierung v4.0

**Schnelleinstieg in 5 Minuten**

---

## 📋 Voraussetzungen

- ✅ N8N Server läuft auf `https://192.168.178.145:5678`
- ✅ Browser mit JavaScript aktiviert
- ✅ Temp-Ordner `/media/temp` existiert
- ✅ Ziel-Ordner vorhanden:
  - `/media/Serien/Erwachsene/`
  - `/media/Serien/Kinder/`
  - `/media/Filme/Erwachsene/`
  - `/media/Filme/Kinder/`

---

## ⚡ Schritt 1: Anwendung öffnen

```
https://deine-ip-oder-domain/media-ui
```

**Was siehst du?**
- 📤 Upload-Bereich (Schritt 1)
- 📋 Temp-Ordner-Liste
- ▶ "Dateien analysieren"-Button

---

## 📤 Schritt 2: Dateien hochladen

### Option A: Drag & Drop
- Dateien in die Drop-Zone ziehen
- Oder in die Zone klicken um Dialog zu öffnen

### Option B: Aus Temp-Ordner laden
1. Klick auf "🔄 Ordner neuladen"
2. Wähle Dateien mit Checkboxen aus
3. Klick "▶ Dateien analysieren"

**Unterstützte Formate:**
- `.mp4`, `.mkv`, `.avi`, `.mov`, `.flv`, `.m4v`
- Eigentlich alle Video-Formate

---

## 🔍 Schritt 3: Analysieren

Die App sendet Dateien an N8N zur Analyse:
- 🗄️ Prüft zuerst die Datenbank (schnell)
- 🤖 Falls nicht vorhanden → AI-Analyse
- 💾 Ergebnisse werden gesammelt

**Was du siehst:**
- Fortschrittsbalken pro Datei
- ✅ Erfolg oder ❌ Fehler-Status

---

## ✏️ Schritt 4: Kategorisieren & Auswählen

Die App zeigt kategorisierte Ergebnisse:

### 📺 Serien
```
☑️ Serie "One Piece"          ← Serie-Checkbox
   ├─ ☑️ S01 E01 - Abenteuer...
   ├─ ☑️ S01 E02 - Kampf...
   └─ ☑️ S01 E03 - Sieg...
```

**Möglichkeiten:**
- ☐ Einzelne Episoden abwählen (Checkbox)
- ☐ Ganze Serie abwählen (Serie-Checkbox)
- ✎ Episode bearbeiten (Edit-Button)

### 🎬 Filme
```
☑️ 📄 Inception (2010)
☑️ 📄 The Matrix (1999)
```

**Möglichkeiten:**
- ☐ Einzelne Filme abwählen
- ✎ Film bearbeiten

---

## 🎨 Schritt 5: Bearbeiten (Optional)

Klick auf **✎ Edit** um zu ändern:

### 📺 Episode-Editor
- **Jellyfin-Name:** `One Piece S1 E1`
- **Serie:** `One Piece`
- **Staffel/Episode:** 1/1
- **Zielgruppe:** 👶 Kinder / 👨 Erwachsene
- **FSK:** 0, 6, 12, 16, 18

### 🎬 Film-Editor
- **Jellyfin-Name:** `Inception`
- **Zielgruppe:** 👶 Kinder / 👨 Erwachsene
- **FSK:** 0, 6, 12, 16, 18

**Bulk-Edit für Serien:**
Oben in der Serie-Zeile:
- FSK für ALLE Episoden setzen
- Zielgruppe für ALLE Episoden setzen

---

## ✓ Schritt 6: Finalisieren

1. **Überprüfe Auswahl:**
   - Alle unwanted Dateien sind abgewählt ☐
   - Alle needed Dateien sind ausgewählt ☑️

2. **Klick "✓ Fertigstellen"**

**Was passiert:**
- 🔗 POST-Requests an N8N `/finalize` Endpoint
- 📊 Für jede Datei: `originalName`, `path`, `audience`, `mediaType`, etc.
- ✅ N8N organisiert Dateien in richtige Verzeichnisse
- 🔄 Seite wird automatisch neu geladen

**Erfolg:**
- Alert: "✅ Alle Dateien erfolgreich verarbeitet!"
- Seite lädt neu
- Session wird zurückgesetzt
- Bereit für nächsten Batch!

---

## 🐛 Schritt 7: Debug & Troubleshooting

### Debug-Panel öffnen
1. Klick auf **🐛-Button** unten rechts
2. Wähle **"Logs"**-Tab
3. Scroll für Details

### Detaillierte Logs (Advanced)
1. URL Parameter hinzufügen: `?debug=true`
2. Debug-Panel zeigt jetzt **expandable** Details
3. Klick auf Log-Einträge zum Expandieren

### Häufige Fehler

| Fehler | Lösung |
|--------|--------|
| ❌ "Keine Dateien ausgewählt" | Mindestens 1 Checkbox muss aktiviert sein ☑️ |
| ❌ "Original-Daten fehlen" | Datei wurde nicht korrekt analysiert, erneut versuchen |
| ⚠️ "Path-Key nicht gefunden" | `app.json` paths-Sektion überprüfen |
| 🔗 "Network Error" | N8N Server erreichbar? Firewall? |

---

## 🎯 Keyboard Shortcuts (Optional)

| Taste | Aktion |
|-------|--------|
| `?` | Dieser Guide öffnen |
| `D` | Debug-Panel öffnen |
| `Ctrl+A` | Alle Dateien auswählen |
| `Ctrl+Shift+A` | Alle abwählen |
