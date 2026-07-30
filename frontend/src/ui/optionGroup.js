/**
 * Shared markup and click handling for the start menu's settings groups.
 *
 * Every setting is a labelled row of mutually exclusive choices, so the template
 * and the selection logic live here once instead of being copied per setting.
 * Mutates the DOM only — no game logic.
 */

/**
 * Renders one labelled group of choices.
 *
 * The choices are deliberately plain buttons with `aria-pressed` rather than
 * radio inputs or `role="radiogroup"`: the arrow keys belong to the menu list while an
 * overlay is open and to the player while a round runs, so a radiogroup's native
 * arrow-key navigation would be fighting for the same keys and end up broken for
 * keyboard and screen-reader users. Toggle buttons carry no arrow-key expectation and
 * work with Tab plus Enter/Space.
 * @param {{id: string, label: string, hint?: string,
 *          options: Array<{value: string, label: string, ariaLabel?: string,
 *                          selected: boolean}>}} group - Layout and options to render.
 * @returns {string} HTML for the group.
 */
export function renderOptionGroup({ id, label, hint, options }) {
  const labelId = `${id}-label`;
  const buttons = options.map(renderOption).join('');
  const hintMarkup = hint ? `<p class="hint">${hint}</p>` : '';

  return `
    <div class="menu-option-group">
      <span id="${labelId}" class="kicker">${label}</span>
      <div id="${id}" class="segmented" role="group" aria-labelledby="${labelId}">
        ${buttons}
      </div>
      ${hintMarkup}
    </div>
  `;
}

/**
 * Wires selection for a group rendered by `renderOptionGroup`. One delegated
 * listener per group, so the buttons can be re-rendered without rebinding.
 * @param {string} id - The group id passed to `renderOptionGroup`.
 * @param {(value: string) => void} onSelect - Receives the chosen raw value.
 */
export function bindOptionGroup(id, onSelect) {
  const group = document.getElementById(id);

  group.addEventListener('click', (event) => {
    const clicked = event.target.closest('button');
    if (!clicked) return;

    for (const option of group.querySelectorAll('button')) {
      const isSelected = option === clicked;
      option.classList.toggle('is-selected', isSelected);
      option.setAttribute('aria-pressed', String(isSelected));
    }

    onSelect(clicked.dataset.optionValue);
  });
}

function renderOption({ value, label, ariaLabel, selected }) {
  return `
    <button type="button"
            class="${selected ? 'is-selected' : ''}"
            data-option-value="${value}"
            aria-pressed="${selected}"
            aria-label="${ariaLabel ?? label}">${label}</button>
  `;
}
