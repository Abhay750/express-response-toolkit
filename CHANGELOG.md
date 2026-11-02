# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-02

### Added
- **Core Formatters**:
  - `formatSuccess`: Pure payload builder for standardized success envelopes.
  - `formatError`: Pure payload builder for standardized error envelopes with automated production masking.
  - `formatPaginated`: Pure payload builder supporting both offset and cursor pagination models.
- **Express Dispatchers & Aliases**:
  - `sendSuccess` and ergonomic alias `success`.
  - `sendError` and ergonomic alias `failure`.
  - `sendPaginated` and ergonomic alias `paginated`.
- **Operational Error Class**:
  - `ApiError`: Full-featured operational error class with static factory methods (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `unprocessableEntity`, `tooManyRequests`, `internal`).
- **Standardized Response Envelopes**:
  - `SuccessEnvelope<T>`: Strict typing for data payloads and optional metadata.
  - `ErrorEnvelope`: Structured error reporting with code, message, optional details, and sanitized stack traces.
  - `PaginatedEnvelope<T>`: Standardized offset (`page`, `limit`, `totalItems`, `totalPages`, `hasNextPage`, `hasPrevPage`) and cursor (`nextCursor`, `prevCursor`, `hasNextPage`, `hasPrevPage`) metadata.
- **Production Security & Sanitization**:
  - Automated 500-level error masking to `"Internal Server Error"` when `NODE_ENV === 'production'` unless marked as operational.
  - Stack trace suppression in production environments unless explicitly requested.
  - Prototype pollution guards against `__proto__`, `constructor`, and `prototype`.
  - Circular reference handling and recursive object serialization protection.
  - Premature flush guard (`res.headersSent`) preventing `ERR_HTTP_HEADERS_SENT` crashes.
  - HTTP 204 No Content handling via `res.status(204).end()`.
- **Dual Packaging & Types**:
  - ESM (`dist/index.js`) and CommonJS (`dist/index.cjs`) dual distribution.
  - Twin TypeScript definitions (`.d.ts` and `.d.cts`) with full generic type inference.
  - Native compatibility across Express 4 and Express 5.
  - Zero runtime dependencies (`0 dependencies`).

