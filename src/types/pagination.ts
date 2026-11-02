export interface OffsetPaginationInput {
  type?: 'offset';
  page: number;
  limit: number;
  totalItems: number;
}

export interface CursorPaginationInput {
  type: 'cursor';
  limit: number;
  nextCursor?: string | null;
  prevCursor?: string | null;
  hasNextPage?: boolean;
}

export type PaginationInput = OffsetPaginationInput | CursorPaginationInput;

export interface OffsetPaginationMeta {
  type: 'offset';
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CursorPaginationMeta {
  type: 'cursor';
  limit: number;
  nextCursor: string | null;
  prevCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type PaginationMeta = OffsetPaginationMeta | CursorPaginationMeta;

