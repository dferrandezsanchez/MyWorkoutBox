# Quality Audit

## Current Status

Last local audit: 2026-06-26.

| Area | Status |
| --- | --- |
| Backend tests | 12 files, 37 tests passing |
| Frontend tests | 4 files, 9 tests passing |
| Backend build | Passing |
| Frontend build | Passing |
| Backend audit | 0 vulnerabilities |
| Frontend audit | 0 vulnerabilities |

## Coverage Snapshot

| Package | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Backend | 66.41% | 51.44% | 76.08% | 68.88% |
| Frontend | 27.49% | 24.56% | 28.57% | 28.40% |

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
- Backend error handling and authentication middleware need more negative-path tests.
- Auth use cases need stronger tests around tenant selection, invalid tokens and profile/password updates.
- Frontend coverage is low because layout, theme, session store and shared UI components are lightly tested.
- Product-level frontend flows are not covered end-to-end yet.

## Recommended Next Tests

- Login page: show/hide password, invalid credentials, tenant selection and redirect.
- Protected route: missing token, expired token and role-based redirects.
- Theme provider: stored preference, system preference and tenant branding persistence.
- HTTP client: bearer token injection and unauthorized callback behavior.
- Backend `authenticate` middleware: missing header, malformed token, invalid token and inactive membership.
- Backend `errorHandler`: domain errors mapped to expected HTTP status codes.
