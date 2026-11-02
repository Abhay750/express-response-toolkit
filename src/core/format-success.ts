import { HttpReasonPhrase, HttpStatus } from '../constants/http-status.js';
import type { FormatSuccessOptions } from '../types/options.js';
import type { SuccessEnvelope } from '../types/response.js';
import { assertValidStatusCode } from '../utils/assertions.js';
import { safeClone } from '../utils/sanitize.js';

/**
 * Creates a standardized success response envelope.
 */
export function formatSuccess<T = unknown>(
  data?: T,
  options?: FormatSuccessOptions
): SuccessEnvelope<T> {
  const statusCode = options?.statusCode ?? HttpStatus.OK;
  assertValidStatusCode(statusCode, 'Success status code');

  const defaultMessage = HttpReasonPhrase[statusCode] ?? 'Success';
  const message = options?.message ?? defaultMessage;

  const envelope: SuccessEnvelope<T> = {
    success: true,
    statusCode,
    message,
    data: data === undefined ? (null as unknown as T) : data,
  };

  if (options?.meta && Object.keys(options.meta).length > 0) {
    envelope.meta = safeClone(options.meta);
  }

  return envelope;
}

