import type {
  CursorPaginationInput,
  CursorPaginationMeta,
  OffsetPaginationInput,
  OffsetPaginationMeta,
} from '../types/pagination.js';
import { assertNonNegativeInteger, assertPositiveInteger } from './assertions.js';

/**
 * Calculates page-based (offset) pagination metadata with boundary safeguards.
 */
export function calculateOffsetPagination(input: OffsetPaginationInput): OffsetPaginationMeta {
  assertPositiveInteger(input.page, 'page');
  assertPositiveInteger(input.limit, 'limit');
  assertNonNegativeInteger(input.totalItems, 'totalItems');

  const { page, limit, totalItems } = input;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  const hasNextPage = totalPages > 0 && page < totalPages;
  const hasPrevPage = page > 1 && totalPages > 0;

  return {
    type: 'offset',
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
}

/**
 * Normalizes cursor-based pagination metadata with boundary safeguards.
 */
export function calculateCursorPagination(input: CursorPaginationInput): CursorPaginationMeta {
  assertPositiveInteger(input.limit, 'limit');

  const nextCursor = input.nextCursor ?? null;
  const prevCursor = input.prevCursor ?? null;

  const hasNextPage =
    typeof input.hasNextPage === 'boolean'
      ? input.hasNextPage
      : nextCursor !== null;

  const hasPrevPage = prevCursor !== null;

  return {
    type: 'cursor',
    limit: input.limit,
    nextCursor,
    prevCursor,
    hasNextPage,
    hasPrevPage,
  };
}

