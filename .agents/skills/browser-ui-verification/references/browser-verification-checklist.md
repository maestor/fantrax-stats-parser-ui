# Browser Verification Checklist

Use this checklist when a web UI change needs real-browser inspection before handoff.

## Trigger Checklist

Browser verification is usually warranted when the change touches:

- shared styles, themes, tokens, or component-library overrides
- route shells, navigation, drawers, dialogs, menus, tabs, tables, charts, cards, or overlays
- responsive breakpoints, scroll containers, sticky elements, virtualized lists, or viewport-specific layout
- focus, hover, active, selected, expanded, disabled, loading, empty, or error states
- text that may wrap, truncate, overflow, or alter layout
- images, icons, charts, canvas, media, or generated visual output
- dark mode, color-scheme, surfaces, borders, shadows, contrast, or theme-specific assets

Browser verification is usually unnecessary for:

- backend-only changes
- docs-only changes
- test-only refactors with no rendered behavior change
- generated files or dependency metadata
- pure data wiring already proved by meaningful rendered behavior tests

## Minimum Matrix

Choose the smallest matrix that can catch the likely problem.

### Route or surface

- exact route where the changed UI appears
- route shell if shared layout changed
- one representative consuming screen for shared components
- a deep-linked route when routing or direct-load behavior changed

### Viewport

- desktop when the changed UI primarily affects wide layouts
- mobile when breakpoints, drawers, bottom sheets, sticky nav, or wrapping can change
- both when shared layout, navigation, tables, or responsive controls changed

### Theme

- light mode when colors, spacing, or default visual state changed
- dark mode when the product supports it and surfaces, text, borders, shadows, charts, or overlays could be affected
- both when shared styles or component-library tokens changed

### Data and state

- populated state for normal usage
- empty state when valid and user-visible
- loading state when visible long enough to matter
- error state when the feature handles it intentionally
- long text, many rows, missing images, or edge values when layout can break
- open, focused, hovered, selected, expanded, disabled, scrolled, or sticky state when the changed UI has one

## Agent Browser Flow

Use the repo's preferred browser automation. If no project convention has selected or installed a browser inspection tool yet, prefer `agent-browser` as the default manual browser path:

```bash
agent-browser open http://localhost:4200
agent-browser wait --load networkidle
agent-browser snapshot -i -c
agent-browser close
```

For dark mode:

```bash
agent-browser --color-scheme dark open http://localhost:4200
```

or, when supported for an existing session:

```bash
agent-browser set media dark
```

Keep Playwright for automated E2E and performance coverage. Use browser inspection for ad hoc rendered UI validation.

## Useful Agent Browser Commands

Use these only when they fit the changed UI surface:

| Need                                 | Command pattern                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Small interactive snapshot           | `agent-browser snapshot -i -c -s "#main"`                                                                                             |
| Desktop or mobile viewport           | `agent-browser set viewport 1440 900` / `agent-browser set viewport 390 844`                                                          |
| Device emulation                     | `agent-browser set device "iPhone 14"`                                                                                                |
| Light, dark, or reduced-motion media | `agent-browser set media dark` / `agent-browser set media light reduced-motion`                                                       |
| Annotated visual refs                | `agent-browser screenshot --annotate`                                                                                                 |
| Long-page inspection                 | `agent-browser screenshot --full`                                                                                                     |
| Semantic interaction                 | `agent-browser find role button click --name "Submit"`                                                                                |
| Interaction states                   | `agent-browser hover <sel>`, `focus <sel>`, `press Tab`, `check <sel>`, `select <sel> <value>`                                        |
| Scroll or sticky state               | `agent-browser scroll down 500` / `agent-browser scrollintoview <sel>`                                                                |
| Targeted layout/style facts          | `agent-browser get box <sel>` / `agent-browser get styles <sel>`                                                                      |
| Visibility and control state         | `agent-browser is visible <sel>` / `is enabled <sel>` / `is checked <sel>`                                                            |
| Route and readiness                  | `agent-browser wait --url "**/dashboard"` / `wait --text "Ready"` / `wait "#spinner" --state hidden`                                  |
| Browser-side failures                | `agent-browser console` / `agent-browser errors`                                                                                      |
| API activity behind UI               | `agent-browser network requests --type xhr,fetch`                                                                                     |
| Focused before/after comparison      | `agent-browser diff snapshot --selector "#main" --compact` / `agent-browser diff screenshot --baseline before.png --selector "#main"` |

Use `agent-browser batch --bail` for setup steps where no intermediate output is needed. Keep steps separate when a snapshot, screenshot, or command result must guide the next action. Use `agent-browser --help` or `agent-browser skills get core` for the current installed command reference.

## Token And Cost Discipline

- Inspect the smallest route, viewport, theme, and state set that can prove the change.
- Prefer targeted snapshots or screenshots only when they answer the current UI question.
- Avoid full-app tours and repeated light/dark checks after the affected state is already verified.
- Do not paste large DOM snapshots or screenshot descriptions into the final report.
- Report the browser evidence briefly: route, viewport, color scheme, state, result, and gap.

## What To Inspect

### Layout and rendering

- no overlapping or clipped text
- no unwanted horizontal scroll
- stable spacing and alignment
- sticky elements remain anchored correctly
- virtualized or long lists render enough visible content
- images, icons, charts, and canvas content are visible and not stale
- scroll containers and page height behave as intended

### Controls and interactions

- controls are reachable and visibly focused
- hover, active, selected, expanded, and disabled states remain legible
- dialogs, drawers, menus, tooltips, and overlays layer correctly
- buttons, links, tabs, menus, and form controls respond through real interaction
- route changes and deep links land on a coherent visible state

### Theme and dark mode

- text remains readable on all affected surfaces
- borders, dividers, icons, and focus rings remain visible
- elevated surfaces and shadows still separate layers
- scrims and overlays do not obscure content too aggressively
- charts and semantic colors remain distinguishable
- disabled, selected, error, warning, and success states remain understandable without relying on color alone

## Runtime Hygiene

- Reuse the expected local server when it is already running.
- Coordinate with the user before stopping their server or changing ports.
- Confirm backend, mock, fixture, or environment assumptions before debugging browser output.
- Wait for the page to be stable before judging screenshots or snapshots.
- Hard refresh or restart the dev server if stale CSS or cached assets are suspected.
- Close browser sessions after inspection.

## Reporting Pattern

Keep the final report concrete:

- route or surface inspected
- viewport or device profile used
- color scheme checked
- interaction or UI state exercised
- browser tool used
- issues fixed or remaining gaps
