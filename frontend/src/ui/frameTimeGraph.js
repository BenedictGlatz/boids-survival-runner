import { t } from './i18n.js';
import {
  FRAME_BUDGET_MS,
  FRAME_GRAPH_HEIGHT,
  FRAME_GRAPH_PADDING,
  FRAME_GRAPH_SCALE_LADDER_MS,
  FRAME_GRAPH_TEXT_HEIGHT,
  FRAME_GRAPH_WIDTH,
} from '../gameConfig.js';

/** Matches the swarm palette: the player's cyan for simulation work. */
const SIMULATION_COLOR = '#38bdf8';
/** The health bar's green for drawing work. */
const RENDER_COLOR = '#22c55e';
/** The boid red, used only for bars that ran past the top of the scale. */
const OVER_SCALE_COLOR = '#f03a5f';
const TEXT_COLOR = '#f4f4f5';
const MUTED_TEXT_COLOR = 'rgba(244, 244, 245, 0.62)';
/** Bright enough to read on top of the bars it crosses, not just on the panel. */
const BUDGET_LINE_COLOR = 'rgba(255, 255, 255, 0.72)';
const BUDGET_LINE_DASH = [3, 3];

const TITLE_FONT = '700 11px "Segoe UI", Arial, sans-serif';
const LEGEND_FONT = '600 10px "Segoe UI", Arial, sans-serif';
const TITLE_BASELINE_Y = 11;
const LEGEND_BASELINE_Y = 24;
const LEGEND_SWATCH_SIZE = 7;
const LEGEND_SWATCH_GAP = 4;
const LEGEND_ENTRY_GAP = 10;

/** Height of the red marker drawn on top of a clamped bar. */
const OVER_SCALE_CAP_HEIGHT = 2;

/**
 * Small opt-in performance overlay: one stacked bar per drawn frame, simulation
 * time at the bottom and draw time above it, against a fixed millisecond scale.
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

  /** @param {import('../loop/frameMetrics.js').FrameMetrics} metrics */
  draw(metrics) {
    const ctx = this._ctx;
    ctx.clearRect(0, 0, FRAME_GRAPH_WIDTH, FRAME_GRAPH_HEIGHT);

    const summary = metrics.summary();
    const scaleMs = chooseScale(summary.maxTotalMs);

    this._drawHeader(summary, scaleMs);
    this._drawBars(metrics, scaleMs);
    // Last, so it stays readable where the bars cross it — which is precisely
    // where the line is worth looking at.
    this._drawBudgetLine(scaleMs);
  }

  hide() {
    this._canvas.style.display = 'none';
  }

  show() {
    this._canvas.style.display = 'block';
  }

  /** Current frame total, the window's peak, the legend and the axis top. */
  _drawHeader(summary, scaleMs) {
    const ctx = this._ctx;
    const unit = t('perf.milliseconds');

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    ctx.font = TITLE_FONT;
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(`${formatMilliseconds(summary.lastTotalMs)} ${unit}`, FRAME_GRAPH_PADDING, TITLE_BASELINE_Y);

    const maxLabel = `${t('perf.max')} ${formatMilliseconds(summary.maxTotalMs)}`;
    ctx.fillStyle = MUTED_TEXT_COLOR;
    ctx.textAlign = 'right';
    ctx.fillText(maxLabel, FRAME_GRAPH_WIDTH - FRAME_GRAPH_PADDING, TITLE_BASELINE_Y);

    ctx.font = LEGEND_FONT;

    // Without this the bar heights would be meaningless, since the axis moves.
    ctx.fillText(
      `${t('perf.scale')} ${formatMilliseconds(scaleMs)}`,
      FRAME_GRAPH_WIDTH - FRAME_GRAPH_PADDING,
      LEGEND_BASELINE_Y,
    );

    ctx.textAlign = 'left';

    let legendX = FRAME_GRAPH_PADDING;
    legendX = this._drawLegendEntry(
      legendX,
      SIMULATION_COLOR,
      `${t('perf.simulation')} ${formatMilliseconds(summary.lastSimulationMs)}`,
    );
    this._drawLegendEntry(
      legendX,
      RENDER_COLOR,
      `${t('perf.render')} ${formatMilliseconds(summary.lastRenderMs)}`,
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

  /** The one hard reference: the wall-clock budget of a single simulation step. */
  _drawBudgetLine(scaleMs) {
    // On the lower rungs the budget sits far above the axis, so there is nothing
    // meaningful to draw — the whole plot is already well inside budget.
    if (FRAME_BUDGET_MS > scaleMs) {
      return;
    }

    const ctx = this._ctx;
    const lineY = this._plotY + this._plotHeight - this._toPixels(FRAME_BUDGET_MS, scaleMs);

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

  _drawBars(metrics, scaleMs) {
    const ctx = this._ctx;
    const barWidth = this._plotWidth / metrics.capacity;
    const plotBottom = this._plotY + this._plotHeight;
    const oldest = metrics.oldestIndex();

    for (let offset = 0; offset < metrics.sampleCount; offset += 1) {
      const slot = (oldest + offset) % metrics.capacity;
      const barX = this._plotX + offset * barWidth;

      // Simulation sits on the baseline, drawing stacks on top of it. Both are
      // clamped so a spike cannot spill out of the panel; the remaining height
      // is what the second segment still has available.
      const simulationHeight = Math.min(
        this._toPixels(metrics.simulationSamples[slot], scaleMs),
        this._plotHeight,
      );
      const renderHeight = Math.min(
        this._toPixels(metrics.renderSamples[slot], scaleMs),
        this._plotHeight - simulationHeight,
      );

      ctx.fillStyle = SIMULATION_COLOR;
      ctx.fillRect(barX, plotBottom - simulationHeight, barWidth, simulationHeight);

      ctx.fillStyle = RENDER_COLOR;
      ctx.fillRect(barX, plotBottom - simulationHeight - renderHeight, barWidth, renderHeight);

      // Only reachable once the axis is already on its highest rung: a clamped bar
      // would otherwise look like one that merely touched the top. The real value
      // stays visible as `max`.
      const totalMs = metrics.simulationSamples[slot] + metrics.renderSamples[slot];

      if (totalMs > scaleMs) {
        ctx.fillStyle = OVER_SCALE_COLOR;
        ctx.fillRect(barX, this._plotY, barWidth, OVER_SCALE_CAP_HEIGHT);
      }
    }
  }

  /** Converts a duration into bar height for the axis currently in use. */
  _toPixels(milliseconds, scaleMs) {
    return (milliseconds / scaleMs) * this._plotHeight;
  }
}

/**
 * Picks the lowest ladder rung that still contains `peakMs`, so the bars use as
 * much of the panel's height as they can. Falls back to the highest rung when
 * even that is too small — those frames are then clamped and capped in red.
 */
function chooseScale(peakMs) {
  for (const rung of FRAME_GRAPH_SCALE_LADDER_MS) {
    if (peakMs <= rung) {
      return rung;
    }
  }

  return FRAME_GRAPH_SCALE_LADDER_MS[FRAME_GRAPH_SCALE_LADDER_MS.length - 1];
}

function formatMilliseconds(value) {
  return value.toFixed(1);
}
