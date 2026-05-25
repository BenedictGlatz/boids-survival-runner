let _strings = {};

/**
 * Loads the locale file for the given language code.
 * Falls back to English if the requested locale is unavailable.
 * @param {string} lang - BCP 47 language tag, e.g. 'en', 'de'.
 */
export async function loadLocale(lang = 'en') {
  try {
    const res = await fetch(`./locales/${lang}.json`);
    _strings = await res.json();
  } catch {
    if (lang !== 'en') {
      await loadLocale('en');
    }
  }
}

/**
 * Returns the translated string for the given dot-separated key.
 * Returns the key itself when no translation is found.
 * @param {string} key - Namespaced key, e.g. 'menu.start'.
 * @returns {string}
 */
export function t(key) {
  return key.split('.').reduce((obj, k) => obj?.[k], _strings) ?? key;
}
