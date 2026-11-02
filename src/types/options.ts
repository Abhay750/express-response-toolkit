export interface FormatSuccessOptions {
  statusCode?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface FormatErrorOptions {
  statusCode?: number;
  code?: string;
  message?: string;
  details?: unknown;
  meta?: Record<string, unknown>;
  isOperational?: boolean;
  includeStack?: boolean;
}

export interface FormatPaginatedOptions {
  statusCode?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export type SendSuccessOptions = FormatSuccessOptions;
export type SendErrorOptions = FormatErrorOptions;
export type SendPaginatedOptions = FormatPaginatedOptions;

