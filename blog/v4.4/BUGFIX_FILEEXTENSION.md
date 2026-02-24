# V4.4 - Critical Bug Fix: Dateiendungs-Erkennung

## 🐛 Problem

**Was war kaputt:**

Dateien mit Namen wie `Arcane S01E01 S.to.mp4` wurden falsch verarbeitet: ...

## ✅ Lösung (V4.4)

Die neue `removeFileExtension()`-Logik erkennt 50+ bekannte Video-Erweiterungen und entfernt intelligente Endungen. Siehe Originaldatei im Release-Ordner für komplette Details.
