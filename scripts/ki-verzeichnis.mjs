// Erzeugt den Tabellenteil von documentation/report/12-ki-verzeichnis.md aus den
// Sessiondateien unter ai/. Die handgeschriebene Präambel bleibt unangetastet:
// ersetzt wird nur der Bereich zwischen den GENERIERT-Markern.
//
// Aufruf: npm run docs:ki-verzeichnis   (aus frontend/)

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const AI_DIR = join(REPO, 'ai');
const TARGET = join(REPO, 'documentation', 'report', '12-ki-verzeichnis.md');

const START = '<!-- GENERIERT:START -->';
const END = '<!-- GENERIERT:ENDE -->';

// Die sechs Kategorien in Berichtsreihenfolge, mit ihren Abschnittstiteln.
const TOPICS = [
  ['engine', 'Simulation & Engine'],
  ['wasm-bridge', 'WASM-Grenze & Bridge'],
  ['frontend-ui', 'Frontend, UI & Rendering'],
  ['loop-input', 'Spiel-Loop & Steuerung'],
  ['tooling-tests', 'Tooling, Tests & Qualität'],
  ['prozess-doku', 'Prozess, Konventionen & Dokumentation'],
];

// Abbildung der internen Kürzel auf die Formulierungen des Anforderungskatalogs.
const USES = {
  'rein-informativ': 'Rein informativ',
  'recherche-informativ': 'Recherche, rein informativ',
  impl: 'Zur Implementierung verwendet',
  uebernommen: 'Übernommen',
  ueberarbeitet: 'Passagen überarbeitet',
};

const DEFAULT_USE = 'impl';

/**
 * Macht einen Prompttext tabellentauglich: Zeilenumbrüche zu Trennern, Pipes
 * maskiert. Gekürzt wird nicht — der Katalog verlangt den Wortlaut.
 *
 * @param {string} text Der rohe Prompttext.
 * @returns {string} Einzeilige, Markdown-sichere Fassung.
 */
function forTable(text) {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\s*\n+\s*/g, ' / ')
    .trim();
}

// Alle Sessiondateien chronologisch einlesen; das Datum steckt im Dateinamen.
const files = readdirSync(AI_DIR)
  .filter((n) => n.endsWith('-session.json'))
  .sort();

const entries = [];
for (const name of files) {
  const date = name.slice(0, 10);
  const parsed = JSON.parse(readFileSync(join(AI_DIR, name), 'utf8'));
  for (const e of parsed) {
    entries.push({
      date,
      model: e.model ?? '—',
      prompt: e.prompt ?? '',
      topic: e.topic ?? 'prozess-doku',
      use: e.use ?? DEFAULT_USE,
    });
  }
}

// Warnen, wenn eine Klassifikation unbekannt ist — sonst fällt es erst im
// fertigen Bericht auf.
const knownTopics = new Set(TOPICS.map(([k]) => k));
for (const e of entries) {
  if (!knownTopics.has(e.topic)) {
    console.warn(`WARNUNG: unbekanntes topic "${e.topic}" (${e.date})`);
  }
  if (!USES[e.use]) {
    console.warn(`WARNUNG: unbekanntes use "${e.use}" (${e.date})`);
  }
}

const lines = [];
lines.push('');
lines.push(
  `Erfasst sind **${entries.length} Prompts** aus **${files.length} Sitzungen** ` +
    `(${files[0].slice(0, 10)} bis ${files[files.length - 1].slice(0, 10)}).`,
);
lines.push('');

// Verteilung nach eingesetztem System — eine Zahl, die der Bericht ohnehin braucht.
const byModel = new Map();
for (const e of entries) byModel.set(e.model, (byModel.get(e.model) ?? 0) + 1);
lines.push('| System | Prompts |');
lines.push('|---|---:|');
for (const [model, n] of [...byModel.entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`| ${model} | ${n} |`);
}
lines.push('');

// Ein Abschnitt je Kategorie, leere Kategorien werden ausgelassen.
let section = 0;
for (const [key, title] of TOPICS) {
  const rows = entries.filter((e) => e.topic === key);
  if (rows.length === 0) continue;
  section += 1;
  lines.push(`## 12.${section} ${title}`);
  lines.push('');
  lines.push('| Datum | System | Prompt | Verwendung |');
  lines.push('|---|---|---|---|');
  for (const e of rows) {
    lines.push(`| ${e.date} | ${e.model} | ${forTable(e.prompt)} | ${USES[e.use] ?? e.use} |`);
  }
  lines.push('');
}

const doc = readFileSync(TARGET, 'utf8');
const from = doc.indexOf(START);
const to = doc.indexOf(END);
if (from === -1 || to === -1) {
  throw new Error(`Marker ${START} / ${END} fehlen in ${TARGET}`);
}
const updated = doc.slice(0, from + START.length) + '\n' + lines.join('\n') + doc.slice(to);
writeFileSync(TARGET, updated);

console.log(
  `12-ki-verzeichnis.md erzeugt: ${entries.length} Prompts, ` +
    `${section} Kategorien, ${byModel.size} Systeme.`,
);
