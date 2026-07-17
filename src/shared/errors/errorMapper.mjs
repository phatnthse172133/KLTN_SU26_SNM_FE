// @ts-check

import { errorMessages, businessErrorMessages } from './errorMessages.mjs';

/**
 * @typedef {Object} AppErrorObj
 * @property {number | undefined} [status]
 * @property {string | undefined} [code]
 * @property {string} message
 * @property {Record<string, string[]> | undefined} [fieldErrors]
 * @property {boolean} retryable
 */

/**
 * @param {string} message
 * @param {Partial<Omit<AppErrorObj, 'message'>> & { retryable?: boolean }} [options]
 * @returns {AppErrorObj}
 */
export function createAppError(message, options) {
  return {
    status: options?.status,
    code: options?.code,
    message,
    fieldErrors: options?.fieldErrors,
    retryable: options?.retryable ?? false,
  };
}

/**
 * @param {unknown} error
 * @returns {error is AppErrorObj}
 */
export function isAppError(error) {
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof /** @type {Record<string, unknown>} */ (error).message === 'string' &&
    typeof /** @type {Record<string, unknown>} */ (error).retryable === 'boolean'
  );
}

/**
 * @typedef {Object} ParsedErrorBody
 * @property {boolean} [success]
 * @property {string} [message]
 * @property {string} [Message]
 * @property {{ errorCode?: string; ErrorCode?: string; traceId?: string; details?: string }} [data]
 * @property {Record<string, string[]>} [errors]
 * @property {string} [title]
 * @property {string} [error]
 */

/**
 * @param {ParsedErrorBody | null} body
 * @returns {string | undefined}
 */
function extractErrorCode(body) {
  if (!body) return undefined;
  const data = body.data;
  if (data && (data.errorCode || data.ErrorCode)) {
    return data.errorCode ?? data.ErrorCode;
  }
  return undefined;
}

/**
 * @param {ParsedErrorBody | null} body
 * @returns {Record<string, string[]> | undefined}
 */
function extractFieldErrors(body) {
  if (!body?.errors) return undefined;
  return body.errors;
}

/**
 * @param {number} status
 * @param {ParsedErrorBody | null} body
 * @param {boolean} [isNetworkError]
 * @returns {AppErrorObj}
 */
export function mapApiError(status, body, isNetworkError) {
  if (isNetworkError) {
    return createAppError(errorMessages.network, { retryable: true });
  }

  const errorCode = extractErrorCode(body);
  const fieldErrors = extractFieldErrors(body);

  if (errorCode && businessErrorMessages[errorCode]) {
    return createAppError(businessErrorMessages[errorCode], {
      status,
      code: errorCode,
      fieldErrors,
      retryable: status === 429,
    });
  }

  const statusMessage = errorMessages[String(status)];
  if (statusMessage) {
    return createAppError(statusMessage, {
      status,
      code: errorCode,
      fieldErrors,
      retryable: status === 429,
    });
  }

  return createAppError(errorMessages.generic, {
    status,
    code: errorCode,
    fieldErrors,
    retryable: false,
  });
}

/**
 * @returns {AppErrorObj}
 */
export function mapNetworkError() {
  return createAppError(errorMessages.network, { retryable: true });
}

/**
 * @returns {AppErrorObj}
 */
export function mapTimeoutError() {
  return createAppError(errorMessages.timeout, { retryable: true });
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (isAppError(error)) {
    return error.message;
  }
  return errorMessages.generic;
}
