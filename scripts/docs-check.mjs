// Beratende Kontrolle des Dokumentations-Rituals aus CLAUDE.md
// (Mandatory per-change steps). Meldet, was für den heutigen Arbeitsstand fehlt.
//
// Bewusst NICHT blockierend und bewusst kein Git-Hook: Ein blockierender Hook wird
// unter Zeitdruck mit --no-verify umgangen, eine sichtbare Warnung nicht. Exit-Code
// ist immer 0, damit das Skript auch als optionaler CI-Job nie einen Build rot macht.
//
// Aufruf: npm run docs:check   (aus frontend/)

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const JOURNAL = join(REPO, 'documentation', 'report', 'projekt-journal.md');
const CHANGELOG = join(REPO, 'CHANGELOG.md');

// Lokales Datum, nicht UTC — sonst meldet das Skript abends den falschen Tag.
const now = new Date();
const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
].join('-');

const problems = [];
const notes = [];

/**
 * Liest die Liste der aktuell geänderten Dateien aus Git.
 *
 * @returns {string[]} Pfade relativ zum Repository-Wurzelverzeichnis.
 */
function changedFiles() {
  try {
    const out = execSync('git status --porcelain', { cwd: REPO, encoding: 'utf8' });
    return out
      .split('\n')
      .filter(Boolean)
      .map((l) => l.slice(3).trim())
      .filter(Boolean);
  } catch {
    notes.push('Git-Status nicht lesbar — Prüfung der Änderungen übersprungen.');
    return [];
  }
}

const changed = changedFiles();
// Nur echter Quellcode löst die Ritual-Pflicht aus, nicht die Doku selbst.
const codeChanged = changed.filter(
  (f) => /^(engine|frontend|scripts)\//.test(f) && !f.includes('/wasm/engine/'),
);

// 1) Prompt-Log für heute vorhanden und vollständig klassifiziert?
const sessionFile = join(REPO, 'ai', `${today}-session.json`);
if (!existsSync(sessionFile)) {
  problems.push(
    `ai/${today}-session.json fehlt — Prompts dieser Sitzung sind nicht protokolliert.`,
  );
} else {
  const entries = JSON.parse(readFileSync(sessionFile, 'utf8'));
  const missing = entries.filter((e) => !e.topic).length;
  if (missing > 0) {
    problems.push(`ai/${today}-session.json: ${missing} Eintrag/Einträge ohne "topic".`);
  } else {
    notes.push(`ai/${today}-session.json: ${entries.length} Prompts protokolliert.`);
  }
}

// 2) Journal-Aufwandzeile für heute vorhanden?
const journal = readFileSync(JOURNAL, 'utf8');
if (!journal.includes(today)) {
  problems.push(`projekt-journal.md hat keinen Eintrag für ${today} — Aufwandzeile fehlt.`);
} else {
  notes.push('projekt-journal.md: Eintrag für heute vorhanden.');
}

// 3) Changelog angefasst, wenn Quellcode geändert wurde?
if (codeChanged.length > 0 && !changed.includes('CHANGELOG.md')) {
  problems.push(
    `${codeChanged.length} Quelldatei(en) geändert, aber CHANGELOG.md nicht — ` +
      'nutzersichtbare Änderungen gehören unter [Unreleased].',
  );
}

// 4) 400-Zeilen-Regel, für die Quellen (documentation/ ist ausgenommen).
for (const dir of ['engine/src', 'frontend/src']) {
  const root = join(REPO, dir);
  if (!existsSync(root)) continue;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const e of readdirSync(current, { withFileTypes: true })) {
      const p = join(current, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'wasm' && e.name !== 'node_modules') stack.push(p);
      } else if (/\.(rs|js)$/.test(e.name)) {
        const count = readFileSync(p, 'utf8').split('\n').length;
        if (count > 400) {
          problems.push(
            `${p.slice(REPO.length + 1)}: ${count} Zeilen — über der 400-Zeilen-Regel.`,
          );
        }
      }
    }
  }
}

// 5) Kapitelstatus als Fortschrittserinnerung.
const reportDir = join(REPO, 'documentation', 'report');
const stubs = readdirSync(reportDir)
  .filter((n) => /^\d\d-.*\.md$/.test(n))
  .filter((n) => readFileSync(join(reportDir, n), 'utf8').includes('Status: Gerüst'));
if (stubs.length > 0) {
  notes.push(`${stubs.length} Kapitel noch auf "Gerüst": ${stubs.join(', ')}`);
}

console.log('\ndocs:check — beratende Prüfung des Dokumentations-Rituals\n');
if (problems.length === 0) {
  console.log('  Keine offenen Punkte.');
} else {
  for (const p of problems) console.log(`  OFFEN   ${p}`);
}
if (notes.length > 0) {
  console.log('');
  for (const n of notes) console.log(`  Hinweis  ${n}`);
}
console.log('');

// Immer erfolgreich beenden — siehe Kommentar oben.
process.exit(0);
