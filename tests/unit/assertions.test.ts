import { describe, expect, it } from 'vitest';
import {
  assertNonNegativeInteger,
  assertPositiveInteger,
  assertResponseLike,
  assertValidStatusCode,
  isInteger,
  isObject,
  isResponseLike,
  isValidStatusCode,
} from '../../src/utils/assertions.js';

describe('assertions & guards', () => {
  describe('isObject', () => {
    it('should return true for plain objects and dictionary objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject(Object.create(null))).toBe(true);
    });

    it('should return false for null, arrays, and primitives', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(42)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject(true)).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should return true only for safe integers', () => {
      expect(isInteger(0)).toBe(true);
      expect(isInteger(100)).toBe(true);
      expect(isInteger(-5)).toBe(true);
    });

    it('should return false for non-integers, floats, NaNs, and strings', () => {
      expect(isInteger(3.14)).toBe(false);
      expect(isInteger(NaN)).toBe(false);
      expect(isInteger(Infinity)).toBe(false);
      expect(isInteger('100')).toBe(false);
      expect(isInteger(null)).toBe(false);
    });
  });

  describe('isValidStatusCode & assertValidStatusCode', () => {
    it('should accept valid HTTP status codes in range 100-599', () => {
      expect(isValidStatusCode(100)).toBe(true);
      expect(isValidStatusCode(200)).toBe(true);
      expect(isValidStatusCode(404)).toBe(true);
      expect(isValidStatusCode(599)).toBe(true);
      expect(() => assertValidStatusCode(200)).not.toThrow();
    });

    it('should reject status codes outside 100-599 or non-integers', () => {
      expect(isValidStatusCode(99)).toBe(false);
      expect(isValidStatusCode(600)).toBe(false);
      expect(isValidStatusCode(200.5)).toBe(false);
      expect(isValidStatusCode('200')).toBe(false);
      expect(() => assertValidStatusCode(99)).toThrow(RangeError);
      expect(() => assertValidStatusCode(600, 'CustomContext')).toThrow(
        /CustomContext must be an integer between 100 and 599/
      );
    });
  });

  describe('isResponseLike & assertResponseLike', () => {
    it('should return true when status and json methods exist', () => {
      const mockRes = {
        status: () => mockRes,
        json: () => mockRes,
      };
      expect(isResponseLike(mockRes)).toBe(true);
      expect(() => assertResponseLike(mockRes)).not.toThrow();
    });

    it('should return false when status or json methods are missing or invalid', () => {
      expect(isResponseLike(null)).toBe(false);
      expect(isResponseLike({})).toBe(false);
      expect(isResponseLike({ status: 200, json: () => {} })).toBe(false);
      expect(isResponseLike({ status: () => {}, json: 'not-a-function' })).toBe(false);
      expect(() => assertResponseLike({})).toThrow(TypeError);
    });
  });

  describe('assertPositiveInteger', () => {
    it('should pass for positive integers >= 1', () => {
      expect(() => assertPositiveInteger(1, 'page')).not.toThrow();
      expect(() => assertPositiveInteger(100, 'page')).not.toThrow();
    });

    it('should throw RangeError for 0, negative integers, floats, or non-numbers', () => {
      expect(() => assertPositiveInteger(0, 'page')).toThrow(RangeError);
      expect(() => assertPositiveInteger(-1, 'page')).toThrow(RangeError);
      expect(() => assertPositiveInteger(1.5, 'page')).toThrow(RangeError);
      expect(() => assertPositiveInteger('1', 'page')).toThrow(RangeError);
    });
  });

  describe('assertNonNegativeInteger', () => {
    it('should pass for integers >= 0', () => {
      expect(() => assertNonNegativeInteger(0, 'totalItems')).not.toThrow();
      expect(() => assertNonNegativeInteger(100, 'totalItems')).not.toThrow();
    });

    it('should throw RangeError for negative numbers, floats, or non-numbers', () => {
      expect(() => assertNonNegativeInteger(-1, 'totalItems')).toThrow(RangeError);
      expect(() => assertNonNegativeInteger(0.5, 'totalItems')).toThrow(RangeError);
      expect(() => assertNonNegativeInteger('0', 'totalItems')).toThrow(RangeError);
    });
  });
});

