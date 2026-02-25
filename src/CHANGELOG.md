
# Changelog — v4.5 (src)

Veröffentlicht: 25. Februar 2026

**Major Update: JellyUpload v4.5**

- **UI-Update & Branding:** Die gesamte Benutzeroberfläche wurde auf "JellyUpload v4.5" umgestellt. Alle veralteten Bezeichnungen ("Dateisortierung v3") wurden entfernt, das Branding und die Version sind jetzt konsistent.
- **Bereinigung & Modernisierung:** index.html wurde bereinigt und modernisiert. Unnötige und veraltete Inhalte wurden entfernt, die Struktur und Beschreibungen sind jetzt klar und auf den neuen Workflow abgestimmt.
- **Debug-System:** Debug-Panel und Logging sind jetzt vollständig konfigurierbar über app.json und URL-Parameter. Debug-UI wird nur angezeigt, wenn aktiviert.
- **Konfigurationsstruktur:** app.json enthält jetzt eine exportierbare fileExtensions-Konfiguration für Videoformate, sowie zentrale Pfad- und API-Einstellungen.
- **Analyse- und Upload-Flow:** Verbesserte Logik für Datei-Upload, Analyse und Finalisierung. Alle Workflows sind auf die neue Konfiguration und UI abgestimmt.
- **Release-Komplettierung:** Alle Release-Dateien und Dokumentationen für v4.5 wurden erstellt und aktualisiert.

Weitere Details und Implementierungsnotizen:

- Implementation und Beispiele: [src/ANALYSE_DB_INTEGRATION.md](https://github.com/EinMensch002/JellyUpload/blob/main/src/ANALYSE_DB_INTEGRATION.md)
- Projektübersicht und Endpoints: [src/README.md](https://github.com/EinMensch002/JellyUpload/blob/main/src/README.md)
- Release-Notes und technische Änderungen: [blog/v4.5/TECHNICAL_CHANGES.md](https://github.com/EinMensch002/JellyUpload/blob/main/blog/v4.5/TECHNICAL_CHANGES.md)

---

# Changelog — v4.4 (src)

Veröffentlicht: 24. Februar 2026

Kurzüberblick der markanten Änderungen, die `src` betreffen:

- **Kritischer Bugfix:** `removeFileExtension()` repariert — Dateiendungen werden jetzt korrekt erkannt und entfernt, wodurch fehlerhafte Mapping- und Analyse-Ergebnisse verhindert werden.
- **Datenbank-Integration:** UI sendet nun `files` (Dateinamen OHNE Endung) zusammen mit `originalFiles` (mit Endung) an den Server, damit ein DB-Cache Wiederholungsanfragen beantwortet und AI‑Tokens gespart werden.
- **Analyse-Flow:** `analyzeFiles()` erzeugt ein Mapping (ohne Endung → Originalname) und mappt Server-Antworten zurück auf die Originaldateien, wodurch UI und Persistenz konsistent bleiben.
- **Performance-Verbesserung:** DB-Check vor AI-Analyse reduziert Latenz und Kosten für bereits bekannte Dateien.
- **Robustheit & Logging:** Verbesserte Fallback-Logik bei fehlendem Mapping und erweiterte Debug-Ausgaben für bessere Fehlersuche.
- **Konfiguration:** `app.json` ist auf Version `4.4` dokumentiert (N8N-Endpunkte und Pfade). Siehe die Konfigurationsangaben in der `src`-Dokumentation.

Weitere Details und Implementierungsnotizen:

- Implementation und Beispiele: [src/ANALYSE_DB_INTEGRATION.md](https://github.com/EinMensch002/JellyUpload/blob/main/src/ANALYSE_DB_INTEGRATION.md)
- Projektübersicht und Endpoints: [src/README.md](https://github.com/EinMensch002/JellyUpload/blob/main/src/README.md)

Wenn du möchtest, kann ich noch ein kurzes, einseitiges "Highlights"-Dokument erstellen oder diese Änderung in die Release-Notizen unter `releases/v4.4` übernehmen.
