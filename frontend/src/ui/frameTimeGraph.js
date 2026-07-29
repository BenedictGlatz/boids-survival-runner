import { t } from './i18n.js';
import { resolveAxis } from './frameGraphScale.js';
import {
  DEFAULT_TARGET_FPS,
  FRAME_GRAPH_AREA_ALPHA,
  FRAME_GRAPH_HEADROOM_FACTOR,
  FRAME_GRAPH_HEIGHT,
  FRAME_GRAPH_LINE_WIDTH,
  FRAME_GRAPH_MODE,
  FRAME_GRAPH_OVER_SCALE_MARK_HEIGHT,
  FRAME_GRAPH_OVER_SCALE_MARK_WIDTH,
  FRAME_GRAPH_PADDING,
  FRAME_GRAPH_TEXT_HEIGHT,
  FRAME_GRAPH_WIDTH,
} from '../gameConfig.js';

/** Which value a curve plots. */
const SERIES = Object.freeze({
  SIMULATION: 'simulation',
  RENDER: 'render',
  TOTAL: 'total',
});

/** Matches the swarm palette: the player's cyan for simulation work. */
const SIMULATION_COLOR = '#38bdf8';
/** The health bar's green for drawing work. */
const RENDER_COLOR = '#22c55e';
/** Neither of the two, because the combined curve is neither of the two. */
const TOTAL_COLOR = '#fbbf24';
/** The boid red, used only where a sample ran past the top of the scale. */
const OVER_SCALE_COLOR = '#f03a5f';
const TEXT_COLOR = '#f4f4f5';
const MUTED_TEXT_COLOR = 'rgba(244, 244, 245, 0.62)';
/** Bright enough to read on top of the curves it crosses, not just on the panel. */
const BUDGET_LINE_COLOR = 'rgba(255, 255, 255, 0.72)';
const BUDGET_LINE_DASH = [3, 3];

const TITLE_FONT = '700 11px "Segoe UI", Arial, sans-serif';
const LEGEND_FONT = '600 10px "Segoe UI", Arial, sans-serif';
const TITLE_BASELINE_Y = 11;
const LEGEND_BASELINE_Y = 24;
const LEGEND_SWATCH_SIZE = 7;
const LEGEND_SWATCH_GAP = 4;
const LEGEND_ENTRY_GAP = 10;

/**
 * Small opt-in performance overlay: a scrolling curve per drawn frame against a
 * fixed millisecond scale, in the style of an external frametime monitor. Either
 * one curve per cost (simulation and drawing) or a single combined one, chosen
 * in the start menu.
 *
 * Deliberately its own `<canvas>` in the UI overlay rather than a helper inside
 * `CanvasRenderer`, for two reasons. Drawing it through the renderer would put
 * its own cost inside the render time it is meant to report, and `Renderer` is
 * documented as swappable for a WebGL implementation — a 2D debug overlay in
 * that path would have to be rewritten along with it.
 *
 * Reads game state only through `FrameMetrics`; owns no simulation logic.
 */
export class FrameTimeGraph {
  constructor(root = document.getElementById('ui-overlay')) {
    this._canvas = document.createElement('canvas');
    this._canvas.id = 'frame-time-graph';
    this._canvas.className = 'frame-time-graph top-left';
    root.appendChild(this._canvas);

    this._ctx = this._canvas.getContext('2d');
    this._plotX = FRAME_GRAPH_PADDING;
    this._plotY = FRAME_GRAPH_PADDING + FRAME_GRAPH_TEXT_HEIGHT;
    this._plotWidth = FRAME_GRAPH_WIDTH - FRAME_GRAPH_PADDING * 2;
    this._plotHeight = FRAME_GRAPH_HEIGHT - FRAME_GRAPH_PADDING * 2 - FRAME_GRAPH_TEXT_HEIGHT;

    this.resize();
  }

  /**
   * Sizes the backing store for the current device pixel ratio. Same approach as
   * the game canvas: the ratio goes into the transform once, so everything below
   * draws in CSS pixels.
   */
  resize() {
    const pixelRatio = window.devicePixelRatio || 1;
    this._canvas.width = Math.floor(FRAME_GRAPH_WIDTH * pixelRatio);
    this._canvas.height = Math.floor(FRAME_GRAPH_HEIGHT * pixelRatio);
    this._canvas.style.width = `${FRAME_GRAPH_WIDTH}px`;
    this._canvas.style.height = `${FRAME_GRAPH_HEIGHT}px`;
    this._ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  /**
   * @param {import('../loop/frameMetrics.js').FrameMetrics} metrics - The window to plot.
   * @param {{mode?: string, targetFps?: number}} [options] - `mode` is one of
   *   `FRAME_GRAPH_MODE`; `targetFps` is the framerate the renderer aims for and
   *   sets both the budget line and the top of the axis.
   */
  draw(metrics, options = {}) {
    const mode = options.mode ?? FRAME_GRAPH_MODE.SEPARATE;
    const targetFps = options.targetFps ?? DEFAULT_TARGET_FPS;
    const ctx = this._ctx;
    ctx.clearRect(0, 0, FRAME_GRAPH_WIDTH, FRAME_GRAPH_HEIGHT);

    const summary = metrics.summary();
    const combined = mode === FRAME_GRAPH_MODE.COMBINED;
    // Reported next to the average, but no longer used for the axis: the scale
    // follows the selected framerate so it holds still across the whole round.
    const peakMs = combined
      ? summary.maxTotalMs
      : Math.max(summary.maxSimulationMs, summary.maxRenderMs);
    const axis = resolveAxis(targetFps, FRAME_GRAPH_HEADROOM_FACTOR);

    this._drawHeader(summary, axis.topMs, peakMs, combined);
    this._drawCurves(metrics, axis.topMs, combined);
    // Last, so it stays readable where the curves cross it — which is precisely
    // where the line is worth looking at.
    this._drawBudgetLine(axis.budgetMs, axis.topMs);
  }

  /** Hides the overlay canvas. */
  hide() {
    this._canvas.style.display = 'none';
  }

  /** Shows the overlay canvas. */
  show() {
    this._canvas.style.display = 'block';
  }

  /** Window average, the window's peak, the legend and the axis top. */
  _drawHeader(summary, scaleMs, peakMs, combined) {
    const ctx = this._ctx;
    const unit = t('perf.milliseconds');

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // The average, not the newest frame: browsers round every single timing
    // measurement (Firefox to a whole millisecond), so a per-frame readout can
    // only ever show integers. Averaging the window restores the decimal.
    ctx.font = TITLE_FONT;
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(
      `${formatMilliseconds(summary.averageTotalMs)} ${unit} ${t('perf.average')}`,
      FRAME_GRAPH_PADDING,
      TITLE_BASELINE_Y,
    );

    ctx.fillStyle = MUTED_TEXT_COLOR;
    ctx.textAlign = 'right';
    ctx.fillText(
      `${t('perf.max')} ${formatMilliseconds(peakMs)}`,
      FRAME_GRAPH_WIDTH - FRAME_GRAPH_PADDING,
      TITLE_BASELINE_Y,
    );

    ctx.font = LEGEND_FONT;

    // The axis only changes with the framerate setting, but printing it is what
    // lets a curve height be read as a duration at all.
    ctx.fillText(
      `${t('perf.scale')} ${formatMilliseconds(scaleMs)}`,
      FRAME_GRAPH_WIDTH - FRAME_GRAPH_PADDING,
      LEGEND_BASELINE_Y,
    );

    ctx.textAlign = 'left';

    if (combined) {
      this._drawLegendEntry(
        FRAME_GRAPH_PADDING,
        TOTAL_COLOR,
        `${t('perf.frame')} ${formatMilliseconds(summary.averageTotalMs)}`,
      );
      return;
    }

    let legendX = FRAME_GRAPH_PADDING;
    legendX = this._drawLegendEntry(
      legendX,
      SIMULATION_COLOR,
      `${t('perf.simulation')} ${formatMilliseconds(summary.averageSimulationMs)}`,
    );
    this._drawLegendEntry(
      legendX,
      RENDER_COLOR,
      `${t('perf.render')} ${formatMilliseconds(summary.averageRenderMs)}`,
    );
  }

  /**
   * Draws one "swatch + label" pair.
   * @returns {number} The x position where the next entry may start.
   */
  _drawLegendEntry(x, color, label) {
    const ctx = this._ctx;
    const swatchY = LEGEND_BASELINE_Y - LEGEND_SWATCH_SIZE;

    ctx.fillStyle = color;
    ctx.fillRect(x, swatchY, LEGEND_SWATCH_SIZE, LEGEND_SWATCH_SIZE);

    const textX = x + LEGEND_SWATCH_SIZE + LEGEND_SWATCH_GAP;
    ctx.fillStyle = MUTED_TEXT_COLOR;
    ctx.fillText(label, textX, LEGEND_BASELINE_Y);

    return textX + ctx.measureText(label).width + LEGEND_ENTRY_GAP;
  }

  /**
   * The one hard reference: the wall-clock time one frame may take at the
   * selected target framerate. Everything above the line is a frame that missed
   * it. Always inside the plot, since the axis is a multiple of this value.
   */
  _drawBudgetLine(budgetMs, scaleMs) {
    const ctx = this._ctx;
    const lineY = this._plotY + this._plotHeight - this._toPixels(budgetMs, scaleMs);

    ctx.save();
    ctx.setLineDash(BUDGET_LINE_DASH);
    ctx.strokeStyle = BUDGET_LINE_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // The half-pixel offset keeps the 1px line crisp instead of straddling two rows.
    ctx.moveTo(this._plotX, lineY + 0.5);
    ctx.lineTo(this._plotX + this._plotWidth, lineY + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawCurves(metrics, scaleMs, combined) {
    // A single sample has no line to draw, and the spacing below would divide by
    // zero on a one-slot history.
    if (metrics.sampleCount < 2) {
      return;
    }

    if (combined) {
      this._drawCurve(metrics, scaleMs, SERIES.TOTAL, TOTAL_COLOR);
    } else {
      // Draw time first, simulation on top: simulation is the cost worth
      // watching, so it must stay visible where the two curves overlap.
      this._drawCurve(metrics, scaleMs, SERIES.RENDER, RENDER_COLOR);
      this._drawCurve(metrics, scaleMs, SERIES.SIMULATION, SIMULATION_COLOR);
    }

    this._drawOverScaleMarkers(metrics, scaleMs, combined);
  }

  /**
   * One series as a tinted area with a crisp line on top. The area alone would be
   * too vague to read a value off, the line alone too thin to see against the
   * panel — together they read the way an external frametime monitor does.
   */
  _drawCurve(metrics, scaleMs, series, color) {
    const ctx = this._ctx;
    const plotBottom = this._plotY + this._plotHeight;
    const lastX = this._plotX + (metrics.sampleCount - 1) * this._sampleSpacing(metrics.capacity);

    // Closing the polyline down to the baseline turns it into the fillable area.
    ctx.beginPath();
    this._tracePolyline(metrics, scaleMs, series);
    ctx.lineTo(lastX, plotBottom);
    ctx.lineTo(this._plotX, plotBottom);
    ctx.closePath();

    ctx.globalAlpha = FRAME_GRAPH_AREA_ALPHA;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Re-walked rather than reused: the path above is closed, and stroking it
    // would draw the two baseline edges as well.
    ctx.beginPath();
    this._tracePolyline(metrics, scaleMs, series);
    ctx.strokeStyle = color;
    ctx.lineWidth = FRAME_GRAPH_LINE_WIDTH;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  /** Issues the moveTo/lineTo pairs for one series, oldest sample first. */
  _tracePolyline(metrics, scaleMs, series) {
    const ctx = this._ctx;
    const spacing = this._sampleSpacing(metrics.capacity);
    const oldest = metrics.oldestIndex();

    for (let offset = 0; offset < metrics.sampleCount; offset += 1) {
      const slot = (oldest + offset) % metrics.capacity;
      const x = this._plotX + offset * spacing;
      const y = this._sampleY(sampleValue(metrics, slot, series), scaleMs);

      if (offset === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  }

  /**
   * Ticks along the top edge wherever a sample was clamped, meaning a frame took
   * longer than the headroom above the budget line allows for. Without the tick
   * such a sample would look like one that merely touched the top; its real
   * value stays in the `max` readout either way.
   */
  _drawOverScaleMarkers(metrics, scaleMs, combined) {
    const ctx = this._ctx;
    const spacing = this._sampleSpacing(metrics.capacity);
    const oldest = metrics.oldestIndex();

    ctx.fillStyle = OVER_SCALE_COLOR;

    for (let offset = 0; offset < metrics.sampleCount; offset += 1) {
      const slot = (oldest + offset) % metrics.capacity;
      const simulationMs = metrics.simulationSamples[slot];
      const renderMs = metrics.renderSamples[slot];
      const plottedMs = combined ? simulationMs + renderMs : Math.max(simulationMs, renderMs);

      if (plottedMs > scaleMs) {
        ctx.fillRect(
          this._plotX + offset * spacing - FRAME_GRAPH_OVER_SCALE_MARK_WIDTH * 0.5,
          this._plotY,
          FRAME_GRAPH_OVER_SCALE_MARK_WIDTH,
          FRAME_GRAPH_OVER_SCALE_MARK_HEIGHT,
        );
      }
    }
  }

  /**
   * Horizontal distance between two samples. Derived from the capacity, not from
   * the current sample count, so the curve scrolls in from the left while the
   * history fills up instead of stretching to fit.
   */
  _sampleSpacing(capacity) {
    return this._plotWidth / (capacity - 1);
  }

  /** Vertical position of one sample, clamped to the top of the plot. */
  _sampleY(milliseconds, scaleMs) {
    const height = Math.min(this._toPixels(milliseconds, scaleMs), this._plotHeight);
    return this._plotY + this._plotHeight - height;
  }

  /** Converts a duration into plot height for the axis currently in use. */
  _toPixels(milliseconds, scaleMs) {
    return (milliseconds / scaleMs) * this._plotHeight;
  }
}

/** Reads one ring-buffer slot in the unit the given series plots. */
function sampleValue(metrics, slot, series) {
  const simulationMs = metrics.simulationSamples[slot];
  const renderMs = metrics.renderSamples[slot];

  if (series === SERIES.SIMULATION) {
    return simulationMs;
  }

  if (series === SERIES.RENDER) {
    return renderMs;
  }

  return simulationMs + renderMs;
}

function formatMilliseconds(value) {
  return value.toFixed(1);
}
