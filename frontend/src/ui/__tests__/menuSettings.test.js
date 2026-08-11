import { describe, expect, it } from 'vitest';
import { MenuSettings } from '../menuSettings.js';
import {
  DEFAULT_FRAME_GRAPH_MODE,
  FRAME_GRAPH_MODE,
  TARGET_FPS_OPTIONS,
} from '../../gameConfig.js';

describe('MenuSettings.applyDisplayLimits', () => {
  it('offers only what a 60 Hz display can show', () => {
    const settings = new MenuSettings();

    settings.applyDisplayLimits(59.94);

    expect(settings.toMenuOptions().targetFps.options).toEqual([30, 60]);
  });

  it('selects the fastest offered option', () => {
    const settings = new MenuSettings();

    settings.applyDisplayLimits(59.94);

    expect(settings.targetFps).toBe(60);
  });

  it('selects the fastest option of all on a 120 Hz display', () => {
    const settings = new MenuSettings();

    settings.applyDisplayLimits(119.88);

    expect(settings.targetFps).toBe(120);
  });

  it('keeps every option when the display could not be measured', () => {
    const settings = new MenuSettings();

    settings.applyDisplayLimits(null);

    expect(settings.toMenuOptions().targetFps.options).toEqual([...TARGET_FPS_OPTIONS]);
  });

  it('passes the measured rate on, so the menu can name it', () => {
    const settings = new MenuSettings();

    settings.applyDisplayLimits(60);

    expect(settings.toMenuOptions().targetFps.refreshRateHz).toBe(60);
  });
});

describe('MenuSettings.toMenuOptions', () => {
  it('writes a chosen framerate through to the value the loop reads', () => {
    const settings = new MenuSettings();
    settings.applyDisplayLimits(119.88);

    settings.toMenuOptions().targetFps.onSelect(30);

    expect(settings.targetFps).toBe(30);
  });

  it('writes the frametime graph toggle through', () => {
    const settings = new MenuSettings();

    settings.toMenuOptions().frameGraph.onToggle(true);

    expect(settings.frameGraphEnabled).toBe(true);
  });

  it('writes the graph mode through', () => {
    const settings = new MenuSettings();

    settings.toMenuOptions().frameGraphMode.onSelect(FRAME_GRAPH_MODE.COMBINED);

    expect(settings.frameGraphMode).toBe(FRAME_GRAPH_MODE.COMBINED);
  });

  it('starts on the documented defaults', () => {
    // The menu is built before the first round, so these are what a player who
    // never opens the settings plays with.
    const settings = new MenuSettings();

    expect(settings.frameGraphEnabled).toBe(false);
    expect(settings.frameGraphMode).toBe(DEFAULT_FRAME_GRAPH_MODE);
  });
});
