// Wandelt dist-artifact/index.html in Seiteninhalt ohne <html>/<head>/<body>-Gerüst um
// (das Gerüst ergänzt die Artifact-Plattform beim Veröffentlichen).
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-artifact/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];

const pick = (re) => [...head.matchAll(re)].map((m) => m[0]);
const title = pick(/<title>[\s\S]*?<\/title>/g);
const metas = pick(/<meta name="(theme-color|description)"[^>]*>/g);
const links = pick(/<link rel="stylesheet"[^>]*>/g);
const styles = pick(/<style[\s\S]*?<\/style>/g);
const scripts = pick(/<script[\s\S]*?<\/script>/g);

const out = [
  '<title>Takt Zeiterfassung</title>',
  ...metas,
  ...links,
  ...styles,
  // In der Vorschau polstert die Plattform bereits :root um die Safe-Area.
  '<style>.safe-pad-top{padding-top:0}</style>',
  body.trim(),
  ...scripts,
].join('\n');

writeFileSync('dist-artifact/takt.html', out);
console.log(`dist-artifact/takt.html  ${(out.length / 1024).toFixed(0)} KB  (title: ${title.length ? 'ersetzt' : '—'})`);
