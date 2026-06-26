# Quality Audit

## Current Status

Last local audit: 2026-06-26.

| Area | Status |
| --- | --- |
| Backend tests | 15 files, 51 tests passing |
| Frontend tests | 7 files, 19 tests passing |
| Backend build | Passing |
| Frontend build | Passing |
| Backend audit | 0 vulnerabilities |
| Frontend audit | 0 vulnerabilities |

## Coverage Snapshot

| Package | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Backend | 75.61% | 69.56% | 80.43% | 78.11% |
| Frontend | 50.82% | 36.15% | 48.03% | 52.59% |

## Commands

```bash
npm --prefix backend test
npm --prefix backend run test:coverage
npm --prefix backend run build
npm --prefix backend audit --audit-level=moderate

npm --prefix frontend test
npm --prefix frontend run test:coverage
npm --prefix frontend run build
npm --prefix frontend audit --audit-level=moderate
```

Backend coverage needs a local MariaDB/MySQL database configured through `backend/.env`.

## Main Gaps

- Backend route handlers have lower coverage than application use cases.
- Backend storage/time adapters still have low direct unit coverage.
- Auth use cases are covered for critical paths, but more profile and tenant edge cases can be added.
- Frontend coverage is still low in theme provider, shared UI components and performance form branches.
- Product-level frontend flows are not covered end-to-end yet.

## Recommended Next Tests

- Protected route: missing token, expired token and role-based redirects.
- Theme provider: stored preference, system preference and tenant branding persistence.
- Shared UI components: status badges, action tiles, theme toggle and empty states.
- Performance form: dynamic fields, validation errors and variant payloads.
- Backend route handlers: auth, clients, trainers and exercises controller-level error paths.
- Backend storage adapter: photo persistence and delete behavior.
