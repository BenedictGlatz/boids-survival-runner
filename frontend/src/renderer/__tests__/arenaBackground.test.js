import { describe, expect, it } from 'vitest';
import { ArenaBackground } from '../arenaBackground.js';

/**
 * Under Vitest there is no `document`, so every test here exercises the **fallback** path —
 * which is exactly the path worth pinning in Node. The baked path needs a real canvas and is
 * covered where it can be: `e2e/letterbox.spec.js` reads actual pixels out of the running
 * game and is therefore the test that would catch a background baked at the wrong offset.
 *
 * Records every drawing call and the transform in force when it happened, so a test can
 * assert on both what was drawn and in which space.
 */
function recordingContext() {
  const calls = [];
  let transform = null;

  return {
    calls,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    setTransform(...matrix) {
      transform = matrix;
      calls.push({ op: 'setTransform', matrix });
    },
    fillRect(x, y, width, height) {
      calls.push({ op: 'fillRect', x, y, width, height, transform });
    },
    strokeRect(x, y, width, height) {
      calls.push({ op: 'strokeRect', x, y, width, height, transform });
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {
      calls.push({ op: 'stroke', transform });
    },
  };
}

const VIEW = { scale: 0.75, offsetX: 0, offsetY: 45 };

describe('ArenaBackground', () => {
  it('reports that nothing was baked when there is no document', () => {
    const background = new ArenaBackground();

    expect(background.rebuild(2880, 1800, 2, VIEW)).toBe(false);
  });

  it('reports that nothing was baked for a zero-sized canvas', () => {
    // What a window mid-minimise reports. Baking a 0x0 canvas throws in the browser.
    const background = new ArenaBackground();

    expect(background.rebuild(0, 1800, 2, VIEW)).toBe(false);
    expect(background.rebuild(2880, 0, 2, VIEW)).toBe(false);
  });

  it('still draws the whole background when nothing was baked', () => {
    // The fallback is the reason a missing bake degrades to slow rather than to blank.
    const background = new ArenaBackground();
    background.rebuild(2880, 1800, 2, VIEW);

    const ctx = recordingContext();
    background.draw(ctx, 2880, 1800);

    const fills = ctx.calls.filter((call) => call.op === 'fillRect');
    const strokes = ctx.calls.filter((call) => call.op === 'stroke');

    // The void margins and the arena floor, plus both lattices.
    expect(fills.length).toBe(2);
    expect(strokes.length).toBe(2);
    expect(ctx.calls.some((call) => call.op === 'strokeRect')).toBe(true);
  });

  it('paints the margins in screen space and the arena in world space', () => {
    // The distinction the whole module exists to keep straight: the void has to reach outside
    // the world, which the world transform by definition cannot express.
    const background = new ArenaBackground();
    background.rebuild(2880, 1800, 2, VIEW);

    const ctx = recordingContext();
    background.draw(ctx, 2880, 1800);

    const [voidFill, arenaFill] = ctx.calls.filter((call) => call.op === 'fillRect');

    expect(voidFill.transform).toBe(null);
    expect(voidFill.width).toBe(2880);
    expect(voidFill.height).toBe(1800);
    expect(arenaFill.transform).toEqual([1.5, 0, 0, 1.5, 0, 90]);
  });

  it('draws nothing but the margins before the first rebuild', () => {
    // A `draw` before any `resize` has no world placement to draw against. Painting the void
    // is the honest thing to do; guessing a transform would put the arena somewhere wrong.
    const background = new ArenaBackground();
    const ctx = recordingContext();

    background.draw(ctx, 800, 600);

    expect(ctx.calls.filter((call) => call.op === 'fillRect').length).toBe(1);
    expect(ctx.calls.some((call) => call.op === 'setTransform')).toBe(false);
  });

  it('survives a context that cannot blit or transform', () => {
    const background = new ArenaBackground();
    background.rebuild(2880, 1800, 2, VIEW);

    const minimal = { fillStyle: '', fillRect: () => {} };

    expect(() => background.draw(minimal, 2880, 1800)).not.toThrow();
  });
});
