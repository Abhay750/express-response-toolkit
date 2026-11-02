import { describe, expect, it, vi } from 'vitest';
import { HttpStatus } from '../../src/constants/http-status.js';
import { sendError, sendPaginated, sendSuccess } from '../../src/express/send.js';
import type { ResponseLike } from '../../src/types/response.js';

describe('send dispatchers unit tests', () => {
  const createMockRes = (headersSent = false): ResponseLike & { _ended: boolean; _sentStatus: number; _sentBody: unknown } => {
    const res = {
      headersSent,
      _ended: false,
      _sentStatus: 0,
      _sentBody: null as unknown,
      status(code: number) {
        this._sentStatus = code;
        return this;
      },
      json(body: unknown) {
        this._sentBody = body;
        return this;
      },
      end() {
        this._ended = true;
        return this;
      },
    };
    return res;
  };

  describe('sendSuccess', () => {
    it('should throw TypeError if response is not response-like', () => {
      expect(() => sendSuccess({} as unknown as ResponseLike)).toThrow(TypeError);
    });

    it('should return res immediately if headersSent is true', () => {
      const res = createMockRes(true);
      const result = sendSuccess(res, { foo: 'bar' });
      expect(result).toBe(res);
      expect(res._sentStatus).toBe(0);
    });

    it('should handle status 204 by calling .end() without json body', () => {
      const res = createMockRes();
      sendSuccess(res, undefined, { statusCode: HttpStatus.NO_CONTENT });
      expect(res._sentStatus).toBe(204);
      expect(res._ended).toBe(true);
      expect(res._sentBody).toBeNull();
    });

    it('should format and send success payload', () => {
      const res = createMockRes();
      sendSuccess(res, { id: 10 });
      expect(res._sentStatus).toBe(200);
      expect(res._sentBody).toEqual({
        success: true,
        statusCode: 200,
        message: 'OK',
        data: { id: 10 },
      });
    });
  });

  describe('sendError', () => {
    it('should throw TypeError if response is not response-like', () => {
      expect(() => sendError({} as unknown as ResponseLike, new Error())).toThrow(TypeError);
    });

    it('should return res immediately if headersSent is true', () => {
      const res = createMockRes(true);
      const result = sendError(res, new Error('Boom'));
      expect(result).toBe(res);
      expect(res._sentStatus).toBe(0);
    });

    it('should handle status 204 if specified in error options', () => {
      const res = createMockRes();
      sendError(res, new Error('No content error'), { statusCode: HttpStatus.NO_CONTENT });
      expect(res._sentStatus).toBe(204);
      expect(res._ended).toBe(true);
      expect(res._sentBody).toBeNull();
    });

    it('should format and send error payload', () => {
      const res = createMockRes();
      sendError(res, new Error('Boom'), { statusCode: 500, includeStack: false });
      expect(res._sentStatus).toBe(500);
      expect((res._sentBody as Record<string, unknown>)['success']).toBe(false);
    });
  });

  describe('sendPaginated', () => {
    it('should throw TypeError if response is not response-like', () => {
      expect(() => sendPaginated({} as unknown as ResponseLike, [], { page: 1, limit: 10, totalItems: 0 })).toThrow(TypeError);
    });

    it('should return res immediately if headersSent is true', () => {
      const res = createMockRes(true);
      const result = sendPaginated(res, [], { page: 1, limit: 10, totalItems: 0 });
      expect(result).toBe(res);
      expect(res._sentStatus).toBe(0);
    });

    it('should handle status 204 if specified in options', () => {
      const res = createMockRes();
      sendPaginated(res, [], { page: 1, limit: 10, totalItems: 0 }, { statusCode: HttpStatus.NO_CONTENT });
      expect(res._sentStatus).toBe(204);
      expect(res._ended).toBe(true);
      expect(res._sentBody).toBeNull();
    });

    it('should format and send paginated payload', () => {
      const res = createMockRes();
      sendPaginated(res, [{ id: 1 }], { page: 1, limit: 10, totalItems: 1 });
      expect(res._sentStatus).toBe(200);
      expect((res._sentBody as Record<string, unknown>)['success']).toBe(true);
      expect((res._sentBody as Record<string, unknown>)['data']).toEqual([{ id: 1 }]);
    });
  });
});

