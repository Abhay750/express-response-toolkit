import { HttpErrorCode, HttpStatus } from '../constants/http-status.js';
import type { FormatErrorOptions } from '../types/options.js';
import type { ErrorEnvelope, ErrorPayload } from '../types/response.js';
import { assertValidStatusCode } from '../utils/assertions.js';
import { isProduction, normalizeError, safeClone } from '../utils/sanitize.js';

/**
 * Creates a standardized error response envelope with automatic production masking.
 */
export function formatError(
  error: unknown,
  options?: FormatErrorOptions
): ErrorEnvelope {
  const normalized = normalizeError(error);

  const rawStatusCode =
    options?.statusCode ?? normalized.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
  assertValidStatusCode(rawStatusCode, 'Error status code');
  const statusCode = rawStatusCode;

  const isOperational =
    options?.isOperational ?? normalized.isOperational ?? false;

  const isProd = isProduction();
  const isServerFailure = statusCode >= 500;
  const shouldMask = isServerFailure && isProd && !isOperational;

  const code =
    options?.code ??
    normalized.code ??
    HttpErrorCode[statusCode] ??
    'INTERNAL_SERVER_ERROR';

  const message = shouldMask
    ? 'Internal Server Error'
    : (options?.message ?? normalized.message);

  const details = shouldMask
    ? undefined
    : (options?.details !== undefined ? safeClone(options.details) : normalized.details);

  let stack: string | undefined;
  if (options?.includeStack === true) {
    stack = normalized.stack;
  } else if (options?.includeStack === false) {
    stack = undefined;
  } else if (!isProd) {
    stack = normalized.stack;
  }

  const errorPayload: ErrorPayload = {
    code,
    message,
  };

  if (details !== undefined && details !== null) {
    errorPayload.details = details;
  }

  if (stack) {
    errorPayload.stack = stack;
  }

  const envelope: ErrorEnvelope = {
    success: false,
    statusCode,
    error: errorPayload,
  };

  if (options?.meta && Object.keys(options.meta).length > 0) {
    envelope.meta = safeClone(options.meta);
  }

  return envelope;
}

