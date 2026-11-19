import { HOUR, formatDate, formatDuration, formatTime } from './time';
import { entryDuration } from './stats';

const num = (n) => n.toFixed(2).replace('.', ',');

// Text-Zellen escapen + Formel-Injection in Excel verhindern.
function text(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Semikolon-getrennt + Dezimalkomma + BOM → öffnet sauber in deutschem Excel. */
export function buildCsv(entries, projectsById) {
  const header = [
    'Datum', 'Start', 'Ende', 'Dauer (h)', 'Dauer (hh:mm)', 'Projekt', 'Kunde',
    'Beschreibung', 'Notiz', 'Abrechenbar', 'Stundensatz (EUR)', 'Betrag (EUR)',
  ];
  const lines = [header.join(';')];
  let sumH = 0;
  let sumAmount = 0;

  for (const e of [...entries].filter((x) => x.end).sort((a, b) => a.start - b.start)) {
    const p = projectsById.get(e.projectId);
    const ms = entryDuration(e);
    const hours = ms / HOUR;
    const rate = p?.rate ?? 0;
    const amount = e.billable ? hours * rate : 0;
    sumH += hours;
    sumAmount += amount;
    lines.push(
      [
        formatDate(e.start), formatTime(e.start), formatTime(e.end), num(hours), formatDuration(ms),
        text(p?.name ?? ''), text(p?.client ?? ''), text(e.description), text(e.note),
        e.billable ? 'Ja' : 'Nein', num(rate), num(amount),
      ].join(';'),
    );
  }
  lines.push('');
  lines.push(['Summe', '', '', num(sumH), formatDuration(sumH * HOUR), '', '', '', '', '', '', num(sumAmount)].join(';'));
  return '﻿' + lines.join('\r\n');
}

export function downloadFile(filename, content, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
