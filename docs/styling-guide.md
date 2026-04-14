# Styling Guide

This guide records the styling architecture for this repo.

Use the installed `angular-developer` skill and Angular docs for generic component styling mechanics. Use this file for the project-specific rules about style ownership, theming, reuse, and Material overrides.

## Goals

- keep feature styles local by default
- keep shared patterns reusable without pushing everything into global CSS
- use Material tokens as the foundation
- add app-level semantic tokens only when they solve a real repeated need
- avoid raw color drift and layout duplication

## Styling Architecture

### `src/theme.scss`

This is the theme foundation.

- Owns Angular Material theme setup
- Emits `--mat-sys-*` and `--mat-*` tokens
- Owns cross-cutting app semantic tokens such as `--app-focus-ring-color` and `--app-overlay-scrim`
- Is the right place for theme-aware values that need to be shared across multiple features

Do not turn `theme.scss` into a second global stylesheet. Keep it focused on theme/token definition.

### `src/styles.scss`

This is the global style composition root.

- It should primarily `@use` responsibility-based partials
- Avoid growing it back into one large override file
- If a new global rule is needed, prefer adding it to the most specific partial under `src/styles/`

### `src/styles/`

This folder owns app-wide styling that cannot reasonably live in one component stylesheet.

Use it for:

- Angular Material or MDC overrides
- overlay and `cdk-*` surfaces
- app-wide utilities
- shared table or shell selectors that target rendered DOM across components
- reusable Sass mixins that are global by nature

Do not put route-specific styling here just because it is convenient.

### `src/app/**/**/*.component.scss`

Component stylesheets are the default home for styling.

Keep styling local when it only affects:

- one component
- one route
- one feature-specific state or layout

Even when a component uses shared mixins, keep its feature-specific exceptions in the component stylesheet.

### `src/app/shared/styles/`

This folder owns shared component-level Sass primitives.

Use it for mixins or small partials that multiple component stylesheets consume directly, such as:

- dialog shells
- browse section shells
- shared shell headers

If the abstraction is still component-oriented and does not need global selectors, prefer this folder over `src/styles/`.

## Style Ownership Rules

### Prefer component-local first

Start in the component stylesheet unless there is a clear reason not to.

Good local candidates:

- spacing inside one card/dialog
- route-only section layouts
- one component's responsive adjustments
- feature-specific table tweaks

### Extract shared component mixins before duplicating

If two or more component stylesheets repeat the same structure, extract a shared mixin under `src/app/shared/styles/`.

Current examples:

- `dialog-surface`
- `browse-section-shell`

Do not copy-paste a near-identical layout block into a second route/component if a small mixin would remove it cleanly.

### Use global partials only when the selector must be global

Global partials are justified when:

- Angular Material renders the target outside component encapsulation
- the selector targets overlay DOM
- the same DOM pattern is intentionally shared across multiple feature families
- the rule is truly app-wide utility/foundation styling

If the selector starts depending on route-specific class names without a broader reuse reason, it probably belongs back in feature/component styles.

## Theme And Token Rules

### Prefer Material system tokens first

Reach for `--mat-sys-*` before inventing new app tokens.

Examples:

- surface/background colors
- on-surface text colors
- outline/border colors
- primary/error containers

### Add `--app-*` tokens only for repeated semantic meaning

Create an app token when the same visual role appears in multiple places and the raw value or color-mix formula would otherwise be duplicated.

Good candidates:

- focus ring color
- success emphasis color
- overlay scrim
- sheet shadow
- badge background
- scrollbar track/thumb styling

Name tokens by purpose, not by literal color. Prefer `--app-focus-ring-color` over names like `--app-blue-70`.

### Avoid raw color literals in component SCSS

Do not introduce new hex/rgb/rgba literals in component styles when an existing Material token or app token already covers the need.

If a value is:

- one-off but already expressible with Material tokens, use the Material token
- repeated in multiple places, promote it to `--app-*`

Existing older literals elsewhere in the codebase are debt, not precedent.

### Chart colors must be theme-aware

New graph work should not hard-code a fresh palette inside each chart component.

Preferred direction:

- define a shared chart palette through theme/app tokens
- read those tokens from chart code when dataset colors are built in TypeScript
- keep light/dark contrast safe by default

Current chart palette literals in older graph code should be treated as refactor targets, not a model for future work.

## Reuse Rules

Before writing a new surface or shell, check for an existing reusable primitive.

### Use `src/styles/_surface-patterns.scss` for common surfaces

Prefer the existing mixins for:

- outlined panels
- rounded surface cards
- status/error surfaces
- inset focusable surface rows
- pill badges
- compact stat tiles and stat labels/values
- themed scrollbars
- eyebrow / section-label text

### Reuse shared shells before inventing new ones

Current shared shells already exist for:

- dialogs
- browse section layouts
- shell headers

If a new feature looks structurally similar, extend the shared primitive or add a small modifier before creating a totally separate copy.

## Material Override Rules

### Keep overrides narrow and explained

`!important`, deep selectors, and MDC-internal selectors are acceptable only when:

- Angular Material/MDC does not expose a usable token/variable hook
- the element is rendered outside component encapsulation
- a narrower selector is not enough

When doing this:

- scope the selector as tightly as possible
- keep the rule in the most relevant global partial
- add a short comment explaining why the override exists

### Do not use global overrides as a shortcut for normal feature styling

If a component can own the style through its own stylesheet or a shared mixin, do that instead of adding another global rule.

## Validation Rules

For every UI-touching styling change:

- check the affected surface in light mode
- check the affected surface in dark mode
- check desktop and mobile widths when layout/overflow/spacing changed
- verify focus states for interactive changes
- verify loading, empty, and error states when the touched component has them

If a refactor changes the styling architecture itself, update this guide in the same batch.
