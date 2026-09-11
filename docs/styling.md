# Styling

The UI follows `prefers-color-scheme` automatically, with no manual theme toggle. `src/theme.scss` uses Material `theme-type: color-scheme` and browser `color-scheme` to resolve `light-dark(...)` tokens; `angular.json` includes it in build/test styles.

## Ownership

| Location | Use for |
| --- | --- |
| Component SCSS | Default for feature/route layout, states, responsive rules, and exceptions |
| `src/app/<feature>/styles/` | Shared styling confined to one feature, e.g. draft panel shell |
| `src/app/shared/styles/` | Cross-feature component mixins: dialogs, browse sections, shell headers |
| `src/theme.scss` | Material theme and shared semantic tokens; keep selectors out |
| `src/styles.scss` | Composition root importing responsibility-based global partials |
| `src/styles/` | Truly global foundations/utilities, overlay DOM, cross-component DOM shells, Material/MDC overrides that cannot be local |

Extract repeated component shells to a shared mixin before duplicating them. Keep feature-specific exceptions local. Reuse `src/styles/_surface-patterns.scss` for panels/cards, status surfaces, focusable rows, badges, stat tiles, scrollbars, and eyebrow labels.

## Tokens and overrides

- Prefer `--mat-sys-*`. Add purpose-named `--app-*` tokens only when a semantic role repeats across consumers, e.g. focus rings, scrims, badges, chart palettes.
- Avoid new raw colors in component SCSS where tokens cover the role. Existing literals are refactor candidates, not precedent.
- New charts use shared theme/app colors, read from tokens when TypeScript builds datasets; validate both themes.
- Avoid `::ng-deep`. Prefer child-owned variants or the appropriate global partial for framework-owned drawer/overlay internals.
- `!important`, deep/MDC-internal selectors require a narrow scope and a comment explaining the missing token hook, encapsulation issue, or insufficient narrower selector. Keep such overrides in the relevant global partial.

## Validation

Before review, inspect affected surfaces in light and dark modes, relevant desktop/mobile widths, focus/hover/tooltips, and applicable loading/empty/error states. Use `browser-ui-verification` and `agent-browser` when real styling/theming risk needs manual inspection; close the browser afterward.

For stale theme output, check `matchMedia('(prefers-color-scheme: dark)').matches` and computed `--mat-sys-surface`, then hard-refresh or restart the dev server if necessary.

For selector cleanup, run `npm run audit:styles:dead` and inspect dynamic-class exceptions before deleting rules. Fix component budget growth structurally (split responsibilities/extract reuse) before raising budgets; [development](development.md#build-and-performance) owns the budget workflow.
