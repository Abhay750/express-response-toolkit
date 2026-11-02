// Primary formatters
export { formatSuccess } from './core/format-success.js';
export { formatError } from './core/format-error.js';
export { formatPaginated } from './core/format-paginated.js';

// Express dispatchers
export { sendSuccess, sendError, sendPaginated } from './express/send.js';

// Aliases
export { sendSuccess as success } from './express/send.js';
export { sendError as failure } from './express/send.js';
export { sendPaginated as paginated } from './express/send.js';

// Operational Error
export { ApiError } from './errors/api-error.js';

// Constants
export {
  HttpStatus,
  HttpReasonPhrase,
  HttpErrorCode,
  type HttpStatusCode,
} from './constants/http-status.js';

// Types
export * from './types/index.js';

// Pagination Helpers
export {
  calculateOffsetPagination,
  calculateCursorPagination,
} from './utils/pagination-math.js';

// Validation Guards
export {
  isResponseLike,
  isValidStatusCode,
} from './utils/assertions.js';

