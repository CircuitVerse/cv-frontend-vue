import { DEFAULT_THEMES } from '#/assets/themes'

export type ThemeMap = Record<string, string>;

const STORAGE_KEY = "live-themes";

function parseRootVariables(): ThemeMap {
  const vars: ThemeMap = {};
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try {
        rules = (sheet as CSSStyleSheet).cssRules;
      } catch (e) {
        continue;
      }
      if (!rules) continue;
      for (const r of Array.from(rules)) {
        // Look for :root rule
        if (r.type === CSSRule.STYLE_RULE) {
          const sr = r as CSSStyleRule;
          if (sr.selectorText && sr.selectorText.includes(":root")) {
            const cssText = sr.style.cssText;
            const re = /(--[a-zA-Z0-9-_]+)\s*:\s*([^;]+);/g;
            let m: RegExpExecArray | null;
            while ((m = re.exec(cssText))) {
              const key = m[1].trim();
              const val = m[2].trim();
              vars[key] = val;
            }
          }
        }
      }
    }
  } catch (e) {
    // best-effort; return whatever we have
  }
  return vars;
}

export function getRootTheme(): ThemeMap {
  const computed = getComputedStyle(document.documentElement);
  const parsed = parseRootVariables();
  const result: ThemeMap = {};
  // Use parsed keys, but prefer computed values so variables coming from other sheets are captured
  for (const k of Object.keys(parsed)) {
    const v = computed.getPropertyValue(k).trim() || parsed[k];
    result[k] = v;
  }
  return result;
}

export function applyTheme(theme: ThemeMap) {
  const root = document.documentElement;
  for (const k of Object.keys(theme)) {
    root.style.setProperty(k, theme[k]);
  }
}

// Apply with a short animated transition by toggling a helper class
export function applyThemeWithTransition(theme: ThemeMap, ms = 260) {
  const root = document.documentElement;
  // add transition class
  root.classList.add('theme-transition');
  applyTheme(theme);
  // remove class after timeout
  window.setTimeout(() => {
    root.classList.remove('theme-transition');
  }, ms + 20);
}

export function exportTheme(name: string, theme: ThemeMap) {
  return JSON.stringify({ name, theme }, null, 2);
}

export function importThemeFromJSON(json: string) {
  try {
    const parsed = JSON.parse(json);
    if (parsed && parsed.name && parsed.theme) {
      saveTheme(parsed.name, parsed.theme);
      return parsed;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function saveTheme(name: string, theme: ThemeMap) {
  const all = getAllSavedThemes();
  all[name] = theme;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getAllSavedThemes(): Record<string, ThemeMap> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

export function deleteTheme(name: string) {
  const all = getAllSavedThemes();
  delete all[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function loadAndApplyTheme(name: string) {
  const all = getAllSavedThemes();
  const t = all[name];
  if (t) applyTheme(t);
  return t;
}

export function getDefaultThemes(): Record<string, ThemeMap> {
  return DEFAULT_THEMES as Record<string, ThemeMap>;
}

export function applyDefaultTheme(name: string) {
  const def = getDefaultThemes()[name];
  if (def) applyTheme(def);
  return def;
}

export default {
  getRootTheme,
  applyTheme,
  saveTheme,
  getAllSavedThemes,
  deleteTheme,
  loadAndApplyTheme,
  getDefaultThemes,
  applyDefaultTheme,
};
