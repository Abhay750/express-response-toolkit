import { HttpErrorCode, HttpReasonPhrase, HttpStatus } from '../constants/http-status.js';
import type { ApiErrorOptions } from '../types/error.js';
import { assertValidStatusCode } from '../utils/assertions.js';
import { safeClone } from '../utils/sanitize.js';

/**
 * Standard operational error class for representing HTTP API failures.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown | null;
  public readonly isOperational: boolean;
  public readonly meta: Record<string, unknown> | null;

  constructor(options: ApiErrorOptions = {}) {
    const statusCode = options.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
    assertValidStatusCode(statusCode, 'ApiError status code');

    const defaultMessage = HttpReasonPhrase[statusCode] ?? 'An unexpected error occurred';
    const message = options.message || defaultMessage;

    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code ?? HttpErrorCode[statusCode] ?? 'INTERNAL_SERVER_ERROR';
    this.details = options.details !== undefined ? safeClone(options.details) : null;
    this.isOperational = options.isOperational ?? true;
    this.meta = options.meta ? safeClone(options.meta) : null;

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * 400 Bad Request
   */
  static badRequest(message?: string, details?: unknown, code = 'BAD_REQUEST'): ApiError {
    return new ApiError({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      details,
      code,
      isOperational: true,
    });
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(message?: string, code = 'UNAUTHORIZED'): ApiError {
    return new ApiError({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      code,
      isOperational: true,
    });
  }

  /**
   * 403 Forbidden
   */
  static forbidden(message?: string, code = 'FORBIDDEN'): ApiError {
    return new ApiError({
      statusCode: HttpStatus.FORBIDDEN,
      message,
      code,
      isOperational: true,
    });
  }

  /**
   * 404 Not Found
   */
  static notFound(message?: string, code = 'NOT_FOUND'): ApiError {
    return new ApiError({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      code,
      isOperational: true,
    });
  }

  /**
   * 409 Conflict
   */
  static conflict(message?: string, details?: unknown, code = 'CONFLICT'): ApiError {
    return new ApiError({
      statusCode: HttpStatus.CONFLICT,
      message,
      details,
      code,
      isOperational: true,
    });
  }

  /**
   * 422 Unprocessable Entity
   */
  static unprocessableEntity(message?: string, details?: unknown, code = 'UNPROCESSABLE_ENTITY'): ApiError {
    return new ApiError({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message,
      details,
      code,
      isOperational: true,
    });
  }

  /**
   * 429 Too Many Requests
   */
  static tooManyRequests(message?: string, code = 'TOO_MANY_REQUESTS'): ApiError {
    return new ApiError({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message,
      code,
      isOperational: true,
    });
  }

  /**
   * 500 Internal Server Error
   */
  static internal(message?: string, code = 'INTERNAL_SERVER_ERROR'): ApiError {
    return new ApiError({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      code,
      isOperational: false,
    });
  }
}

