# Coding Standards

This file records repo-specific coding conventions and deliberate overrides.

Use the installed `angular-developer` skill and the official Angular docs for generic framework guidance. Use this file when the repo intentionally wants a narrower rule.

## Core Principles

- Prefer durable, project-specific guidance over generic Angular tutorials
- After refactors, remove unused leftovers instead of preserving dormant compatibility code
- If behavior, workflow, or standards change, update the relevant docs in the same batch when needed

## Angular Conventions

### Component And Service APIs

- Use Angular 21 standalone defaults; do not add redundant `standalone: true`
- Prefer `inject()` over constructor DI unless inheritance or a clear testability/readability reason makes constructor injection better
- Prefer signal inputs/outputs for new component APIs
- Use `input.required()` when the parent contract is genuinely mandatory
- Prefer signal-facing read APIs from app-state services in component code; reserve observable APIs for async composition, interop, or compatibility streams
- Prefer the `host` object in component/directive metadata when it keeps host bindings/listeners clearer

### Reactive Patterns

- Prefer `signal`, `computed`, `effect`, `toSignal`, and `takeUntilDestroyed()` over older manual subscription patterns when they fit the real problem
- Use `async` pipe for template-bound observables
- Avoid adding manual subscriptions when a signal or template binding can express the same behavior more simply
- Do not keep observable-first examples in docs or code when the real component is signal-first

### Change Detection And Component Shape

- Add `ChangeDetectionStrategy.OnPush` when the component is already safe through signal inputs, async-pipe flows, or local event-driven state
- Do not preserve optional APIs or fallback branches without real consumers
- If a component only has one real usage pattern, simplify it instead of documenting impossible states

## Template Rules

- Prefer `@if`, `@for`, and `@switch` over legacy structural directives in new or heavily touched code
- Use meaningful `track` expressions with `@for`
- Prefer semantic HTML and Angular Material primitives over clickable `div` elements or ad hoc ARIA recreations

## Naming And Imports

- Keep the existing `Component`, `Service`, and related class suffixes to match the codebase
- Use the repo path aliases where available: `@base/*`, `@services/*`, `@shared/*`
- File names remain `component-name.component.ts`, `service-name.service.ts`, and `*.spec.ts`

## Date And Time Handling

Handle user-visible dates/times with locale-aware APIs and shared helpers.

- Do not manually build localized date strings by splitting ISO strings or concatenating day/month/year pieces
- Prefer shared `Intl.DateTimeFormat`-based helpers under `src/app/shared/utils/` for reusable formatting
- Use the active UI language when formatting should follow the app locale:
  - `translate.currentLang || translate.getFallbackLang()`
- Choose the timezone intentionally instead of relying on the browser default by accident:
  - Use `Europe/Helsinki` when the product wants a league/app-local clock time
  - Use `UTC` when only the calendar date should stay stable across browsers for ISO timestamps/date-times
- Validate parsed dates before formatting and return a safe fallback (`null`, hidden field, or original domain value as appropriate) instead of showing `Invalid Date`

## Testing-Specific Coding Rules

This repo's testing rules override generic Angular examples.

- Behavior/UI tests use Testing Library with accessible queries
- E2E uses Playwright, not Cypress
- Focused service/platform tests may use Angular `TestBed` directly when behavior tests are not the right fit
- In UI tests, mock only approved external/platform boundaries such as `ApiService`, `ViewportService`, and `PwaUpdateService`
- Do not add `data-testid`, `data-cy`, or CSS-selector-only hooks just to support routine tests
- Prefer removing dead logic to covering impossible states

For full testing policy, see `docs/project-testing.md`.

## Accessibility And Theming

- Accessibility is required: keyboard use, visible focus, hidden content not tabbable, and meaningful labels are part of completion
- Every UI/styling change must be checked in both light mode and dark mode before review
- Follow `docs/styling-guide.md` for style ownership, app-token usage, and Material override rules
- Prefer `--mat-sys-*` tokens first, then `--app-*` semantic tokens when the same styling role repeats across multiple consumers
- Treat duplicated layout shells and repeated color formulas as refactor candidates, not as a pattern to extend
- New chart work should route colors through shared theme/app tokens instead of embedding a new per-component palette
- For project-specific accessibility patterns, see `docs/accessibility.md`

## Documentation Rules

- Keep repo docs focused on this project's workflow, architecture, testing, accessibility, and deliberate overrides
- Do not copy broad Angular tutorial material into local docs when the installed Angular skill already covers it
- When a repo rule intentionally overrides generic Angular guidance, document the override in the most specific relevant file
