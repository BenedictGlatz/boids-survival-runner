import { describe, expect, it } from 'vitest';
import { readRecords, recordRound } from './roundRecords.js';

// The storage is injected, so this suite needs no browser. A Map-backed stub is enough
// to cover the interesting half of this module, which is not the happy path but what
// happens when the stored data is missing, broken, or cannot be written at all.

function makeStorage(initial = {}) {
  const entries = new Map(Object.entries(initial));

  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    entries,
  };
}

/** A storage that refuses everything, the way a locked-down browser profile does. */
function makeHostileStorage() {
  return {
    getItem: () => {
      throw new Error('access denied');
    },
    setItem: () => {
      throw new Error('access denied');
    },
  };
}

const RUN = { score: 120, wave: 4, timeSeconds: 120, boids: 52 };
const WEAKER_RUN = { score: 80, wave: 3, timeSeconds: 80, boids: 44 };
const STRONGER_RUN = { score: 300, wave: 9, timeSeconds: 300, boids: 96 };

describe('readRecords', () => {
  it('reports no records for an empty storage', () => {
    expect(readRecords(makeStorage())).toEqual({ best: null, last: null });
  });

  it('reports no records when there is no storage at all', () => {
    // Node has no localStorage, and an origin can block it. Neither may throw.
    expect(readRecords(null)).toEqual({ best: null, last: null });
  });

  it('reads back a stored run', () => {
    const storage = makeStorage({ 'bsr.best': JSON.stringify(RUN) });

    expect(readRecords(storage).best).toEqual(RUN);
  });

  it('ignores an entry that is not valid JSON', () => {
    const storage = makeStorage({ 'bsr.best': '{oops' });

    expect(readRecords(storage).best).toBeNull();
  });

  it('ignores an entry with a missing or non-numeric field', () => {
    // The failure this prevents is a menu that renders "NaN" as the personal best.
    const storage = makeStorage({
      'bsr.best': JSON.stringify({ score: 10, wave: 'four' }),
      'bsr.last': JSON.stringify({ score: 10 }),
    });

    expect(readRecords(storage)).toEqual({ best: null, last: null });
  });

  it('ignores a negative score', () => {
    const storage = makeStorage({ 'bsr.best': JSON.stringify({ ...RUN, score: -5 }) });

    expect(readRecords(storage).best).toBeNull();
  });

  it('survives a storage that throws on read', () => {
    expect(readRecords(makeHostileStorage())).toEqual({ best: null, last: null });
  });
});

describe('recordRound', () => {
  it('makes the first round both the best and the last one', () => {
    const storage = makeStorage();

    expect(recordRound(RUN, storage)).toEqual({ best: RUN, last: RUN });
  });

  it('keeps the better score as the best run', () => {
    const storage = makeStorage();

    recordRound(RUN, storage);
    const records = recordRound(WEAKER_RUN, storage);

    expect(records.best).toEqual(RUN);
    expect(records.last).toEqual(WEAKER_RUN);
  });

  it('replaces the best run when the score is beaten', () => {
    const storage = makeStorage();

    recordRound(RUN, storage);
    const records = recordRound(STRONGER_RUN, storage);

    expect(records.best).toEqual(STRONGER_RUN);
  });

  it('does not treat an equal score as a new record', () => {
    // A run that matches the record did not beat it, so the older entry stays and the
    // wave and time it was set with stay with it.
    const storage = makeStorage();

    recordRound({ score: 120, wave: 9, timeSeconds: 300, boids: 96 }, storage);
    const records = recordRound(RUN, storage);

    expect(records.best.wave).toBe(9);
  });

  it('rounds a fractional time down rather than storing it', () => {
    const storage = makeStorage();

    const records = recordRound({ score: 12.9, wave: 2, timeSeconds: 12.9, boids: 40.7 }, storage);

    expect(records.last).toEqual({ score: 12, wave: 2, timeSeconds: 12, boids: 40 });
  });

  it('writes nothing for an incomplete run', () => {
    const storage = makeStorage();

    const records = recordRound({ score: 10 }, storage);

    expect(storage.entries.size).toBe(0);
    expect(records).toEqual({ best: null, last: null });
  });

  it('replaces an unreadable best entry rather than keeping it', () => {
    // Otherwise a single corrupt entry would block every future record.
    const storage = makeStorage({ 'bsr.best': 'nonsense' });

    expect(recordRound(RUN, storage).best).toEqual(RUN);
  });

  it('survives a storage that throws on write and still reports the round', () => {
    // The round is over either way; losing the record is acceptable, losing the
    // game-over screen is not.
    expect(recordRound(RUN, makeHostileStorage())).toEqual({ best: RUN, last: RUN });
  });
});
