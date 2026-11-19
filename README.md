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

## Progressive Web App

Takt ist als PWA installierbar (Desktop, Android, iOS) und funktioniert vollständig offline.

- **Installieren:** Button „App installieren“ in der Seitenleiste bzw. „Installieren“ oben auf dem Smartphone.
  Chrome/Edge/Android zeigen den nativen Dialog, auf iPhone/iPad erscheint die Anleitung
  (Safari → Teilen → „Zum Home-Bildschirm“).
- **Offline:** Ein Service Worker (Workbox, via `vite-plugin-pwa`) hält App und Schriften vor. Die Schriften sind
  lokal eingebunden (`@fontsource`), es gibt keine externen Requests.
- **Updates:** Neue Versionen werden erst nach Klick auf „Aktualisieren“ aktiv, damit ein laufender Timer nicht durch einen Reload unterbrochen wird.
  Die App prüft stündlich auf Updates.
- **App-Shortcuts** (Rechtsklick/Long-Press aufs Icon): „Timer starten“, „Auswertung“.
- **Datenschutz vor Löschung:** Die App fordert `navigator.storage.persist()` an, damit der Browser die lokalen Daten
  nicht automatisch entfernt.

**Hosting:** Service Worker laufen nur über **HTTPS** (oder `localhost`). `npm run build` erzeugt
ein statisches `dist/`, das sich z. B. auf Netlify, Vercel, Cloudflare Pages oder GitHub Pages hosten lässt.
Lokal testen: `npm run build && npm run preview`. Im Dev-Server (`npm run dev`) ist der Service Worker absichtlich deaktiviert.

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
  components/           TopBar, EntryRow, ProjectPicker, BillableToggle, InlineInput, PwaStatus
  views/                Timesheet, Projects, Reports
  hooks/                useTracker (State + Aktionen), useNow, useTheme, usePwa (Install/Online)
public/                 Icons (192/512/maskable/apple-touch), favicon.svg
  lib/                  time, stats, csv, seed, storage
```
