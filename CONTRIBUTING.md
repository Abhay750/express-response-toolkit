# Contributing to Express API Response Toolkit

Thank you for your interest in contributing to `express-response-toolkit`! We welcome community contributions, bug reports, feature suggestions, and documentation improvements.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and considerate in all communications and reviews.

---

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 18.0.0`
- [npm](https://docs.npmjs.com/) `>= 9.0.0`

### Initializing the Repository
```bash
# 1. Clone the repository
git clone https://github.com/your-org/express-response-toolkit.git
cd express-response-toolkit

# 2. Install dependencies
npm install

# 3. Build the project
npm run build
```

---

## Scripts & Workflow Commands

| Command | Purpose |
| :--- | :--- |
| `npm run build` | Compiles ESM & CommonJS distributions with `.d.ts` and `.d.cts` via `tsup`. |
| `npm run typecheck` | Validates TypeScript compilation for source files. |
| `npm run test` | Runs the full Vitest test suite. |
| `npm run test:coverage` | Runs tests and generates v8 coverage reports (100% threshold enforced). |
| `npm run test:types` | Runs type inference assertions against `tests/types/`. |

---

## Architectural Principles

When writing or modifying code in this package, adhere strictly to these engineering standards:

1. **Zero Runtime Dependencies**: The core package must have **zero** runtime dependencies (`"dependencies": {}`). All utilities (assertions, math, sanitization) must remain internal.
2. **Immutability**: Never mutate user-provided arguments, options, or data payloads.
3. **Pure Core**: The formatters in `src/core/` must remain pure functions independent of Express or Node HTTP primitives.
4. **Production Security**:
   - Never leak internal 500 error messages, stack traces, or raw database queries to clients in production (`NODE_ENV === 'production'`) unless explicitly flagged as `isOperational`.
   - Protect all object merging against prototype pollution (`__proto__`, `constructor`, `prototype`).
   - Protect serialization from circular reference crashes.
5. **100% Test Coverage**: Every line, branch, statement, and function must be accompanied by comprehensive unit or integration tests.

---

## Submitting Pull Requests

1. **Create a Topic Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Write Clean, Typed Code**:
   - Ensure all code is strictly typed with TypeScript.
   - Avoid `any` types; prefer generics or `unknown` with runtime type assertions.
3. **Add Tests**:
   - Add unit tests under `tests/unit/` or integration tests under `tests/integration/`.
   - Verify that `npm run test:coverage` achieves 100% across all metrics.
4. **Run Pre-Commit Verifications**:
   ```bash
   npm run typecheck
   npm run test:types
   npm run test:coverage
   npm run build
   ```
5. **Open a Pull Request**:
   - Provide a clear, descriptive title and description explaining the problem, the solution, and any design trade-offs.

