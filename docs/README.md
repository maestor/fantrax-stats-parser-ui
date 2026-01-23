# Project Documentation for Fantrax Stats Parser UI

This directory contains documentation to help contributors understand and work effectively with this codebase.

## Quick Reference

- [Project Overview](./project-overview.md) - High-level architecture and purpose
- [Development Guide](./development-guide.md) - Setup, commands, and workflows
- [Project Testing](./project-testing.md) - Unit/E2E testing guide
- [Codebase Structure](./codebase-structure.md) - Directory layout and organization
- [Coding Standards](./coding-standards.md) - Conventions and best practices
- [Component Guide](./component-guide.md) - Angular components reference
- [Service Guide](./service-guide.md) - Services and state management

## About This Project

Fantrax Stats Parser UI is an Angular 21 application that provides a user interface for viewing and analyzing NHL fantasy league statistics. It connects to the [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser) backend API.

## Key Technologies

- Angular 21
- Angular Material
- TypeScript 5.9
- RxJS
- ngx-translate (i18n)
- Playwright (E2E testing)
- Jasmine/Karma (unit testing)

## Testing Overview

- Unit tests are implemented with Jasmine/Karma and focus on services, shared components, and page-level wiring (see project-testing.md and the various `*.spec.ts` files under `src/app`).
- End-to-end tests are implemented with Playwright in the `e2e` directory and exercise real user flows against a running dev server.
- Playwright is configured via `playwright.config.ts` to start `npm start` automatically and run tests against `http://localhost:4200` in Chromium, Firefox and WebKit.
- The main E2E suite in `e2e/App.spec.ts` covers front-page layout, navigation between player/goalie views, Player Card behavior, filters (search/report type/season/stats-per-game/min-games), sorting, and isolation of player vs. goalie filters.

## Common Tasks

### Making Changes
1. Read relevant files before making changes
2. Follow existing patterns and conventions
3. Update tests when modifying components or services
4. Use Angular Material components consistently

### Adding Features
1. Check existing components for similar patterns
2. Follow the component/service structure
3. Add translations for new UI text
4. Write unit tests for new functionality

### Debugging
1. Check browser console for errors
2. Review service layer for API issues
3. Verify data flow through RxJS observables
4. Check filter and cache services for state issues
