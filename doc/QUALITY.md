# Quality Audit

## Current Status

Last local audit: 2026-07-03.

| Area | Status |
| --- | --- |
| Backend tests | 19 files, 67 tests passing |
| Frontend tests | 20 files, 66 tests passing |
| Backend lint | Passing |
| Frontend lint | Passing |
| Backend build | Passing |
| Frontend build | Passing |
| Backend audit | 0 vulnerabilities |
| Frontend audit | 0 vulnerabilities |

## Coverage Snapshot

| Package | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Backend | 86.34% | 71.61% | 95.86% | 91.21% |
| Frontend | 94.59% | 82.44% | 95.93% | 96.49% |

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

- Backend branch coverage can be improved around authentication errors, repository edge cases and session rules.
- Some low-frequency trainer and training-session use-case branches have limited direct coverage.
- Frontend page branches remain weaker around login failures and complex session interactions.
- HTTP client fallback handlers have limited direct unit coverage.
- Product-level flows are not yet covered with browser end-to-end tests.

## Recommended Next Tests

- Authentication: expired tokens, unavailable tenants and failed tenant selection.
- Training-session use cases: invalid state transitions and repository failures.
- Login and session pages: recoverable API errors and uncommon interaction branches.
- HTTP client: missing request metadata and unauthorized fallback handling.
- Browser E2E: login, role/mode switching and completion of a full training session.
