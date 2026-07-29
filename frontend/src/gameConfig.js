export const INITIAL_BOID_COUNT = 36;
export const PLAYER_STARTING_LIVES = 3;
export const HIT_COOLDOWN_MS = 900;
export const WAVE_DURATION_SECONDS = 30;
export const START_COUNTDOWN_SECONDS = 3;
export const PLAYER_VISUAL_RADIUS = 16;
export const BOID_VISUAL_LENGTH = 15;
export const BOID_VISUAL_WIDTH = 11;
export const BOID_TAIL_INSET = 4;
export const PLAYER_MAX_SPEED = 360;
export const PLAYER_ACCELERATION = 1200;
export const PLAYER_DECELERATION = 1500;

/** Safety net for the player integrator. Must stay above SIMULATION_STEP_SECONDS. */
export const PLAYER_MAX_DELTA_SECONDS = 0.05;

// ---------------------------------------------------------------------------
// Player dash (space bar)
// ---------------------------------------------------------------------------

/** Speed the dash starts at — roughly three times the normal top speed. */
export const PLAYER_DASH_SPEED = 1100;

/**
 * How quickly the raised speed limit falls back to `PLAYER_MAX_SPEED`, in
 * pixels per second squared. Together with the dash speed this is what sets the
 * dash distance: (1100 - 360) / 3000 is about a quarter of a second of extra
 * speed, which carries the player roughly 180 pixels.
 */
export const PLAYER_DASH_SPEED_DECAY = 3000;

/** How long the player has to wait before dashing again. */
export const PLAYER_DASH_COOLDOWN_MS = 1400;

// The Rust engine advances exactly one fixed step per tick() call and does not
// scale by delta time, so the simulation must run at a constant rate no matter
// how often the canvas is redrawn.
export const SIMULATION_STEPS_PER_SECOND = 60;
export const SIMULATION_STEP_MS = 1000 / SIMULATION_STEPS_PER_SECOND;
export const SIMULATION_STEP_SECONDS = 1 / SIMULATION_STEPS_PER_SECOND;

/**
 * Upper bound on catch-up work after a stall (~83 ms). A simulation step is
 * O(n²) in the boid count, so raising this trades a freeze for a stutter.
 */
export const MAX_SIMULATION_STEPS_PER_FRAME = 5;

export const TARGET_FPS_OPTIONS = Object.freeze([30, 60, 120]);
export const DEFAULT_TARGET_FPS = 60;

/** Selecting this option disables render throttling entirely. */
export const UNCAPPED_TARGET_FPS = 120;

/**
 * Slack in the render gate. Without it, jitter around the 33.33 ms mark makes a
 * 30 fps target intermittently miss its slot and fall through to the next
 * display frame, producing alternating 33/50 ms frames (visible judder).
 */
export const RENDER_INTERVAL_TOLERANCE_MS = 2;

// ---------------------------------------------------------------------------
// Frametime graph (opt-in performance overlay)
// ---------------------------------------------------------------------------

/** Off by default: the graph is a diagnostic tool, not part of the game. */
export const DEFAULT_FRAME_GRAPH_ENABLED = false;

/**
 * How many curves the graph plots. `SEPARATE` keeps simulation and draw time
 * apart, `COMBINED` plots their sum as a single line — easier to read when all
 * you want to know is whether the frame as a whole fits its budget.
 */
export const FRAME_GRAPH_MODE = Object.freeze({
  SEPARATE: 'separate',
  COMBINED: 'combined',
});

export const DEFAULT_FRAME_GRAPH_MODE = FRAME_GRAPH_MODE.SEPARATE;

/** Bars kept in the history — roughly two seconds of frames at 60 fps. */
export const FRAME_GRAPH_SAMPLE_COUNT = 120;

/** Panel size in CSS pixels. */
export const FRAME_GRAPH_WIDTH = 184;
export const FRAME_GRAPH_HEIGHT = 96;
export const FRAME_GRAPH_PADDING = 6;

/** Vertical space above the plot reserved for the two text rows. */
export const FRAME_GRAPH_TEXT_HEIGHT = 30;

/**
 * How much taller the vertical axis is than the frame budget of the selected
 * target framerate. A factor of 2 puts the dashed budget line exactly halfway up
 * the plot: curves below it fit the budget, and the free half above leaves room
 * to see how far a spike overshot instead of clipping it at the budget itself.
 */
export const FRAME_GRAPH_HEADROOM_FACTOR = 2;

/** Stroke width of a plotted curve, in CSS pixels. */
export const FRAME_GRAPH_LINE_WIDTH = 1.5;

/** Opacity of the tinted area below a curve. Low enough to keep both readable
 *  where two curves overlap. */
export const FRAME_GRAPH_AREA_ALPHA = 0.16;

/** Width of the marker drawn where a sample ran past the top of the scale. */
export const FRAME_GRAPH_OVER_SCALE_MARK_WIDTH = 2;
export const FRAME_GRAPH_OVER_SCALE_MARK_HEIGHT = 2;