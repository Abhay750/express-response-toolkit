import { isObject } from './assertions.js';

const PROTOTYPE_POLLUTION_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Returns true if the current environment is production.
 */
export function isProduction(): boolean {
  return typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';
}

/**
 * Deep clones a value while preventing prototype pollution and circular reference crashes.
 */
export function safeClone<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[Circular]' as unknown as T;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const arrayClone = value.map((item) => safeClone(item, seen));
    return arrayClone as unknown as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  if (value instanceof Error) {
    const errorClone: Record<string, unknown> = {
      name: value.name,
      message: value.message,
    };
    if (value.stack) {
      errorClone['stack'] = value.stack;
    }
    for (const key of Object.keys(value)) {
      if (!PROTOTYPE_POLLUTION_KEYS.has(key)) {
        errorClone[key] = safeClone((value as unknown as Record<string, unknown>)[key], seen);
      }
    }
    return errorClone as unknown as T;
  }

  const objClone: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    if (!PROTOTYPE_POLLUTION_KEYS.has(key)) {
      objClone[key] = safeClone((value as Record<string, unknown>)[key], seen);
    }
  }

  return objClone as unknown as T;
}

/**
 * Extracts error details from an arbitrary error representation (e.g. Zod, Joi, or standard ApiError).
 */
export function extractErrorDetails(error: unknown): unknown {
  if (!isObject(error)) {
    return undefined;
  }

  if ('details' in error && error['details'] !== undefined) {
    return safeClone(error['details']);
  }

  if ('issues' in error && Array.isArray(error['issues'])) {
    return safeClone(error['issues']);
  }

  if ('errors' in error && Array.isArray(error['errors'])) {
    return safeClone(error['errors']);
  }

  return undefined;
}

/**
 * Normalizes an unknown caught error into a safe string message and extracted stack.
 */
export function normalizeError(error: unknown): {
  message: string;
  stack?: string;
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  details?: unknown;
} {
  if (error instanceof Error) {
    const errorObj = error as unknown as Record<string, unknown>;
    const statusCode = typeof errorObj['statusCode'] === 'number' ? errorObj['statusCode'] : undefined;
    const code = typeof errorObj['code'] === 'string' ? errorObj['code'] : undefined;
    const isOperational =
      typeof errorObj['isOperational'] === 'boolean' ? errorObj['isOperational'] : undefined;
    const details = extractErrorDetails(error);

    return {
      message: error.message || 'An error occurred',
      stack: error.stack,
      statusCode,
      code,
      isOperational,
      details,
    };
  }

  if (isObject(error)) {
    const message =
      typeof error['message'] === 'string'
        ? error['message']
        : 'An error occurred';
    const stack = typeof error['stack'] === 'string' ? error['stack'] : undefined;
    const statusCode = typeof error['statusCode'] === 'number' ? error['statusCode'] : undefined;
    const code = typeof error['code'] === 'string' ? error['code'] : undefined;
    const isOperational =
      typeof error['isOperational'] === 'boolean' ? error['isOperational'] : undefined;
    const details = extractErrorDetails(error);

    return {
      message,
      stack,
      statusCode,
      code,
      isOperational,
      details,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  return {
    message: String(error),
  };
}

