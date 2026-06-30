# Contributing to MyWorkoutBox

Thank you for helping improve MyWorkoutBox. Keep contributions focused, reviewable, and aligned with the project architecture.

## Before You Start

- Read `AGENTS.md` for architecture, testing, security, and design rules.
- Open an issue before substantial product, API, database, or architecture changes.
- Never include credentials, personal data, private domains, or environment-specific paths.

## Development Workflow

1. Fork the repository and create a descriptive branch from `main`.
2. Keep changes scoped to one concern.
3. Add or update tests for observable behavior.
4. Update OpenAPI and documentation when public behavior changes.
5. Open a pull request using the repository template.

Direct pushes to `main` are not accepted. Pull requests must pass the required CI quality gate and all review conversations must be resolved.

## Validation

Run the relevant quality gates before opening a pull request:

```bash
npm --prefix backend run quality
npm --prefix frontend run quality
```

Backend tests require a configured MySQL/MariaDB test database.

## Commit And Pull Request Language

- Use clear Conventional Commit-style subjects such as `feat:`, `fix:`, `test:`, `docs:`, or `refactor:`.
- Write commit messages, branch names, pull request titles, and pull request descriptions in English.
- Explain compatibility, database, security, and deployment impact explicitly.

## Security

Do not disclose vulnerabilities in public issues. Follow `SECURITY.md` and use GitHub private vulnerability reporting.
