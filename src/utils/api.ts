/**
 * API utility for CircuitVerse (Tauri + web).
 */

export function isTauri(): boolean {
    return (
        typeof window !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__)
    );
}

const CV_PRODUCTION_URL = "https://circuitverse.org";

export function getApiBaseUrl(): string {
    return isTauri() ? CV_PRODUCTION_URL : "";
}

export function apiUrl(path: string): string {
    return `${getApiBaseUrl()}${path}`;
}

export function getAuthToken(): string | undefined {
    try {
        const stored = localStorage.getItem("cv_token");
        if (stored) return stored;
    } catch {
        /* localStorage may be unavailable */
    }

    if (!isTauri()) {
        const match = document.cookie.match(new RegExp("(^| )cvt=([^;]+)"));
        if (match) return match[2];
    }

    return undefined;
}

export function authHeaders(): Record<string, string> {
    const token = getAuthToken();
    return token ? { Authorization: `Token ${token}` } : {};
}

interface TauriHttpResponse {
    status: number;
    status_text: string;
    headers: [string, string][];
    body: string;
}

/**
 * Drop-in replacement for `fetch()` that routes through
 * a custom Rust command in Tauri (bypassing CORS).
 */
export async function apiFetch(
    input: string,
    init?: RequestInit,
): Promise<Response> {
    const url = apiUrl(input);
    const method = init?.method ?? "GET";

    if (isTauri()) {
        const headers: [string, string][] = [];
        if (init?.headers) {
            if (init.headers instanceof Headers) {
                init.headers.forEach((v, k) => headers.push([k, v]));
            } else if (Array.isArray(init.headers)) {
                for (const pair of init.headers) {
                    headers.push(pair as [string, string]);
                }
            } else {
                for (const [k, v] of Object.entries(init.headers)) {
                    headers.push([k, v]);
                }
            }
        }

        const body: string | null =
            init?.body != null ? String(init.body) : null;

        try {
            const { invoke } = await import("@tauri-apps/api/core");

            const result = await invoke<TauriHttpResponse>("http_request", {
                method,
                url,
                headers,
                body,
            });

            return new Response(result.body, {
                status: result.status,
                statusText: result.status_text,
                headers: result.headers,
            });
        } catch (err) {
            console.error(`[api] ${method} ${url} → FAILED:`, err);
            throw err;
        }
    }

    return globalThis.fetch(url, init);
}
