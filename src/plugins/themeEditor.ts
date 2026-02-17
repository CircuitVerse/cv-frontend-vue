import { DEFAULT_THEMES } from "#/assets/themes";

export type ThemeMap = Record<string, string>;

const STORAGE_KEY = "live-themes";

function parseRootVariables(): ThemeMap {
  const vars: ThemeMap = {};
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList | null = null;
      try {
        rules = (sheet as CSSStyleSheet).cssRules;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const r of Array.from(rules)) {
        // Look for :root rule
        // Note: This only inspects top-level rules and will miss :root declarations nested inside @media/@supports blocks
        if (r instanceof CSSStyleRule) {
          if (r.selectorText && r.selectorText.includes(":root")) {
            const cssText = r.style.cssText;
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
  } catch {
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

let themeTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

// Apply with a short animated transition by toggling a helper class
export function applyThemeWithTransition(theme: ThemeMap, ms = 260) {
  const root = document.documentElement;
  if (themeTransitionTimeout) clearTimeout(themeTransitionTimeout);
  // add transition class
  root.classList.add("theme-transition");
  applyTheme(theme);
  // remove class after timeout
  themeTransitionTimeout = window.setTimeout(() => {
    root.classList.remove("theme-transition");
    themeTransitionTimeout = null;
  }, ms + 20);
}

export function exportTheme(name: string, theme: ThemeMap) {
  return JSON.stringify({ name, theme }, null, 2);
}

interface ParsedTheme {
  name: string;
  theme: ThemeMap;
}

// Pure function to parse and validate theme JSON without side effects
function parseThemeJSON(json: string): ParsedTheme | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || typeof parsed.name !== "string" || !parsed.theme) {
      return null;
    }

    // Validate theme object
    const theme = parsed.theme;
    if (typeof theme !== "object" || Array.isArray(theme)) {
      return null;
    }

    // Validate each key-value pair
    const cssCustomPropertyPattern = /^--[A-Za-z0-9\-_]+$/;
    for (const [key, val] of Object.entries(theme)) {
      if (!cssCustomPropertyPattern.test(key) || typeof val !== "string") {
        return null;
      }
    }

    return { name: parsed.name, theme };
  } catch {
    // ignore
  }
  return null;
}

export function importThemeFromJSON(json: string) {
  return parseThemeJSON(json);
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
    const parsed = JSON.parse(raw);
    // Validate that parsed value is a plain object (not array, not null)
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, ThemeMap>;
    }
    return {};
  } catch {
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
  applyThemeWithTransition,
  exportTheme,
  importThemeFromJSON,
  saveTheme,
  getAllSavedThemes,
  deleteTheme,
  loadAndApplyTheme,
  getDefaultThemes,
  applyDefaultTheme,
};
