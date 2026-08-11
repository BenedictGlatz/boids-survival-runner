import { describe, expect, it, vi } from 'vitest';
import { COUNTED_DRAW_METHODS, DrawCallCounter } from '../drawCallCounter.js';

/**
 * A stand-in for a canvas context. It carries every counted method plus one that is not
 * counted, so a test can prove the counter is selective rather than counting everything.
 */
function fakeContext() {
  const context = { calls: [] };

  for (const methodName of COUNTED_DRAW_METHODS) {
    context[methodName] = function record() {
      context.calls.push(methodName);
    };
  }

  context.beginPath = function record() {
    context.calls.push('beginPath');
  };

  return context;
}

describe('DrawCallCounter', () => {
  it('counts nothing before anything was drawn', () => {
    const counter = new DrawCallCounter();

    expect(counter.readAndReset()).toBe(0);
    expect(counter.isAttached()).toBe(false);
  });

  it('counts one per drawing operation', () => {
    const counter = new DrawCallCounter();
    const ctx = fakeContext();

    counter.attach(ctx);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect();

    expect(counter.readAndReset()).toBe(3);
  });

  it('leaves path building uncounted', () => {
    // The whole point of the number is that batching lowers it. Counting beginPath would
    // make one batched path score the same as one path per entity.
    const counter = new DrawCallCounter();
    const ctx = fakeContext();

    counter.attach(ctx);
    ctx.beginPath();
    ctx.beginPath();
    ctx.fill();

    expect(counter.readAndReset()).toBe(1);
  });

  it('still forwards to the original method', () => {
    const counter = new DrawCallCounter();
    const ctx = fakeContext();

    counter.attach(ctx);
    ctx.fill();
    ctx.beginPath();
    ctx.stroke();

    expect(ctx.calls).toEqual(['fill', 'beginPath', 'stroke']);
  });

  it('forwards every argument, whatever the arity', () => {
    // drawImage takes three, five or nine arguments, and fill takes a path or nothing.
    // A wrapper that dropped or padded arguments would draw the wrong thing.
    const counter = new DrawCallCounter();
    const fillRect = vi.fn();
    const drawImage = vi.fn();
    const ctx = { fillRect, drawImage };

    // The spies are held from before the attach: `attach` replaces the properties on the
    // context, so `ctx.fillRect` afterwards is the wrapper and no longer the spy itself.
    counter.attach(ctx);
    ctx.fillRect(1, 2, 3, 4);
    ctx.drawImage('image', 5, 6);

    expect(fillRect).toHaveBeenCalledWith(1, 2, 3, 4);
    expect(drawImage).toHaveBeenCalledWith('image', 5, 6);
    expect(counter.readAndReset()).toBe(2);
  });

  it('keeps the context as the receiver of the original call', () => {
    // A canvas context method invoked with the wrong `this` throws in the browser, and the
    // wrapper is the only place that could get the receiver wrong.
    const counter = new DrawCallCounter();
    let receiver = null;
    const ctx = {
      fill() {
        receiver = this;
      },
    };

    counter.attach(ctx);
    ctx.fill();

    expect(receiver).toBe(ctx);
  });

  it('returns the value the original returned', () => {
    const counter = new DrawCallCounter();
    const ctx = { drawImage: () => 'drawn' };

    counter.attach(ctx);

    expect(ctx.drawImage()).toBe('drawn');
  });

  it('starts a fresh window on every read', () => {
    const counter = new DrawCallCounter();
    const ctx = fakeContext();

    counter.attach(ctx);
    ctx.fill();
    ctx.fill();

    expect(counter.readAndReset()).toBe(2);

    ctx.stroke();

    expect(counter.readAndReset()).toBe(1);
    expect(counter.readAndReset()).toBe(0);
  });

  it('does not wrap the same context twice', () => {
    // Attaching per round start is convenient, and a second wrapper layer would count
    // every operation twice from the second round on.
    const counter = new DrawCallCounter();
    const ctx = fakeContext();

    expect(counter.attach(ctx)).toBe(true);
    expect(counter.attach(ctx)).toBe(false);

    ctx.fill();

    expect(counter.readAndReset()).toBe(1);
  });

  it('leaves methods the context does not have alone', () => {
    // A test double that implements two of the nine methods must not blow up on attach.
    const counter = new DrawCallCounter();
    const ctx = { fill: () => {} };

    expect(() => counter.attach(ctx)).not.toThrow();
    expect(ctx.stroke).toBeUndefined();

    ctx.fill();

    expect(counter.readAndReset()).toBe(1);
  });

  it('reports nothing to count when handed no context', () => {
    const counter = new DrawCallCounter();

    expect(counter.attach(null)).toBe(false);
    expect(counter.attach(undefined)).toBe(false);
    expect(counter.isAttached()).toBe(false);
  });
});
