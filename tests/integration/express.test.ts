import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  ApiError,
  failure,
  HttpStatus,
  paginated,
  sendError,
  sendPaginated,
  sendSuccess,
  success,
} from '../../src/index.js';

describe('Express Integration Tests', () => {
  const createTestApp = () => {
    const app = express();
    app.use(express.json());

    // 1. sendSuccess test route
    app.get('/api/users/:id', (req: Request, res: Response) => {
      sendSuccess(
        res,
        { id: req.params.id, name: 'John Doe' },
        { statusCode: HttpStatus.OK, meta: { requestId: 'req-1' } }
      );
    });

    // 2. Alias `success` test route
    app.post('/api/users', (req: Request, res: Response) => {
      success(
        res,
        { id: 'new-id', ...req.body },
        { statusCode: HttpStatus.CREATED, message: 'User created' }
      );
    });

    // 3. HTTP 204 No Content test route
    app.delete('/api/users/:id', (_req: Request, res: Response) => {
      sendSuccess(res, undefined, { statusCode: HttpStatus.NO_CONTENT });
    });

    // 4. sendError test route
    app.get('/api/error-test', (_req: Request, res: Response) => {
      const err = ApiError.notFound('Resource does not exist');
      sendError(res, err);
    });

    // 5. Alias `failure` test route
    app.get('/api/failure-alias-test', (_req: Request, res: Response) => {
      failure(
        res,
        new Error('Unauthorized access'),
        { statusCode: HttpStatus.UNAUTHORIZED, code: 'AUTH_FAILED' }
      );
    });

    // 6. sendPaginated test route (offset)
    app.get('/api/paginated-offset', (req: Request, res: Response) => {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const items = [{ id: 1 }, { id: 2 }];

      sendPaginated(res, items, {
        page,
        limit,
        totalItems: 50,
      });
    });

    // 7. Alias `paginated` test route (cursor)
    app.get('/api/paginated-cursor', (req: Request, res: Response) => {
      const limit = Number(req.query.limit) || 5;
      const items = [{ id: 'item-10' }];

      paginated(res, items, {
        type: 'cursor',
        limit,
        nextCursor: 'cur-next',
        prevCursor: 'cur-prev',
      });
    });

    // 8. headersSent guard route: simulate early write/headers sent
    app.get('/api/headers-sent-test', (_req: Request, res: Response) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.write('partially written');
      // Calling sendSuccess when headers are already sent should return cleanly without throwing
      sendSuccess(res, { shouldNotSend: true });
      res.end();
    });

    // 9. Async route with simulated rejection
    app.get('/api/async-route', async (_req: Request, res: Response) => {
      try {
        await Promise.reject(ApiError.badRequest('Async validation rejected', { field: 'token' }));
      } catch (err) {
        sendError(res, err);
      }
    });

    return app;
  };

  const app = createTestApp();

  it('GET /api/users/:id - should return 200 with SuccessEnvelope and meta', async () => {
    const res = await request(app).get('/api/users/42');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      statusCode: 200,
      message: 'OK',
      data: { id: '42', name: 'John Doe' },
      meta: { requestId: 'req-1' },
    });
  });

  it('POST /api/users - should work using `success` alias with status 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      statusCode: 201,
      message: 'User created',
      data: { id: 'new-id', email: 'test@example.com' },
    });
  });

  it('DELETE /api/users/:id - should handle HTTP 204 No Content with res.status(204).end() and empty body', async () => {
    const res = await request(app).delete('/api/users/42');

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(res.body).toEqual({});
  });

  it('GET /api/error-test - should return 404 with ErrorEnvelope', async () => {
    const res = await request(app).get('/api/error-test');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('Resource does not exist');
  });

  it('GET /api/failure-alias-test - should work using `failure` alias with status 401', async () => {
    const res = await request(app).get('/api/failure-alias-test');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.statusCode).toBe(401);
    expect(res.body.error.code).toBe('AUTH_FAILED');
    expect(res.body.error.message).toBe('Unauthorized access');
  });

  it('GET /api/paginated-offset - should return paginated response with offset metadata', async () => {
    const res = await request(app).get('/api/paginated-offset?page=2&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(res.body.pagination).toEqual({
      type: 'offset',
      page: 2,
      limit: 10,
      totalItems: 50,
      totalPages: 5,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('GET /api/paginated-cursor - should work using `paginated` alias with cursor metadata', async () => {
    const res = await request(app).get('/api/paginated-cursor?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.pagination).toEqual({
      type: 'cursor',
      limit: 5,
      nextCursor: 'cur-next',
      prevCursor: 'cur-prev',
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('GET /api/headers-sent-test - should not throw if res.headersSent is true', async () => {
    const res = await request(app).get('/api/headers-sent-test');

    expect(res.status).toBe(200);
    expect(res.text).toBe('partially written');
  });

  it('GET /api/async-route - should handle async rejection cleanly', async () => {
    const res = await request(app).get('/api/async-route');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toBe('Async validation rejected');
    expect(res.body.error.details).toEqual({ field: 'token' });
  });
});

