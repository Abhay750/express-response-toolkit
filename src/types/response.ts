import type { PaginationMeta } from './pagination.js';

export interface ResponseLike {
  status(code: number): this;
  json(body: unknown): this;
  end(): this | void;
  headersSent?: boolean;
}

export interface SuccessEnvelope<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

export interface ErrorEnvelope {
  success: false;
  statusCode: number;
  error: ErrorPayload;
  meta?: Record<string, unknown>;
}

export interface PaginatedEnvelope<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T[];
  pagination: PaginationMeta;
  meta?: Record<string, unknown>;
}

