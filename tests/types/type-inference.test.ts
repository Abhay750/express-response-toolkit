import { describe, expectTypeOf, it } from 'vitest';
import {
  type ErrorEnvelope,
  failure,
  formatError,
  formatPaginated,
  formatSuccess,
  paginated,
  type PaginatedEnvelope,
  sendError,
  sendPaginated,
  sendSuccess,
  success,
  type SuccessEnvelope,
} from '../../src/index.js';

describe('Type Verification & Soundness', () => {
  it('should preserve generic types in formatSuccess', () => {
    interface User {
      id: number;
      name: string;
    }

    const user: User = { id: 1, name: 'Alice' };
    const envelope = formatSuccess(user);

    expectTypeOf(envelope).toEqualTypeOf<SuccessEnvelope<User>>();
    expectTypeOf(envelope.data).toEqualTypeOf<User>();
  });

  it('should return typed ErrorEnvelope in formatError', () => {
    const errorEnvelope = formatError(new Error('Sample'));
    expectTypeOf(errorEnvelope).toEqualTypeOf<ErrorEnvelope>();
  });

  it('should preserve item generic types in formatPaginated', () => {
    interface Product {
      sku: string;
      price: number;
    }

    const items: Product[] = [{ sku: 'PROD-1', price: 99 }];
    const paginatedEnvelope = formatPaginated(items, {
      page: 1,
      limit: 10,
      totalItems: 1,
    });

    expectTypeOf(paginatedEnvelope).toEqualTypeOf<PaginatedEnvelope<Product>>();
    expectTypeOf(paginatedEnvelope.data).toEqualTypeOf<Product[]>();
  });

  it('should verify aliases match exact dispatcher signatures', () => {
    expectTypeOf(success).toEqualTypeOf<typeof sendSuccess>();
    expectTypeOf(failure).toEqualTypeOf<typeof sendError>();
    expectTypeOf(paginated).toEqualTypeOf<typeof sendPaginated>();
  });
});

