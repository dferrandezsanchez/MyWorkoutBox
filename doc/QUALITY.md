# Quality Audit

## Current Status

Last local audit: 2026-07-04.

| Area | Status |
| --- | --- |
| Backend tests | 21 files, 85 tests passing |
| Frontend tests | 23 files, 82 tests passing |
| Backend lint | Passing |
| Frontend lint | Passing |
| Backend build | Passing |
| Frontend build | Passing |
| Backend audit | 0 vulnerabilities |
| Frontend audit | 0 vulnerabilities |

## Coverage Snapshot

| Package | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Backend | 87.96% | 78.24% | 95.86% | 91.84% |
| Frontend | 94.11% | 83.60% | 96.64% | 95.81% |

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

- Active-session mutation failures do not yet expose explicit recoverable feedback in the UI; covering them properly requires a product behavior change rather than test-only work.
- Product-level flows are not yet covered with browser end-to-end tests.

## Recommended Next Tests

- Active-session mutations: add visible retry/error behavior, then cover failed add, save, delete, complete and discard operations.
- Browser E2E: login, role/mode switching and completion of a full training session.

## Closed Coverage Gaps

The 2026-07-03 audit added targeted edge-case coverage for:

- expired tenant-selection tokens, users without available tenants and failed tenant selection;
- invalid training-session transitions after completion and simulated repository read/write failures;
- recoverable login tenant-selection errors, session load recovery, completed-session controls and destructive-dialog cancellation;
- HTTP `401` fallback without request metadata, auth endpoint exclusions and `403` propagation without forced logout.

The 2026-07-04 audit added targeted backend coverage for:

- empty and partial trainer updates, including independent name, email and active-state changes;
- inactive memberships, inactive users and role/state fallback when no membership is supplied;
- adding an existing user to another tenant without creating a duplicate account;
- missing required trainer values after optional input parsing;
- omitted and pre-parsed client birth dates;
- default, omitted, empty and explicit-null exercise configuration collections.
