# Quality Audit

## Current Status

Last local audit: 2026-06-29.

| Area | Status |
| --- | --- |
| Backend tests | 18 files, 58 tests passing |
| Frontend tests | 11 files, 34 tests passing |
| Backend lint | Passing |
| Frontend lint | Passing with 2 non-blocking warnings |
| Backend build | Passing |
| Frontend build | Passing |
| Backend audit | 0 vulnerabilities |
| Frontend audit | 0 vulnerabilities |

## Coverage Snapshot

| Package | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Backend | 88.14% | 75.38% | 97.12% | 91.31% |
| Frontend | 93.64% | 75.95% | 95.09% | 95.38% |

## Commands

```bash
npm --prefix backend run quality
npm --prefix frontend run quality
```

`quality` runs ESLint, coverage, build and `npm audit --audit-level=moderate`.

Individual commands:

```bash
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:coverage
npm --prefix backend run build
npm --prefix backend audit --audit-level=moderate

npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run test:coverage
npm --prefix frontend run build
npm --prefix frontend audit --audit-level=moderate
```

Backend coverage needs a local MariaDB/MySQL database configured through `backend/.env`.

The coverage scripts enforce a minimum global function coverage of 95% for both backend and frontend.
ESLint with SonarJS is enforced in CI. Errors block the gate; warnings are allowed initially to avoid blocking on low-risk style improvements.

## Main Gaps

- Backend route handlers have lower coverage than application use cases.
- Backend time adapters still have low direct unit coverage.
- Auth use cases are covered for critical paths, but more profile and tenant edge cases can be added.
- Frontend coverage is still low in theme provider, shared UI components and performance form branches.
- Product-level frontend flows are not covered end-to-end yet.

## Recommended Next Tests

- Protected route: missing token, expired token and role-based redirects.
- Theme provider: stored preference, system preference and tenant branding persistence.
- Shared UI components: status badges, action tiles, theme toggle and empty states.
- Performance form: dynamic fields, validation errors and variant payloads.
- Backend route handlers: auth, clients, trainers and exercises controller-level error paths.
