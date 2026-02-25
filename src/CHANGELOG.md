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

- Implementation und Beispiele: [src/ANALYSE_DB_INTEGRATION.md](ANALYSE_DB_INTEGRATION.md)
- Projektübersicht und Endpoints: [src/README.md](README.md)

Wenn du möchtest, kann ich noch ein kurzes, einseitiges "Highlights"-Dokument erstellen oder diese Änderung in die Release-Notizen unter `releases/v4.4` übernehmen.
