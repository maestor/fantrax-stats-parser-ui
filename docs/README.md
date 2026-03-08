# Project Documentation for Fantrax Stats Parser UI

This directory contains documentation to help contributors understand and work effectively with this codebase.

## Quick Reference

- [Project Overview](./project-overview.md) - High-level architecture and purpose
- [Development Guide](./development-guide.md) - Setup, commands, and workflows
- [Project Testing](./project-testing.md) - Testing guide (behavior, service-layer tests, + E2E)
- [Codebase Structure](./codebase-structure.md) - Directory layout and organization
- [Coding Standards](./coding-standards.md) - Conventions and best practices
- [Component Guide](./component-guide.md) - Angular components reference
- [Service Guide](./service-guide.md) - Services and state management
- [Accessibility](./accessibility.md) - Keyboard, focus, ARIA patterns and project a11y requirements
- [Roadmap](./roadmap.md) - Planned improvements and future development ideas

## About This Project

Fantrax Stats Parser UI is an Angular 21 application that provides a user interface for viewing and analyzing NHL fantasy league statistics. It connects to the [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser) backend API.

## Key Technologies

- Angular 21
- Angular Material
- TypeScript 5.9
- RxJS
- ngx-translate (i18n)
- Playwright (E2E testing)
- Vitest + Testing Library (component/behavior testing)

## Testing Overview

- Component tests use Testing Library (`@testing-library/angular`) with Vitest, following accessible user-centric queries (`getByRole`, `getByText`, etc.).
- Service-layer tests use Angular `TestBed` directly when HTTP/cache/platform logic needs to be verified without bypassing the real service implementation.
- End-to-end tests are implemented with Playwright in the `e2e` directory and exercise real user flows against a running dev server.
- Playwright is configured via `playwright.config.ts` to run against `http://localhost:4200` in Chromium only, start `npm start` automatically by default, and support an external-server mode when the frontend is already running.
- E2E tests are organized into feature-based specs under `e2e/specs/` (smoke, player-card, team-switching, filters, mobile) with page objects and shared helpers.

## Common Tasks

### Making Changes
1. Read relevant files before making changes
2. For planning-heavy work, save the approved plan under local gitignored `docs/plans/` with a dated filename before implementation starts
2. Follow existing patterns and conventions
3. Update tests when modifying components or services
4. Use Angular Material components consistently

### Adding Features
1. Check existing components for similar patterns
2. Follow the component/service structure
3. Add translations for new UI text
4. Write behavior tests for new functionality using Testing Library
5. Write E2E to existing scenario for new functionality (primarily), if not suitable one exists make new test case
6. Update project README and every docs/*.md related
7. Ask supervisor review what have done and ask if there is anything should fix

### Debugging
1. Check browser console for errors
2. Review service layer for API issues
3. Verify data flow through RxJS observables
4. Check filter and cache services for state issues
