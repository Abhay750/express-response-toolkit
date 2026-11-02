import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { extractErrorDetails, isProduction, normalizeError, safeClone } from '../../src/utils/sanitize.js';

describe('sanitize utils', () => {
  const originalEnv = process.env['NODE_ENV'];

  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      process.env['NODE_ENV'] = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should return false when NODE_ENV is not production', () => {
      process.env['NODE_ENV'] = 'development';
      expect(isProduction()).toBe(false);
      process.env['NODE_ENV'] = 'test';
      expect(isProduction()).toBe(false);
    });
  });

  describe('safeClone & prototype pollution guards', () => {
    it('should ignore __proto__, constructor, and prototype keys', () => {
      const maliciousPayload = JSON.parse(
        '{"__proto__": {"polluted": true}, "constructor": {"polluted": true}, "prototype": {"polluted": true}, "valid": 123}'
      );

      const cleaned = safeClone(maliciousPayload) as Record<string, unknown>;

      expect(cleaned['valid']).toBe(123);
      expect(cleaned['__proto__']).not.toEqual({ polluted: true });
      expect((Object.prototype as unknown as Record<string, unknown>)['polluted']).toBeUndefined();
    });

    it('should handle circular references without throwing', () => {
      const circularObj: Record<string, unknown> = { name: 'root' };
      circularObj['self'] = circularObj;

      const cloned = safeClone(circularObj) as Record<string, unknown>;

      expect(cloned['name']).toBe('root');
      expect(cloned['self']).toBe('[Circular]');
      expect(() => JSON.stringify(cloned)).not.toThrow();
    });

    it('should clone Date and RegExp correctly', () => {
      const date = new Date('2026-01-01T00:00:00.000Z');
      const regex = /test-[0-9]+/i;

      const clonedDate = safeClone(date);
      const clonedRegex = safeClone(regex);

      expect(clonedDate).toEqual(date);
      expect(clonedDate).not.toBe(date);
      expect(clonedDate).toBeInstanceOf(Date);

      expect(clonedRegex).toEqual(regex);
      expect(clonedRegex).not.toBe(regex);
      expect(clonedRegex).toBeInstanceOf(RegExp);
    });

    it('should clone Error instances including custom properties', () => {
      const err = new Error('Custom boom');
      (err as unknown as Record<string, unknown>)['customCode'] = 1234;

      const cloned = safeClone(err) as Record<string, unknown>;
      expect(cloned['name']).toBe('Error');
      expect(cloned['message']).toBe('Custom boom');
      expect(cloned['customCode']).toBe(1234);
    });

    it('should pass primitives as is', () => {
      expect(safeClone(null)).toBeNull();
      expect(safeClone(undefined)).toBeUndefined();
      expect(safeClone('string')).toBe('string');
      expect(safeClone(42)).toBe(42);
      expect(safeClone(true)).toBe(true);
    });
  });

  describe('extractErrorDetails', () => {
    it('should return undefined if error is not an object', () => {
      expect(extractErrorDetails(null)).toBeUndefined();
      expect(extractErrorDetails(123)).toBeUndefined();
      expect(extractErrorDetails('error')).toBeUndefined();
    });

    it('should extract details property from object', () => {
      expect(extractErrorDetails({ details: { key: 'val' } })).toEqual({ key: 'val' });
    });
  });

  describe('normalizeError', () => {
    it('should normalize native Error instances', () => {
      const err = new Error('Basic error');
      const normalized = normalizeError(err);

      expect(normalized.message).toBe('Basic error');
      expect(normalized.stack).toBeDefined();
    });

    it('should normalize Error with empty message', () => {
      const err = new Error('');
      const normalized = normalizeError(err);
      expect(normalized.message).toBe('An error occurred');
    });

    it('should normalize non-error objects with stack and isOperational flags', () => {
      const normalized = normalizeError({
        message: 'Custom object msg',
        statusCode: 400,
        stack: 'mock stack trace',
        isOperational: true,
      });
      expect(normalized.message).toBe('Custom object msg');
      expect(normalized.statusCode).toBe(400);
      expect(normalized.stack).toBe('mock stack trace');
      expect(normalized.isOperational).toBe(true);
    });

    it('should normalize objects without message', () => {
      const normalized = normalizeError({ errCode: 50 });
      expect(normalized.message).toBe('An error occurred');
    });

    it('should normalize string error', () => {
      const normalized = normalizeError('Plain failure text');
      expect(normalized.message).toBe('Plain failure text');
    });

    it('should normalize primitives', () => {
      expect(normalizeError(123).message).toBe('123');
      expect(normalizeError(null).message).toBe('null');
    });
  });
});
