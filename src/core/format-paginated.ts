import { HttpReasonPhrase, HttpStatus } from '../constants/http-status.js';
import type { FormatPaginatedOptions } from '../types/options.js';
import type { CursorPaginationInput, OffsetPaginationInput, PaginationInput, PaginationMeta } from '../types/pagination.js';
import type { PaginatedEnvelope } from '../types/response.js';
import { assertValidStatusCode } from '../utils/assertions.js';
import { calculateCursorPagination, calculateOffsetPagination } from '../utils/pagination-math.js';
import { safeClone } from '../utils/sanitize.js';

function isCursorInput(input: PaginationInput): input is CursorPaginationInput {
  if (input.type === 'cursor') {
    return true;
  }
  if (input.type === 'offset') {
    return false;
  }
  return 'nextCursor' in input || 'prevCursor' in input;
}

/**
 * Creates a standardized paginated response envelope supporting offset and cursor strategies.
 */
export function formatPaginated<T = unknown>(
  items: T[],
  pagination: PaginationInput,
  options?: FormatPaginatedOptions
): PaginatedEnvelope<T> {
  if (!Array.isArray(items)) {
    throw new TypeError(`Expected items to be an array. Received: ${typeof items}`);
  }

  const statusCode = options?.statusCode ?? HttpStatus.OK;
  assertValidStatusCode(statusCode, 'Paginated status code');

  const defaultMessage = HttpReasonPhrase[statusCode] ?? 'Success';
  const message = options?.message ?? defaultMessage;

  const paginationMeta: PaginationMeta = isCursorInput(pagination)
    ? calculateCursorPagination(pagination)
    : calculateOffsetPagination(pagination as OffsetPaginationInput);

  const envelope: PaginatedEnvelope<T> = {
    success: true,
    statusCode,
    message,
    data: items,
    pagination: paginationMeta,
  };

  if (options?.meta && Object.keys(options.meta).length > 0) {
    envelope.meta = safeClone(options.meta);
  }

  return envelope;
}

