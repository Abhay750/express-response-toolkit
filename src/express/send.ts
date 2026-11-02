import { HttpStatus } from '../constants/http-status.js';
import { formatError } from '../core/format-error.js';
import { formatPaginated } from '../core/format-paginated.js';
import { formatSuccess } from '../core/format-success.js';
import type { SendErrorOptions, SendPaginatedOptions, SendSuccessOptions } from '../types/options.js';
import type { PaginationInput } from '../types/pagination.js';
import type { ResponseLike } from '../types/response.js';
import { assertResponseLike } from '../utils/assertions.js';

/**
 * Sends a standardized success JSON response using an Express Response object.
 * When status is 204 No Content, terminates the response immediately via `.end()`.
 */
export function sendSuccess<T = unknown>(
  res: ResponseLike,
  data?: T,
  options?: SendSuccessOptions
): ResponseLike {
  assertResponseLike(res, 'sendSuccess');

  if (res.headersSent) {
    return res;
  }

  const targetStatusCode = options?.statusCode ?? HttpStatus.OK;
  if (targetStatusCode === HttpStatus.NO_CONTENT) {
    res.status(HttpStatus.NO_CONTENT).end();
    return res;
  }

  const payload = formatSuccess(data, options);
  res.status(payload.statusCode).json(payload);
  return res;
}

/**
 * Sends a standardized error JSON response using an Express Response object.
 */
export function sendError(
  res: ResponseLike,
  error: unknown,
  options?: SendErrorOptions
): ResponseLike {
  assertResponseLike(res, 'sendError');

  if (res.headersSent) {
    return res;
  }

  const payload = formatError(error, options);

  if (payload.statusCode === HttpStatus.NO_CONTENT) {
    res.status(HttpStatus.NO_CONTENT).end();
    return res;
  }

  res.status(payload.statusCode).json(payload);
  return res;
}

/**
 * Sends a standardized paginated JSON response using an Express Response object.
 */
export function sendPaginated<T = unknown>(
  res: ResponseLike,
  items: T[],
  pagination: PaginationInput,
  options?: SendPaginatedOptions
): ResponseLike {
  assertResponseLike(res, 'sendPaginated');

  if (res.headersSent) {
    return res;
  }

  const payload = formatPaginated(items, pagination, options);

  if (payload.statusCode === HttpStatus.NO_CONTENT) {
    res.status(HttpStatus.NO_CONTENT).end();
    return res;
  }

  res.status(payload.statusCode).json(payload);
  return res;
}

