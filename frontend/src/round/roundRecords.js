// The one thing this game remembers between sessions: the best run and the last one.
//
// Pure functions over an injected storage object rather than a module that reaches for
// `localStorage` itself, for the same reason `roundData.js` knows nothing about the
// browser — that is what makes it testable in the Node-only unit suite, with a plain
// object standing in for the storage.
//
// Everything here is best-effort. A browser in private mode can have a `localStorage`
// that throws on write, and a user can put nonsense in it by hand; neither may end a
// round or keep the menu from rendering, so a failure means "no record" and nothing else.

const BEST_KEY = 'bsr.best';
const LAST_KEY = 'bsr.last';

/**
 * An empty record set, used whenever nothing readable is stored.
 * @returns {{best: null, last: null}} No records.
 */
function emptyRecords() {
  return { best: null, last: null };
}

/**
 * Reads the stored records.
 * @param {Storage} [storage] - Where to read from; defaults to `localStorage`.
 * @returns {{best: ?{score: number, wave: number, timeSeconds: number, boids: number},
 *            last: ?{score: number, wave: number, timeSeconds: number, boids: number}}} The best run and
 *   the most recent one, each `null` when nothing valid is stored.
 */
export function readRecords(storage = defaultStorage()) {
  if (!storage) {
    return emptyRecords();
  }

  return {
    best: readRun(storage, BEST_KEY),
    last: readRun(storage, LAST_KEY),
  };
}

/**
 * Records a finished round: it always becomes the last run, and the best one if its score
 * beats the stored best.
 *
 * Ties do not count as a new best. A run that merely matches the record did not beat it,
 * and keeping the older entry means the date a record was set stays meaningful.
 * @param {{score: number, wave: number, timeSeconds: number, boids: number}} run - The round that ended.
 * @param {Storage} [storage] - Where to write to; defaults to `localStorage`.
 * @returns {{best: ?{score: number, wave: number, timeSeconds: number, boids: number},
 *            last: ?{score: number, wave: number, timeSeconds: number, boids: number}}} The records after
 *   writing, so the caller can render from the return value instead of reading again.
 */
export function recordRound(run, storage = defaultStorage()) {
  const finished = normalizeRun(run);
  if (!finished) {
    return readRecords(storage);
  }

  const previous = readRecords(storage);
  const best = previous.best && previous.best.score >= finished.score ? previous.best : finished;

  writeRun(storage, LAST_KEY, finished);
  writeRun(storage, BEST_KEY, best);

  return { best, last: finished };
}

function readRun(storage, key) {
  let raw = null;

  try {
    raw = storage.getItem(key);
  } catch {
    // A storage that refuses to be read is the same as an empty one.
    return null;
  }

  if (!raw) {
    return null;
  }

  try {
    return normalizeRun(JSON.parse(raw));
  } catch {
    // Someone put something in there by hand, or an older version wrote another shape.
    return null;
  }
}

function writeRun(storage, key, run) {
  try {
    storage.setItem(key, JSON.stringify(run));
  } catch {
    // Private mode, a full quota, a blocked origin — none of it is worth a lost round.
  }
}

/**
 * Accepts only a complete run of finite numbers, so a half-written or hand-edited entry
 * cannot reach the menu and render as `NaN`.
 */
function normalizeRun(run) {
  if (!run || typeof run !== 'object') {
    return null;
  }

  const score = Math.floor(toFiniteNumber(run.score));
  const wave = Math.floor(toFiniteNumber(run.wave));
  const timeSeconds = Math.floor(toFiniteNumber(run.timeSeconds));
  const boids = Math.floor(toFiniteNumber(run.boids));

  if (score < 0 || wave < 0 || timeSeconds < 0 || boids < 0) {
    return null;
  }

  return { score, wave, timeSeconds, boids };
}

function toFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : -1;
}

/** `localStorage` can be missing entirely (Node, or an origin that blocks it). */
function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
