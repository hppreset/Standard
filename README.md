# Takt – Zeiterfassung für Freelancer & kleine Teams

Minimalistische Zeit- und Projekterfassung (React + Tailwind CSS + Lucide). Dark Mode als Standard, Light Mode per Toggle.

## Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Produktions-Build nach dist/
```

## Funktionen

- **Live-Timer (Sticky Top-Bar):** Beschreibung, Projekt (Dropdown mit Farbpunkt & Suche), Abrechenbar-Toggle (€), laufende Uhr, Start/Stopp.
  Shortcuts: `S` Start/Stopp, `N` Beschreibung fokussieren, `Enter` im Feld startet den Timer.
- **Timesheet:** Heute- und Wochenansicht mit Tagessummen-Leiste. Inline-Bearbeitung von Beschreibung, Projekt, Start/Ende, Dauer
  (`1:30`, `1,5`, `90m`), Notiz & Datum. ▶ setzt einen Eintrag sofort fort.
- **Projekte:** Name, Kunde, Farbe, Stundensatz, optionales Stundenbudget mit Fortschrittsbalken (gelb ab 80 %, rot ab 100 %).
- **Auswertung:** Stunden heute / Woche / Monat, Anteil abrechenbar, Umsatz, Stunden pro Tag, Aufschlüsselung je Projekt,
  1-Klick-CSV-Export (Semikolon, Dezimalkomma, UTF-8-BOM → Excel-tauglich).

## Daten & Erweiterung auf Supabase

Alle Daten liegen in `localStorage` (`takt:data:v1`). Beim ersten Start werden 3 Beispielprojekte und
5 Einträge der aktuellen Woche angelegt („Demo zurücksetzen“ in der Seitenleiste stellt das wieder her).

Persistenz ist in `src/lib/storage.js` gekapselt (`loadState` / `saveState`). Für Supabase genügt es, diese
Datei gegen Tabellen `projects` und `entries` zu implementieren – das Datenmodell:

| Entity  | Felder |
|---------|--------|
| project | `id, name, client, color, rate, budgetHours, createdAt` |
| entry   | `id, description, note, projectId, billable, start, end` (Unix-ms) |

## Struktur

```
src/
  App.jsx               Layout, Navigation, Theme
  components/           TopBar, EntryRow, ProjectPicker, BillableToggle, InlineInput
  views/                Timesheet, Projects, Reports
  hooks/                useTracker (State + Aktionen), useNow, useTheme
  lib/                  time, stats, csv, seed, storage
```
