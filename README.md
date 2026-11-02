# express-response-toolkit

[![npm version](https://img.shields.io/npm/v/express-response-toolkit.svg?style=flat-square)](https://www.npmjs.com/package/express-response-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Coverage: 100%](https://img.shields.io/badge/coverage-100%25-brightgreen.svg?style=flat-square)](https://github.com)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg?style=flat-square)](https://www.npmjs.com/package/express-response-toolkit)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict%20Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)

> A lightweight, production-grade, developer-friendly response standardization toolkit for Express.js applications.

---

## Table of Contents

- [Why express-response-toolkit?](#why-express-response-toolkit)
- [Key Features](#key-features)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [ESM (TypeScript / Modern Node)](#esm-typescript--modern-node)
  - [CommonJS](#commonjs)
- [JSON Response Contracts](#json-response-contracts)
  - [Success Envelope](#1-success-envelope)
  - [Error Envelope](#2-error-error-envelope)
  - [Paginated Envelope (Offset-Based)](#3-paginated-envelope-offset-based)
  - [Paginated Envelope (Cursor-Based)](#4-paginated-envelope-cursor-based)
- [API Reference](#api-reference)
  - [Response Dispatchers](#response-dispatchers)
  - [Pure Formatters](#pure-formatters-framework-agnostic)
  - [Operational Error Class (`ApiError`)](#operational-error-class-apierror)
- [Production Security & Safeguards](#production-security--safeguards)
- [Multi-Version Compatibility](#multi-version-compatibility)
- [Contributing](#contributing)
- [License](#license)

---

## Why express-response-toolkit?

In real-world Express applications, response formats easily become fragmented across routes and teams:

```typescript
// ❌ Ad-hoc, fragmented responses
res.json({ data: user });
res.json({ user, status: 'ok' });
res.status(500).json({ err: err.message, stack: err.stack }); // ⚠️ Security hazard! Leaks database details & stack traces
```

`express-response-toolkit` replaces inconsistent response handling with strict, standardized, production-tested response contracts:

```typescript
// ✅ Uniform, predictable, secure, and fully typed
import { success, failure, paginated, ApiError } from 'express-response-toolkit';

success(res, user);
failure(res, ApiError.notFound('User does not exist'));
paginated(res, items, { page: 1, limit: 20, totalItems: 140 });
```

---

## Key Features

- **Zero Runtime Dependencies**: Exactly 0 dependencies in production. No bloat, no supply chain risks.
- **Strict, Predictable Envelopes**: Uniform JSON structure for success, error, and paginated responses.
- **Automated Production Masking**: 500-level errors automatically mask sensitive messages to `"Internal Server Error"` and suppress stack traces in production (`NODE_ENV === 'production'`) unless flagged as operational.
- **Full Generic Type Inference**: Preserves generic types end-to-end (`formatSuccess<UserDto>(user)` returns typed `SuccessEnvelope<UserDto>`).
- **Flexible Pagination Support**: Native calculation and schema generation for both **offset-based** (`page`, `limit`, `totalItems`) and **cursor-based** (`nextCursor`, `prevCursor`) pagination.
- **Express 4 & Express 5 Compatible**: Works seamlessly across both Express 4.x and the newest Express 5.x releases.
- **Dual ESM & CommonJS Bundling**: First-class support for modern ESM (`import`) and legacy CommonJS (`require`), including `.d.ts` and `.d.cts` typings.
- **HTTP 204 Handling**: Status 204 No Content automatically terminates via `res.status(204).end()` without transmitting an invalid body.
- **Premature Flush Guard**: Built-in check for `res.headersSent` to avoid `ERR_HTTP_HEADERS_SENT` exceptions.
- **Pure Core Formatters**: Headless formatters (`formatSuccess`, `formatError`, `formatPaginated`) can be used in serverless lambdas, microservices, or unit tests without an Express instance.

---

## Installation

```bash
# npm
npm install express-response-toolkit

# pnpm
pnpm add express-response-toolkit

# yarn
yarn add express-response-toolkit
```

---

## Quick Start

### ESM (TypeScript / Modern Node)

```typescript
import express, { Request, Response } from 'express';
import { success, failure, paginated, ApiError } from 'express-response-toolkit';

const app = express();
app.use(express.json());

// 1. Standard Success Response
app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = { id: req.params.id, name: 'Jane Doe', email: 'jane@example.com' };
  success(res, user, { meta: { requestId: req.headers['x-request-id'] } });
});

// 2. Paginated Response
app.get('/api/users', (req: Request, res: Response) => {
  const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  paginated(res, users, { page: 1, limit: 10, totalItems: 45 });
});

// 3. Structured Error Response
app.post('/api/users', (req: Request, res: Response) => {
  if (!req.body.email) {
    throw ApiError.badRequest('Email is required', { field: 'email' });
  }
  success(res, req.body, { statusCode: 201 });
});

// 4. Centralized Error Handler
app.use((err: unknown, _req: Request, res: Response, _next: Function) => {
  failure(res, err);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

### CommonJS

```javascript
const express = require('express');
const { success, failure, paginated, ApiError } = require('express-response-toolkit');

const app = express();

app.get('/api/health', (req, res) => {
  success(res, { status: 'healthy', uptime: process.uptime() });
});
```

---

## JSON Response Contracts

### 1. Success Envelope

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": 1,
    "name": "Jane Doe"
  },
  "meta": {
    "requestId": "req-99ab-103"
  }
}
```

### 2. Error Envelope

```json
{
  "success": false,
  "statusCode": 422,
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Validation failed",
    "details": [
      { "field": "email", "reason": "Invalid email address format" }
    ]
  },
  "meta": {
    "requestId": "req-99ab-103"
  }
}
```

> **Note on 500 Server Errors in Production:**
> When an unexpected internal server failure occurs in production (`NODE_ENV === 'production'`), internal database errors, unhandled exceptions, and stack traces are suppressed:
> ```json
> {
>   "success": false,
>   "statusCode": 500,
>   "error": {
>     "code": "INTERNAL_SERVER_ERROR",
>     "message": "Internal Server Error"
>   }
> }
> ```

### 3. Paginated Envelope (Offset-Based)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ],
  "pagination": {
    "type": "offset",
    "page": 2,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

### 4. Paginated Envelope (Cursor-Based)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    { "id": "rec_01", "name": "Event A" }
  ],
  "pagination": {
    "type": "cursor",
    "limit": 10,
    "nextCursor": "cursor_eyJpZCI6MX0=",
    "prevCursor": null,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## API Reference

### Response Dispatchers

The package exports primary dispatchers and ergonomic short-form aliases:

| Primary Function | Short Alias | Description |
| :--- | :--- | :--- |
| `sendSuccess(res, data, options?)` | `success` | Formats and sends a success JSON envelope with `res.status().json()`. |
| `sendError(res, error, options?)` | `failure` | Formats and sends an error JSON envelope with `res.status().json()`. |
| `sendPaginated(res, items, pagination, options?)` | `paginated` | Formats and sends a paginated JSON envelope. |

#### Dispatcher Options

- `SendSuccessOptions`:
  - `statusCode?: number` (Default: `200`)
  - `message?: string` (Default: standard HTTP reason phrase)
  - `meta?: Record<string, unknown>` (Optional custom metadata)
- `SendErrorOptions`:
  - `statusCode?: number` (Default: `500` or error's status)
  - `code?: string` (Default: derived HTTP code, e.g. `'NOT_FOUND'`)
  - `message?: string` (Custom error message)
  - `details?: unknown` (Structured error issues, e.g. Zod or Joi details)
  - `isOperational?: boolean` (If `true`, preserves message in production)
  - `includeStack?: boolean` (Explicitly toggle stack trace inclusion)
  - `meta?: Record<string, unknown>` (Optional metadata)

---

### Pure Formatters (Framework-Agnostic)

Use pure formatters when you need standardized envelopes without an Express `Response` instance (e.g., AWS Lambda, Fastify, microservices, or testing):

```typescript
import { formatSuccess, formatError, formatPaginated } from 'express-response-toolkit';

// Generates plain JavaScript object: SuccessEnvelope<T>
const payload = formatSuccess({ id: 1 }, { statusCode: 201 });

// Generates plain JavaScript object: ErrorEnvelope
const errPayload = formatError(new Error('Something failed'));

// Generates plain JavaScript object: PaginatedEnvelope<T>
const pagePayload = formatPaginated([1, 2, 3], { page: 1, limit: 10, totalItems: 3 });
```

---

### Operational Error Class (`ApiError`)

`ApiError` extends native `Error` to represent expected, operational HTTP failures with ergonomic static factory methods:

```typescript
import { ApiError } from 'express-response-toolkit';

// 400 Bad Request
throw ApiError.badRequest('Invalid request body', { field: 'name' });

// 401 Unauthorized
throw ApiError.unauthorized('Session has expired');

// 403 Forbidden
throw ApiError.forbidden('You lack permissions to view this tenant');

// 404 Not Found
throw ApiError.notFound('Resource does not exist');

// 409 Conflict
throw ApiError.conflict('Email address is already in use');

// 422 Unprocessable Entity
throw ApiError.unprocessableEntity('Validation failed', [{ field: 'age', error: 'Too young' }]);

// 429 Too Many Requests
throw ApiError.tooManyRequests('Rate limit exceeded. Try again in 60s');

// 500 Internal Server Error (Non-operational)
throw ApiError.internal('Database query failed');
```

---

## Production Security & Safeguards

1. **Information Leakage Prevention**:
   Unhandled 500-level system exceptions (e.g., database syntax errors or filesystem failures) are automatically masked to `"Internal Server Error"` when `NODE_ENV === 'production'`.
2. **Stack Trace Stripping**:
   Stack traces are automatically omitted from error envelopes in production unless `includeStack: true` is explicitly passed.
3. **Prototype Pollution Protection**:
   All user-provided `meta` and `details` objects are deep-cloned with strict exclusion of `__proto__`, `constructor`, and `prototype` keys.
4. **Circular Reference Shielding**:
   If user-supplied data payloads or error details contain circular object references, they are safely replaced with `"[Circular]"` rather than throwing unhandled `TypeError: Converting circular structure to JSON` crashes.
5. **Double Send Guard**:
   Dispatchers inspect `res.headersSent`. If a route partially streamed bytes or wrote headers before dispatching, the call returns `res` immediately rather than throwing `ERR_HTTP_HEADERS_SENT`.
6. **HTTP 204 No Content Handling**:
   When status `204` is dispatched, the toolkit invokes `res.status(204).end()` without transmitting a response body, complying strictly with RFC 9110 HTTP semantics.

---

## Multi-Version Compatibility

`express-response-toolkit` has been tested and certified for:
- **Node.js**: `>= 18.0.0`
- **Express**: Compatibility across `^4.18.0` and `^5.0.0`
- **TypeScript**: Strictly typed under TypeScript `^5.0.0`

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on development setup, running tests, and opening pull requests.

---

## License

This project is licensed under the [MIT License](LICENSE).

