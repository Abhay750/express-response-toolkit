import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpStatus } from '../../src/constants/http-status.js';
import { formatError } from '../../src/core/format-error.js';
import { ApiError } from '../../src/errors/api-error.js';

describe('formatError', () => {
  const originalEnv = process.env['NODE_ENV'];

  beforeEach(() => {
    process.env['NODE_ENV'] = 'test';
  });

  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
  });

  it('should format a standard Error with 500 status and default code in non-production', () => {
    const error = new Error('Database connection failed');
    const response = formatError(error);

    expect(response.success).toBe(false);
    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(response.error.message).toBe('Database connection failed');
    expect(response.error.stack).toBeDefined();
    expect(response.meta).toBeUndefined();
  });

  it('should support custom status code, custom code, and custom message via options', () => {
    const error = new Error('Original message');
    const response = formatError(error, {
      statusCode: HttpStatus.FORBIDDEN,
      code: 'ACCESS_DENIED',
      message: 'You cannot access this resource',
    });

    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
    expect(response.error.code).toBe('ACCESS_DENIED');
    expect(response.error.message).toBe('You cannot access this resource');
  });

  it('should preserve and clone error details and metadata', () => {
    const details = [{ field: 'email', reason: 'Invalid format' }];
    const meta = { correlationId: 'abc-123' };

    const response = formatError(new Error('Validation error'), {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      details,
      meta,
    });

    expect(response.error.details).toEqual(details);
    expect(response.error.details).not.toBe(details);
    expect(response.meta).toEqual(meta);
  });

  describe('production masking logic', () => {
    beforeEach(() => {
      process.env['NODE_ENV'] = 'production';
    });

    it('should mask 500 error messages to "Internal Server Error" and strip details and stack by default in production', () => {
      const error = new Error('Sensitive database credentials leak');
      const response = formatError(error, {
        details: { sql: 'SELECT * FROM users' },
      });

      expect(response.statusCode).toBe(500);
      expect(response.error.message).toBe('Internal Server Error');
      expect(response.error.details).toBeUndefined();
      expect(response.error.stack).toBeUndefined();
    });

    it('should NOT mask error message or details if isOperational is true', () => {
      const error = new ApiError({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Known operational third-party gateway failure',
        details: { gateway: 'stripe' },
        isOperational: true,
      });

      const response = formatError(error);

      expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.error.message).toBe('Known operational third-party gateway failure');
      expect(response.error.details).toEqual({ gateway: 'stripe' });
      expect(response.error.stack).toBeUndefined(); // Stack still stripped in prod
    });

    it('should NOT mask 4xx client errors in production', () => {
      const response = formatError(new Error('Item not found'), {
        statusCode: HttpStatus.NOT_FOUND,
        details: { id: 42 },
      });

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(response.error.message).toBe('Item not found');
      expect(response.error.details).toEqual({ id: 42 });
    });

    it('should include stack trace in production if explicitly configured via includeStack: true', () => {
      const error = new Error('Test error');
      const response = formatError(error, {
        includeStack: true,
      });

      expect(response.error.stack).toBeDefined();
    });
  });

  describe('stack trace behavior', () => {
    it('should exclude stack trace when includeStack is false in non-production', () => {
      process.env['NODE_ENV'] = 'development';
      const response = formatError(new Error('Sample'), { includeStack: false });
      expect(response.error.stack).toBeUndefined();
    });

    it('should include stack trace in development when includeStack is omitted', () => {
      process.env['NODE_ENV'] = 'development';
      const response = formatError(new Error('Sample'));
      expect(response.error.stack).toBeDefined();
    });
  });

  describe('non-error object inputs', () => {
    it('should handle string errors', () => {
      const response = formatError('Something went wrong');
      expect(response.error.message).toBe('Something went wrong');
      expect(response.statusCode).toBe(500);
    });

    it('should handle plain object error-like payloads', () => {
      const errorObj = {
        message: 'Object failure',
        statusCode: 400,
        code: 'CUSTOM_OBJ_CODE',
        details: { subField: true },
      };
      const response = formatError(errorObj);

      expect(response.statusCode).toBe(400);
      expect(response.error.code).toBe('CUSTOM_OBJ_CODE');
      expect(response.error.message).toBe('Object failure');
      expect(response.error.details).toEqual({ subField: true });
    });

    it('should handle null, numbers, and booleans thrown', () => {
      const nullResponse = formatError(null);
      expect(nullResponse.error.message).toBe('null');

      const numResponse = formatError(404);
      expect(numResponse.error.message).toBe('404');

      const boolResponse = formatError(false);
      expect(boolResponse.error.message).toBe('false');
    });

    it('should extract issues array from Zod-like errors', () => {
      const zodLikeError = {
        name: 'ZodError',
        issues: [{ path: ['username'], message: 'Required' }],
      };
      const response = formatError(zodLikeError, { statusCode: 422 });
      expect(response.error.details).toEqual([{ path: ['username'], message: 'Required' }]);
    });

    it('should extract errors array from Joi-like errors', () => {
      const joiLikeError = {
        name: 'ValidationError',
        errors: [{ message: '"age" must be a number' }],
      };
      const response = formatError(joiLikeError, { statusCode: 400 });
      expect(response.error.details).toEqual([{ message: '"age" must be a number' }]);
    });
  });

  it('should throw RangeError for invalid status codes', () => {
    expect(() => formatError(new Error(), { statusCode: 80 })).toThrow(RangeError);
  });

  it('should fallback to INTERNAL_SERVER_ERROR for unmapped 5xx status codes', () => {
    const response = formatError(new Error('Unmapped 599 failure'), { statusCode: 599 });
    expect(response.statusCode).toBe(599);
    expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
