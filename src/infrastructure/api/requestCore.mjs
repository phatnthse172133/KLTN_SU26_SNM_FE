// @ts-check

/**
 * @typedef {{ success: true; value: unknown } | { success: false }} JsonParseResult
 * @typedef {(status: number, body: any) => unknown} MapApiErrorFn
 * @typedef {() => unknown} MapTimeoutErrorFn
 * @typedef {() => unknown} MapNetworkErrorFn
 * @typedef {(message: string, options?: Record<string, unknown>) => unknown} CreateAppErrorFn
 * @typedef {Record<string, string>} ErrorMessages
 * @typedef {() => string | null} GetTokenFn
 * @typedef {() => void} OnUnauthorizedFn
 * @typedef {(url: string, init: RequestInit) => Promise<Response>} FetchFn
 *
 * @typedef {Object} RequestCoreConfig
 * @property {FetchFn} fetchFn
 * @property {string} baseUrl
 * @property {number} timeoutMs
 * @property {(raw: string) => JsonParseResult} safeJsonParse
 * @property {(customHeaders: HeadersInit | undefined, token: string | null) => Headers} buildAuthHeaders
 * @property {MapApiErrorFn} mapApiError
 * @property {MapTimeoutErrorFn} mapTimeoutError
 * @property {MapNetworkErrorFn} mapNetworkError
 * @property {CreateAppErrorFn} createAppError
 * @property {ErrorMessages} errorMessages
 * @property {GetTokenFn} getToken
 * @property {OnUnauthorizedFn} [onUnauthorized]
 */

/**
 * @param {RequestCoreConfig} config
 * @returns {(url: string, options: RequestInit) => Promise<unknown>}
 */
export function createRequest(config) {
  const {
    fetchFn,
    baseUrl,
    timeoutMs,
    safeJsonParse,
    buildAuthHeaders,
    mapApiError,
    mapTimeoutError,
    mapNetworkError,
    createAppError,
    errorMessages,
    getToken,
    onUnauthorized,
  } = config;

  /**
   * @param {Response} res
   * @returns {Promise<unknown>}
   */
  async function handleResponse(res) {
    if (res.status === 204) {
      return undefined;
    }

    const contentType = res.headers.get("content-type");
    const rawBody = await res.text();
    const isJson = contentType?.includes("application/json") && rawBody.length > 0;

    if (!res.ok) {
      if (res.status === 401 && onUnauthorized) {
        onUnauthorized();
      }

      const parsed = isJson ? safeJsonParse(rawBody) : /** @type {JsonParseResult} */ ({ success: false });
      const errorBody = parsed.success ? parsed.value : rawBody;
      throw mapApiError(res.status, errorBody);
    }

    if (isJson) {
      const parsed = safeJsonParse(rawBody);
      if (!parsed.success) {
        throw createAppError(errorMessages.generic, { status: res.status, retryable: false });
      }
      return parsed.value;
    }

    return rawBody;
  }

  return async function request(url, options) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const token = getToken();
    const headers = buildAuthHeaders(options.headers, token);
    if (options.body && !isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const externalSignal = options.signal;
    const onExternalAbort = () => timeoutController.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        clearTimeout(timeoutId);
        throw createAppError(errorMessages.generic, { retryable: false });
      }
      externalSignal.addEventListener("abort", onExternalAbort);
    }

    try {
      const response = await fetchFn(`${baseUrl}${url}`, {
        ...options,
        headers,
        signal: timeoutController.signal,
      });

      return await handleResponse(response);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (externalSignal?.aborted) {
          throw createAppError(errorMessages.generic, { retryable: false });
        }
        throw mapTimeoutError();
      }
      if (error instanceof TypeError) {
        throw mapNetworkError();
      }
      // Re-throw AppError-like objects (have .retryable property)
      if (error && typeof error === "object" && "retryable" in error) {
        throw error;
      }
      throw createAppError(errorMessages.generic, { retryable: false });
    } finally {
      clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener("abort", onExternalAbort);
      }
    }
  };
}
