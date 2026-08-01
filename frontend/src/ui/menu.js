import { t } from './i18n.js';
import { bindOptionGroup } from './optionGroup.js';
import { renderBreadcrumb, renderDeck, renderMenuList, renderTitle } from './menuDeck.js';
import {
  FPS_GROUP_ID,
  FRAME_GRAPH_GROUP_ID,
  FRAME_GRAPH_MODE_GROUP_ID,
  FRAME_GRAPH_ON,
  renderControlsLegend,
  renderFrameGraphGroup,
  renderFrameGraphModeGroup,
  renderPanel,
  renderPersonalBest,
  renderTargetFpsGroup,
} from './menuPanels.js';
import { renderGameOverCard } from './gameOverCard.js';
import { renderPauseCard } from './pauseCard.js';
import { bindMenuNavigation, focusFirstRow } from './menuNavigation.js';

/** The trailing markers of the menu rows, spelled out once. */
const FORWARD_MARKER = '<span class="menu-row__marker" aria-hidden="true">&rarr;</span>';
const PLAY_KEYCAP = '<span class="key key--on-primary">Space</span>';

/**
 * Which part of the menu is on screen. A submenu replaces the left column and leaves the
 * header, the footer and the panel stack standing, so there is one screen type, not four.
 */
const VIEW = Object.freeze({
  ROOT: 'root',
  SETTINGS: 'settings',
  CONTROLS: 'controls',
  DEVELOPER: 'developer',
});

/**
 * Start-menu and game-over overlay UI.
 * Mutates the DOM only — no game logic.
 */
export class Menu {
  /** @param {HTMLElement} [root] - Overlay container the menu is appended to. */
  constructor(root = document.getElementById('ui-overlay')) {
    this._el = document.createElement('div');
    this._el.id = 'menu-overlay';
    root.appendChild(this._el);

    this._view = VIEW.ROOT;
    this._settings = null;
    this._records = { best: null, last: null };
    this._onStart = null;

    // Bound once: the overlay element survives every view change, and the navigation
    // looks its rows up per keypress.
    bindMenuNavigation(this._el, { onBack: () => this._goBack() });
  }

  /**
   * Shows the start screen.
   *
   * Settings arrive as one object rather than as positional arguments, so adding
   * a further setting does not keep widening the signature.
   * @param {() => void} onStart - Called when the play row is activated.
   * @param {{targetFps: {options: number[], selected: number, refreshRateHz: ?number,
   *                      onSelect: (fps: number) => void},
   *          frameGraph: {enabled: boolean, onToggle: (enabled: boolean) => void},
   *          frameGraphMode: {selected: string, onSelect: (mode: string) => void}}} settings -
   *   Current option values and their change handlers.
   * @param {{best: ?object, last: ?object}} records - Stored runs for the personal-best
   *   panel, as read by `round/roundRecords.js`.
   * @returns {void}
   */
  showStart(onStart, settings, records) {
    this._onStart = onStart;
    this._settings = settings;
    this._records = records;
    this._render(VIEW.ROOT);
    this._el.style.display = 'block';
  }

  /**
   * Shows the game-over card over the frozen arena.
   * @param {{onRestart: () => void, onMainMenu: () => void}} handlers - What the two
   *   buttons do.
   * @param {{run: {score: number, wave: number, timeSeconds: number, boids: number},
   *          records: {best: ?{score: number}}}} result - The round that ended and the
   *   records after it.
   * @returns {void}
   */
  showGameOver({ onRestart, onMainMenu }, { run, records }) {
    this._el.innerHTML = renderGameOverCard(run, records.best);
    this._onClick('btn-restart', onRestart);
    this._onClick('btn-main-menu', onMainMenu);
    this._el.style.display = 'flex';

    // Space restarts, which is what the keycap on the button says.
    document.getElementById('btn-restart').focus();
  }

  /**
   * Shows the pause card over the frozen arena.
   *
   * The buttons carry their own ids rather than reusing the game-over card's: `#btn-restart`
   * appearing is what the end-to-end suite reads as "the round is over", and that signal
   * has to keep meaning only that.
   * @param {{onResume: () => void, onRestart: () => void, onMainMenu: () => void}} handlers -
   *   What the three buttons do.
   * @param {{score: number, wave: number, timeSeconds: number, boids: number}} run - The run
   *   currently on hold, for the numbers on the card.
   * @returns {void}
   */
  showPause({ onResume, onRestart, onMainMenu }, run) {
    this._el.innerHTML = renderPauseCard(run);
    this._onClick('btn-resume', onResume);
    this._onClick('btn-pause-restart', onRestart);
    this._onClick('btn-pause-menu', onMainMenu);
    this._el.style.display = 'flex';

    // Space resumes, which is what the keycap on the button says. It reaches the button and
    // not the dash because pausing handed the space bar back to the menu.
    document.getElementById('btn-resume').focus();
  }

  /**
   * Hides whichever overlay (start, game-over or pause) is currently shown.
   * @returns {void}
   */
  hide() {
    this._el.style.display = 'none';
  }

  // -- views ----------------------------------------------------------------

  _render(view) {
    this._view = view;
    this._el.innerHTML = renderDeck({
      main: this._renderMain(view),
      aside: this._renderAside(view),
    });

    this._bindRows();
    this._bindGroups();
    focusFirstRow(this._el);
  }

  _renderMain(view) {
    if (view === VIEW.ROOT) {
      return `
        ${renderTitle()}
        ${renderMenuList([
          { id: 'btn-start', label: t('menu.play'), primary: true, marker: PLAY_KEYCAP },
          { id: 'btn-settings', label: t('menu.gameSettings'), marker: FORWARD_MARKER },
          { id: 'btn-controls', label: t('menu.controls'), marker: FORWARD_MARKER },
          {
            id: 'btn-developer',
            label: t('settings.developerSettings'),
            muted: true,
            marker: `<span class="badge badge--diag">${t('menu.diag')}</span>`,
          },
        ])}
      `;
    }

    // Breadcrumb and body share one container, so the breadcrumb is as wide as the
    // content it belongs to rather than as wide as the column.
    return `
      <div class="menu-submenu">
        ${renderBreadcrumb(this._titleFor(view))}
        ${this._renderSubmenuBody(view)}
      </div>
    `;
  }

  _renderSubmenuBody(view) {
    if (view === VIEW.SETTINGS) {
      return renderTargetFpsGroup(this._settings.targetFps);
    }

    if (view === VIEW.CONTROLS) {
      return renderControlsLegend({ heading: false });
    }

    return `
      ${renderFrameGraphGroup(this._settings.frameGraph)}
      ${renderFrameGraphModeGroup(this._settings.frameGraphMode)}
    `;
  }

  /**
   * The panel stack shows what the left column is not showing: the legend moved into its
   * submenu leaves the stack, so its markup exists exactly once in the document. No
   * setting is duplicated here — each one lives behind the menu row it belongs to.
   */
  _renderAside(view) {
    const panels = [renderPanel(renderPersonalBest(this._records))];

    if (view !== VIEW.CONTROLS) {
      panels.push(renderPanel(renderControlsLegend()));
    }

    return panels.join('');
  }

  _titleFor(view) {
    if (view === VIEW.SETTINGS) return t('menu.gameSettings');
    if (view === VIEW.CONTROLS) return t('menu.controls');

    return t('settings.developerSettings');
  }

  // -- wiring ---------------------------------------------------------------

  _bindRows() {
    this._onClick('btn-start', this._onStart);
    this._onClick('btn-settings', () => this._render(VIEW.SETTINGS));
    this._onClick('btn-controls', () => this._render(VIEW.CONTROLS));
    this._onClick('btn-developer', () => this._render(VIEW.DEVELOPER));
    this._onClick('btn-menu-back', () => this._goBack());
  }

  /**
   * The option groups are rebound after every render, because the markup they live in was
   * just replaced. Which groups exist depends on the view, hence the presence check.
   */
  _bindGroups() {
    this._bindGroup(FPS_GROUP_ID, (value) => {
      this._settings.targetFps.onSelect(Number(value));
    });

    this._bindGroup(FRAME_GRAPH_GROUP_ID, (value) => {
      this._settings.frameGraph.onToggle(value === FRAME_GRAPH_ON);
    });

    this._bindGroup(FRAME_GRAPH_MODE_GROUP_ID, (value) => {
      this._settings.frameGraphMode.onSelect(value);
    });
  }

  _bindGroup(id, onSelect) {
    if (document.getElementById(id)) {
      bindOptionGroup(id, onSelect);
    }
  }

  _onClick(id, handler) {
    const element = document.getElementById(id);

    if (element && handler) {
      element.addEventListener('click', handler);
    }
  }

  /** Escape and the breadcrumb lead to the same place. On the start screen it is a no-op. */
  _goBack() {
    if (this._view !== VIEW.ROOT) {
      this._render(VIEW.ROOT);
    }
  }
}
