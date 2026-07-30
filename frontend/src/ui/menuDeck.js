/**
 * Markup of the "Command Deck" main menu: the header and footer hairlines, the title,
 * and the menu list. Templates only — no state, no event handling, no game logic.
 *
 * The point of the list layout is that one more menu entry is one more row: adding audio,
 * graphics or credits later means one more entry in the array `menu.js` passes in, not a
 * new screen. Which is also why the index numbers are generated rather than written out.
 */

import { t } from './i18n.js';
import { APP_VERSION, SIMULATION_STEPS_PER_SECOND } from '../gameConfig.js';

/**
 * The deck frame: header, the two content columns, footer.
 * @param {{main: string, aside: string}} content - Markup for the left and right column.
 * @returns {string} HTML for the whole overlay content.
 */
export function renderDeck({ main, aside }) {
  return `
    <div class="menu-scrim"></div>
    <div class="menu-deck">
      <header class="menu-deck__bar">
        <div class="menu-deck__brand">
          <span class="status-dot"></span>
          <span>${t('menu.brand')}</span>
          <span class="menu-deck__sep">/</span>
          <span>${t('menu.tech')}</span>
        </div>
        <span class="kicker">${t('menu.build')} ${APP_VERSION}</span>
      </header>

      <div class="menu-deck__main">${main}</div>
      <aside class="menu-deck__aside">${aside}</aside>

      <footer class="menu-deck__bar menu-deck__bar--foot">
        <span class="kicker">${t('menu.navHint')}</span>
        <span class="kicker">${SIMULATION_STEPS_PER_SECOND} ${t('menu.simSteps')}</span>
      </footer>
    </div>
  `;
}

/**
 * Title block. The last word of the title carries the accent colour, and the words are
 * joined by a line break plus a real newline: the newline keeps the element's text
 * content readable as one sentence for screen readers and for the end-to-end tests,
 * while the break puts each word on its own line.
 * @returns {string} HTML for the title and the pitch line.
 */
export function renderTitle() {
  const words = t('menu.title').split(' ');
  const lastWord = words.pop();
  const lines = [...words, `<em>${lastWord}</em>`].join('<br />\n');

  return `
    <div class="menu-title">
      <h1 class="menu-title__text">${lines}</h1>
      <p class="menu-title__pitch">${t('menu.pitch')}</p>
    </div>
  `;
}

/**
 * The menu list. Every entry becomes a button carrying its own index, so the numbering
 * cannot drift out of step with the order.
 * @param {Array<{id: string, label: string, marker?: string, muted?: boolean,
 *                primary?: boolean}>} entries - Rows in display order.
 * @returns {string} HTML for the list.
 */
export function renderMenuList(entries) {
  const rows = entries.map((entry, index) => renderMenuRow(entry, index + 1)).join('');

  return `<nav class="menu-list" aria-label="${t('menu.title')}">${rows}</nav>`;
}

/**
 * A breadcrumb that replaces the title inside a submenu. It is a button, so going back
 * works by pointer as well as with Escape.
 * @param {string} label - Name of the submenu being shown.
 * @returns {string} HTML for the breadcrumb row.
 */
export function renderBreadcrumb(label) {
  return `
    <button id="btn-menu-back" type="button" class="menu-row menu-row--muted">
      <span class="menu-row__index" aria-hidden="true">&larr;</span>
      <span class="menu-row__label">${label}</span>
      <span class="key">Esc</span>
    </button>
  `;
}

function renderMenuRow(entry, position) {
  const classes = ['menu-row'];
  if (entry.primary) classes.push('menu-row--primary');
  if (entry.muted) classes.push('menu-row--muted');

  return `
    <button id="${entry.id}" type="button" class="${classes.join(' ')}">
      <span class="menu-row__index" aria-hidden="true">${String(position).padStart(2, '0')}</span>
      <span class="menu-row__label">${entry.label}</span>
      ${entry.marker ?? ''}
    </button>
  `;
}
