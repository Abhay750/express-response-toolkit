import { describe, expect, it } from 'vitest';
import { HttpStatus } from '../../src/constants/http-status.js';
import { formatSuccess } from '../../src/core/format-success.js';

describe('formatSuccess', () => {
  it('should format a default success response with 200 OK and null data if undefined', () => {
    const response = formatSuccess();

    expect(response).toEqual({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'OK',
      data: null,
    });
    expect(response.meta).toBeUndefined();
  });

  it('should format a success response with custom status 201 and default reason phrase', () => {
    const response = formatSuccess({ id: 1 }, { statusCode: HttpStatus.CREATED });

    expect(response).toEqual({
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Created',
      data: { id: 1 },
    });
  });

  it('should allow custom status code and custom message', () => {
    const response = formatSuccess(
      { user: 'Alice' },
      { statusCode: HttpStatus.ACCEPTED, message: 'Request accepted for processing' }
    );

    expect(response).toEqual({
      success: true,
      statusCode: HttpStatus.ACCEPTED,
      message: 'Request accepted for processing',
      data: { user: 'Alice' },
    });
  });

  it('should handle null, empty array, and nested object data payloads', () => {
    const nullResponse = formatSuccess(null);
    expect(nullResponse.data).toBeNull();

    const emptyArrayResponse = formatSuccess([]);
    expect(emptyArrayResponse.data).toEqual([]);

    const nestedData = {
      level1: {
        level2: {
          items: [1, 2, 3],
        },
      },
    };
    const nestedResponse = formatSuccess(nestedData);
    expect(nestedResponse.data).toEqual(nestedData);
  });

  it('should preserve and clone metadata when provided', () => {
    const meta = { requestId: 'req-123', timestamp: '2026-11-02T00:00:00Z' };
    const response = formatSuccess({ ok: true }, { meta });

    expect(response.meta).toEqual(meta);
    expect(response.meta).not.toBe(meta); // Cloned immutably
  });

  it('should ignore empty metadata object', () => {
    const response = formatSuccess('data', { meta: {} });
    expect(response.meta).toBeUndefined();
  });

  it('should throw RangeError for invalid status codes', () => {
    expect(() => formatSuccess('test', { statusCode: 99 })).toThrow(RangeError);
    expect(() => formatSuccess('test', { statusCode: 600 })).toThrow(RangeError);
    expect(() => formatSuccess('test', { statusCode: 200.5 as unknown as number })).toThrow(
      RangeError
    );
  });

  it('should fallback to "Success" if an unmapped status code within 100-599 is provided', () => {
    const response = formatSuccess('ok', { statusCode: 299 });
    expect(response.statusCode).toBe(299);
    expect(response.message).toBe('Success');
  });
});

