/**
 * Keyboard navigation for the menu overlay: the arrow keys walk the menu list, Escape
 * leaves a submenu.
 *
 * Why this exists at all rather than relying on Tab: the footer of the deck promises
 * "arrows navigate, space selects, escape goes back", and a promise printed in the
 * interface has to hold. Enter and Space need no code — the rows are real `<button>`
 * elements, and `InputManager` only claims the space bar while a round is running.
 *
 * Bound once, at window level, and gated on the overlay being visible. Not on the overlay
 * element itself: a view change replaces the focused row, which leaves the focus on
 * `<body>` for a moment, and an overlay-level listener would miss every key pressed until
 * something inside it is focused again.
 *
 * The rows are looked up per keypress, so switching views needs no rebinding.
 */

/** Every row of the current view, breadcrumb included — that one is a row as well. */
const ROW_SELECTOR = '.menu-row';

/**
 * Attaches the navigation for an overlay.
 * @param {HTMLElement} overlay - The menu overlay the rows live in.
 * @param {{onBack: () => void}} handlers - `onBack` is called on Escape.
 * @returns {void}
 */
export function bindMenuNavigation(overlay, { onBack }) {
  window.addEventListener('keydown', (event) => {
    if (!isVisible(overlay)) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
      return;
    }

    const step = stepFor(event.key);
    if (step === 0) {
      return;
    }

    const rows = [...overlay.querySelectorAll(ROW_SELECTOR)];
    if (rows.length === 0) {
      return;
    }

    // The arrow keys are the player's while a round runs, so scrolling the page with
    // them here would be the wrong answer in the one place they mean navigation.
    event.preventDefault();
    moveFocus(rows, event.target, step);
  });
}

/**
 * Puts the keyboard on the first row of the current view, so the arrow keys have
 * somewhere to start from the moment a view appears.
 * @param {HTMLElement} overlay - The menu overlay.
 * @returns {void}
 */
export function focusFirstRow(overlay) {
  const firstRow = overlay.querySelector(ROW_SELECTOR);

  if (firstRow) {
    firstRow.focus();
  }
}

/** Wraps around at both ends: a menu list is a ring, not a scrollbar. */
function moveFocus(rows, focused, step) {
  const current = rows.indexOf(focused);
  const next = current === -1 ? 0 : (current + step + rows.length) % rows.length;

  rows[next].focus();
}

function stepFor(key) {
  if (key === 'ArrowDown') return 1;
  if (key === 'ArrowUp') return -1;

  return 0;
}

/** The menu is shown and hidden through its inline display, so that is what to read. */
function isVisible(overlay) {
  return overlay.style.display !== 'none';
}
