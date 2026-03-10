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

/**
 * Resolve the base path for the Vue simulator app (used for edit redirects).
 * Honors VITE_BASE / custom mounts via window.SIM_BASE or import.meta.env.BASE_URL.
 * Returns the "mount root" with no trailing slash (e.g. /simulatorvue or /simulator-v1).
 */
export function getSimulatorBase() {
    const win =
        typeof window !== 'undefined' ? window : /** @type {any} */ ({})

    if (win.SIM_BASE) {
        let base = String(win.SIM_BASE).replace(/\/+$/, '')
        if (/\/v[01]$/.test(base)) {
            base = base.replace(/\/v[01]$/, '')
        }
        return base || '/'
    }

    const baseUrl = (import.meta.env && import.meta.env.BASE_URL) || '/'
    let base = baseUrl.replace(/\/+$/, '')
    // Strip version segment (/v0 or /v1) so we get the Vue simulator root (e.g. /simulatorvue)
    if (/\/v[01]$/.test(base)) {
        base = base.replace(/\/v[01]$/, '')
    }
    return base || '/'
}

/**
 * Resolve the base path for the legacy (non-Vue) simulator edit redirect.
 * Defaults to "/simulator"; override via window.CV_LEGACY_SIMULATOR_BASE or VITE_LEGACY_SIMULATOR_BASE.
 */
export function getLegacySimulatorBase() {
    const win =
        typeof window !== 'undefined' ? window : /** @type {any} */ ({})

    if (win.CV_LEGACY_SIMULATOR_BASE) {
        return String(win.CV_LEGACY_SIMULATOR_BASE).replace(/\/+$/, '')
    }

    const envBase = import.meta.env && import.meta.env.VITE_LEGACY_SIMULATOR_BASE
    if (envBase) {
        return String(envBase).replace(/\/+$/, '')
    }

    return '/simulator'
}

/**
 * Build the Vue simulator edit URL for version redirect (honors SIM_BASE / BASE_URL).
 * @param {string} projectName
 * @param {string} simVer - simulator version (e.g. "v1")
 */
export function buildVueSimulatorEditUrl(projectName, simVer) {
    const base = getSimulatorBase()
    const name = encodeURIComponent(projectName)
    const ver = encodeURIComponent(simVer)
    return `${base}/edit/${name}?simver=${ver}`
}

/**
 * Build the legacy simulator edit URL (honors CV_LEGACY_SIMULATOR_BASE).
 * @param {string} projectName
 */
export function buildLegacySimulatorEditUrl(projectName) {
    const base = getLegacySimulatorBase()
    const name = encodeURIComponent(projectName)
    return `${base}/edit/${name}`
}
