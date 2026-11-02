import { describe, expect, it } from 'vitest';
import { HttpStatus } from '../../src/constants/http-status.js';
import { formatPaginated } from '../../src/core/format-paginated.js';

describe('formatPaginated', () => {
  describe('offset pagination', () => {
    it('should format offset pagination with totalItems = 0', () => {
      const response = formatPaginated([], {
        page: 1,
        limit: 10,
        totalItems: 0,
      });

      expect(response).toEqual({
        success: true,
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: [],
        pagination: {
          type: 'offset',
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it('should calculate partial pages correctly', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const response = formatPaginated(items, {
        page: 1,
        limit: 10,
        totalItems: 25,
      });

      expect(response.pagination).toEqual({
        type: 'offset',
        page: 1,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('should calculate exact page boundary correctly', () => {
      const response = formatPaginated([1, 2, 3], {
        type: 'offset',
        page: 2,
        limit: 10,
        totalItems: 20,
      });

      expect(response.pagination).toEqual({
        type: 'offset',
        page: 2,
        limit: 10,
        totalItems: 20,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it('should handle middle page navigation', () => {
      const response = formatPaginated([1], {
        page: 2,
        limit: 10,
        totalItems: 30,
      });

      expect(response.pagination).toEqual({
        type: 'offset',
        page: 2,
        limit: 10,
        totalItems: 30,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true,
      });
    });

    it('should handle page exceeding totalPages', () => {
      const response = formatPaginated([], {
        page: 10,
        limit: 10,
        totalItems: 20,
      });

      expect(response.pagination).toEqual({
        type: 'offset',
        page: 10,
        limit: 10,
        totalItems: 20,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
      });
    });
  });

  describe('cursor pagination', () => {
    it('should format cursor pagination with nextCursor and no prevCursor', () => {
      const items = ['a', 'b'];
      const response = formatPaginated(items, {
        type: 'cursor',
        limit: 2,
        nextCursor: 'cur_123',
      });

      expect(response.pagination).toEqual({
        type: 'cursor',
        limit: 2,
        nextCursor: 'cur_123',
        prevCursor: null,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('should format cursor pagination with both cursors and explicit hasNextPage flag', () => {
      const items = ['c', 'd'];
      const response = formatPaginated(items, {
        limit: 2,
        nextCursor: 'cur_456',
        prevCursor: 'cur_123',
        hasNextPage: false,
      });

      expect(response.pagination).toEqual({
        type: 'cursor',
        limit: 2,
        nextCursor: 'cur_456',
        prevCursor: 'cur_123',
        hasNextPage: false,
        hasPrevPage: true,
      });
    });

    it('should handle end of cursor pagination where nextCursor is null', () => {
      const response = formatPaginated(['z'], {
        type: 'cursor',
        limit: 10,
        nextCursor: null,
        prevCursor: 'cur_prev',
      });

      expect(response.pagination).toEqual({
        type: 'cursor',
        limit: 10,
        nextCursor: null,
        prevCursor: 'cur_prev',
        hasNextPage: false,
        hasPrevPage: true,
      });
    });
  });

  describe('input validation and error boundaries', () => {
    it('should throw TypeError when items is not an array', () => {
      expect(() => formatPaginated('not an array' as unknown as unknown[], { page: 1, limit: 10, totalItems: 10 })).toThrow(
        TypeError
      );
    });

    it('should throw RangeError on negative or non-integer page/limit/totalItems', () => {
      expect(() => formatPaginated([], { page: 0, limit: 10, totalItems: 10 })).toThrow(RangeError);
      expect(() => formatPaginated([], { page: -1, limit: 10, totalItems: 10 })).toThrow(RangeError);
      expect(() => formatPaginated([], { page: 1.5, limit: 10, totalItems: 10 })).toThrow(RangeError);
      expect(() => formatPaginated([], { page: 1, limit: 0, totalItems: 10 })).toThrow(RangeError);
      expect(() => formatPaginated([], { page: 1, limit: -5, totalItems: 10 })).toThrow(RangeError);
      expect(() => formatPaginated([], { page: 1, limit: 10, totalItems: -1 })).toThrow(RangeError);
      expect(() => formatPaginated([], { page: 1, limit: 10, totalItems: 10.2 })).toThrow(RangeError);
    });

    it('should throw RangeError on invalid cursor limit', () => {
      expect(() => formatPaginated([], { type: 'cursor', limit: 0 })).toThrow(RangeError);
      expect(() => formatPaginated([], { type: 'cursor', limit: -1 })).toThrow(RangeError);
      expect(() => formatPaginated([], { type: 'cursor', limit: 2.5 })).toThrow(RangeError);
    });

    it('should fallback to "Success" message when unmapped status code is provided', () => {
      const response = formatPaginated([], { page: 1, limit: 10, totalItems: 0 }, { statusCode: 299 });
      expect(response.statusCode).toBe(299);
      expect(response.message).toBe('Success');
    });

    it('should preserve and clone metadata when provided', () => {
      const meta = { executionTimeMs: 42 };
      const response = formatPaginated([], { page: 1, limit: 10, totalItems: 0 }, { meta });
      expect(response.meta).toEqual(meta);
      expect(response.meta).not.toBe(meta);
    });
  });
});
