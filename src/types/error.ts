export interface ApiErrorOptions {
  statusCode?: number;
  message?: string;
  code?: string;
  details?: unknown;
  isOperational?: boolean;
  cause?: unknown;
  meta?: Record<string, unknown>;
}

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
  [key: string]: unknown;
}

