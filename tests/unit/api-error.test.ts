import { describe, expect, it } from 'vitest';
import { HttpStatus } from '../../src/constants/http-status.js';
import { ApiError } from '../../src/errors/api-error.js';

describe('ApiError', () => {
  it('should create an ApiError with default 500 status code when no options given', () => {
    const error = new ApiError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.message).toBe('Internal Server Error');
    expect(error.details).toBeNull();
    expect(error.isOperational).toBe(true);
    expect(error.meta).toBeNull();
  });

  it('should support full options initialization', () => {
    const cause = new Error('Underlying network timeout');
    const meta = { service: 'payment-svc' };
    const details = { transactionId: 'tx-99' };

    const error = new ApiError({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Payment service currently unavailable',
      code: 'SERVICE_DOWN',
      details,
      isOperational: false,
      cause,
      meta,
    });

    expect(error.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(error.message).toBe('Payment service currently unavailable');
    expect(error.code).toBe('SERVICE_DOWN');
    expect(error.details).toEqual(details);
    expect(error.details).not.toBe(details); // Cloned
    expect(error.isOperational).toBe(false);
    expect(error.cause).toBe(cause);
    expect(error.meta).toEqual(meta);
  });

  describe('static factories', () => {
    it('badRequest factory', () => {
      const error = ApiError.badRequest('Invalid payload', { field: 'name' });
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid payload');
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.details).toEqual({ field: 'name' });
      expect(error.isOperational).toBe(true);
    });

    it('unauthorized factory', () => {
      const error = ApiError.unauthorized('Token expired');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Token expired');
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.isOperational).toBe(true);
    });

    it('forbidden factory', () => {
      const error = ApiError.forbidden('Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Insufficient permissions');
      expect(error.code).toBe('FORBIDDEN');
      expect(error.isOperational).toBe(true);
    });

    it('notFound factory', () => {
      const error = ApiError.notFound('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.isOperational).toBe(true);
    });

    it('conflict factory', () => {
      const error = ApiError.conflict('Email already exists', { email: 'test@example.com' });
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Email already exists');
      expect(error.code).toBe('CONFLICT');
      expect(error.details).toEqual({ email: 'test@example.com' });
      expect(error.isOperational).toBe(true);
    });

    it('unprocessableEntity factory', () => {
      const error = ApiError.unprocessableEntity('Validation failed', [{ path: 'age' }]);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('UNPROCESSABLE_ENTITY');
      expect(error.details).toEqual([{ path: 'age' }]);
      expect(error.isOperational).toBe(true);
    });

    it('tooManyRequests factory', () => {
      const error = ApiError.tooManyRequests('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('TOO_MANY_REQUESTS');
      expect(error.isOperational).toBe(true);
    });

    it('internal factory', () => {
      const error = ApiError.internal('Unexpected database fault');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Unexpected database fault');
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.isOperational).toBe(false);
    });
  });

  it('should throw RangeError for invalid status code', () => {
    expect(() => new ApiError({ statusCode: 999 })).toThrow(RangeError);
  });

  it('should fallback to default reason phrase and error code when status code is unmapped', () => {
    const error = new ApiError({ statusCode: 599 });
    expect(error.statusCode).toBe(599);
    expect(error.message).toBe('An unexpected error occurred');
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
