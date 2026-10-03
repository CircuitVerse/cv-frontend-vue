/**
 * Resolve the base URL for CircuitVerse API requests.
 * Preference order:
 * 1. window.CV_API_BASE (runtime override, no trailing slash)
 * 2. import.meta.env.VITE_API_BASE (build-time env, no trailing slash)
 * 3. "/api" (default used by CircuitVerse Rails)
 */
export function getApiBase() {
    const win =
        typeof window !== 'undefined' ? window : /** @type {any} */ ({})

    if (win.CV_API_BASE) {
        return String(win.CV_API_BASE).replace(/\/+$/, '')
    }

    // Vite exposes env vars on import.meta.env
    const viteApiBase = import.meta.env && import.meta.env.VITE_API_BASE
    if (viteApiBase) {
        return String(viteApiBase).replace(/\/+$/, '')
    }

    return '/api'
}

/**
 * Build a full API URL from a path fragment (with or without leading slash).
 * Ensures there is exactly one slash between base and path.
 * @param {string} path
 */
export function buildApiUrl(path) {
    const base = getApiBase()
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalizedPath}`
}

