import type { ResponseLike } from '../types/response.js';

/**
 * Checks if a value is a non-null object and not an array.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks if a value is an integer.
 */
export function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

/**
 * Checks if a value is a valid HTTP status code (integer between 100 and 599 inclusive).
 */
export function isValidStatusCode(code: unknown): code is number {
  return isInteger(code) && code >= 100 && code <= 599;
}

/**
 * Checks if a value duck-types an Express Response object.
 */
export function isResponseLike(value: unknown): value is ResponseLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['status'] === 'function' &&
    typeof candidate['json'] === 'function'
  );
}

/**
 * Asserts that a value is a valid HTTP status code, throwing a RangeError otherwise.
 */
export function assertValidStatusCode(code: unknown, context = 'Status code'): asserts code is number {
  if (!isValidStatusCode(code)) {
    throw new RangeError(`${context} must be an integer between 100 and 599. Received: ${String(code)}`);
  }
}

/**
 * Asserts that a value is an Express-compatible response object, throwing a TypeError otherwise.
 */
export function assertResponseLike(res: unknown, context = 'Response'): asserts res is ResponseLike {
  if (!isResponseLike(res)) {
    throw new TypeError(
      `${context} must be an Express-compatible response object providing .status() and .json() methods.`
    );
  }
}

/**
 * Asserts that a value is an integer >= 1.
 */
export function assertPositiveInteger(value: unknown, fieldName: string): asserts value is number {
  if (!isInteger(value) || value < 1) {
    throw new RangeError(`${fieldName} must be an integer greater than or equal to 1. Received: ${String(value)}`);
  }
}

/**
 * Asserts that a value is an integer >= 0.
 */
export function assertNonNegativeInteger(value: unknown, fieldName: string): asserts value is number {
  if (!isInteger(value) || value < 0) {
    throw new RangeError(`${fieldName} must be an integer greater than or equal to 0. Received: ${String(value)}`);
  }
}

