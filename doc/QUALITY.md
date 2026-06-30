# Quality Audit

## Current Status

Last local audit: 2026-06-30.

| Area | Status |
| --- | --- |
| Backend tests | 19 files, 63 tests passing |
| Frontend tests | 11 files, 35 tests passing |
| Backend lint | Passing |
| Frontend lint | Passing with 2 non-blocking warnings |
| Backend build | Passing |
| Frontend build | Passing |
| Backend audit | 0 vulnerabilities |
| Frontend audit | 0 vulnerabilities |

## Coverage Snapshot

| Package | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Backend | 86.02% | 71.07% | 95.79% | 91.05% |
| Frontend | 93.10% | 76.67% | 95.14% | 94.67% |

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

- Backend line and branch coverage can be improved around error paths and repository edge cases.
- Backend time adapters still have low direct unit coverage.
- Auth use cases are covered for critical paths, but more profile and tenant edge cases can be added.
- Frontend coverage is still low in theme provider, shared UI components and complex page flows.
- Product-level frontend flows are not covered end-to-end yet.

## Recommended Next Tests

- Protected route: missing token, expired token and role-based redirects.
- Theme provider: stored preference, system preference and tenant branding persistence.
- Shared UI components: status badges, action tiles, theme toggle and empty states.
- Training session page: exercise search, series copy/edit/delete and completion confirmation.
- Backend route handlers: auth, clients, trainers and exercises controller-level error paths.
