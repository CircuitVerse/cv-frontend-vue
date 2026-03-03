// Incremental shared fetch wrapper; call sites can migrate here gradually.

export type UnauthorizedHandler = (
  response: Response
) => void | Promise<void>;

export interface ApiFetchOptions extends RequestInit {
  onUnauthorized?: UnauthorizedHandler;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isSameOrigin(target: string | URL): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const resolved = new URL(target.toString(), window.location.href);
    return resolved.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }

  const cookieParts = document.cookie.split(";");

  for (const part of cookieParts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) {
      continue;
    }

    const separatorIndex = trimmedPart.indexOf("=");
    const rawName =
      separatorIndex >= 0
        ? trimmedPart.slice(0, separatorIndex)
        : trimmedPart;
    const rawValue =
      separatorIndex >= 0 ? trimmedPart.slice(separatorIndex + 1) : "";

    let decodedName = rawName;
    try {
      decodedName = decodeURIComponent(rawName);
    } catch {
      // Keep raw value when decoding fails.
    }

    if (decodedName !== name) {
      continue;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

export function getAuthToken(): string | null {
  return getCookie("cvt");
}

export async function apiFetch(
  // Keep string | URL for this incremental wrapper; can widen later if needed.
  url: string | URL,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { onUnauthorized, headers: callerHeaders, body: callerBody, ...rest } =
    options;
  const headers = new Headers(callerHeaders);
  const method = (rest.method ?? "GET").toUpperCase();
  const shouldAttachBody = method !== "GET" && method !== "HEAD";

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const token = getAuthToken();
  if (token && isSameOrigin(url) && !headers.has("Authorization")) {
    headers.set("Authorization", `Token ${token}`);
  }

  let requestBody: BodyInit | null | undefined = callerBody;
  if (shouldAttachBody && isPlainObject(callerBody)) {
    requestBody = JSON.stringify(callerBody);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const requestOptions: RequestInit = { ...rest, headers };
  if (shouldAttachBody && requestBody !== undefined) {
    requestOptions.body = requestBody;
  }

  const response = await fetch(url, requestOptions);

  if (response.status === 401 && onUnauthorized) {
    await onUnauthorized(response.clone());
  }

  return response;
}
