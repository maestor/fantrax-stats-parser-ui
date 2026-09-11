# Coding Standards

Project conventions override generic Angular examples; use `angular-developer` for framework syntax.

## Angular and TypeScript

- Keep existing `Component`/`Service` suffixes, `*.component.ts`, `*.service.ts`, `*.spec.ts`, and aliases `@base/*`, `@services/*`, `@shared/*`.
- Use standalone defaults without redundant `standalone: true`. Prefer `inject()` unless inheritance/testability/readability justifies constructor DI.
- Prefer signal inputs/outputs and required inputs for mandatory parent contracts. Do not retain defensive optionality without real consumers.
- Components read app state through signals; observables handle async composition/interop. Prefer computed state, template `async`, and `takeUntilDestroyed()` to unnecessary manual subscriptions.
- Use OnPush only when signal inputs, async bindings, or local events make the component safe; do not blanket-convert subscription-heavy components.
- Prefer the metadata `host` object, built-in `@if`/`@for`/`@switch`, meaningful tracking, semantic HTML, and Material primitives.
- Remove proven-unused code after refactors instead of keeping dormant fallback paths.

## Dates and localization

User-visible strings belong in `public/i18n/`. Use shared `Intl.DateTimeFormat` helpers under `src/app/shared/utils/`, not ISO splitting or manual localized concatenation.

Use the active language (`translate.getCurrentLang() || translate.getFallbackLang()`). Choose `Europe/Helsinki` for league timestamps or `UTC` for stable ISO calendar dates. Validate dates and return an appropriate hidden/null/domain fallback instead of `Invalid Date`.

[Testing](testing.md) owns mocks/queries and behavior protection; [accessibility](accessibility.md) owns focus/keyboard semantics; [styling](styling.md) owns theme tokens and style reuse.
