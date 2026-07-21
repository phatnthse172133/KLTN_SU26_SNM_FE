// @ts-check

/**
 * @typedef {{ success: true; value: unknown } | { success: false }} JsonParseResult
 */

/** @type {number} */
export const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Safely parse a JSON string, returning a discriminated union.
 * @param {string} raw - Raw JSON string to parse.
 * @returns {JsonParseResult}
 */
export function safeJsonParse(raw) {
  if (!raw) return /** @type {JsonParseResult} */ ({ success: false });
  try {
    return { success: true, value: JSON.parse(raw) };
  } catch {
    return /** @type {JsonParseResult} */ ({ success: false });
  }
}

/**
 * Serialize a request body. FormData is passed through; everything else is JSON.stringified.
 * @param {unknown} body - Request body to serialize.
 * @returns {FormData | string}
 */
export function serializeBody(body) {
  return body instanceof FormData ? body : JSON.stringify(body);
}

/**
 * Build auth headers, preserving caller headers and adding Bearer token if not already set.
 * @param {HeadersInit | undefined} customHeaders - Caller-provided headers.
 * @param {string | null} token - Auth token, or null if not authenticated.
 * @returns {Headers}
 */
export function buildAuthHeaders(customHeaders, token) {
  const headers = new Headers(customHeaders);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}
