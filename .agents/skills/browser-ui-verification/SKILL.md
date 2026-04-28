---
name: browser-ui-verification
description: "Use when building or changing web UI that needs real-browser validation before handoff: inspect rendered routes, interaction states, responsive layout, and theme-sensitive light/dark mode with agent-browser or equivalent browser automation. Helps decide when browser inspection is warranted, start or reuse local dev servers, verify dark mode explicitly, keep Playwright/E2E for automated coverage, and report visual/browser evidence without over-testing non-visual changes. Web only."
---

# Browser UI Verification

## Overview

Use this skill when web UI work needs to be checked in a real browser before review, handoff, or commit.

The goal is to make rendered browser behavior the final truth for UI changes that regular component tests cannot fully prove:

- layout, spacing, clipping, overflow, and stacking
- light and dark theme rendering
- responsive desktop and mobile states
- focus, hover, active, selected, loading, empty, and error states
- dialogs, drawers, menus, tabs, tables, sticky elements, and overlays
- screenshots or snapshots that reveal what the user actually sees

This skill is web-only. Do not apply it to native mobile UI work unless the project explicitly routes mobile validation through a browser-based web app.

## Core Rules

- Use the repository's explicitly preferred browser automation path first when one exists.
- If no project convention has selected or installed a browser inspection tool yet, prefer installing or using `agent-browser` as the default manual UI and theme inspection path.
- Keep Playwright, Cypress, or other E2E suites for automated regression coverage; do not replace them with ad hoc browser inspection.
- Run browser inspection when the task has real rendering, theme, interaction, layout, or responsive risk.
- Skip browser inspection for backend-only work, docs-only work, generated artifacts, pure test refactors, or non-visual data wiring that cannot meaningfully affect rendered UI.
- If a product supports dark mode, check dark mode explicitly for theme-sensitive UI changes.
- Check the changed route and the affected user state, not just the app shell or home page.
- Prefer realistic local data, fixtures, or app states that expose the changed UI.
- Use explicit browser media settings for theme checks; do not rely on the machine's current OS preference.
- Keep the browser session tidy: close sessions when done and do not leave long-lived inspection state for unrelated tasks.
- Report what was actually inspected: route, viewport, color scheme, interaction state, and any remaining gap.

## Token Discipline

- Choose the smallest honest browser matrix that can prove the changed UI.
- Prefer targeted routes, states, and snapshots over full-app tours.
- Do not dump every browser snapshot, screenshot, or DOM detail into the response.
- Summarize only the route, viewport, color scheme, state, result, and unresolved gap.
- Stop once the changed browser behavior is honestly verified; escalate only when the browser reveals a real issue or unverified risk.

## Agent Browser Bias

When a project has not chosen a different manual browser inspection tool, use `agent-browser` as the default. A practical inspection flow is:

```bash
agent-browser open http://localhost:4200
agent-browser wait --load networkidle
agent-browser snapshot -i -c
agent-browser close
```

For dark-mode checks, use explicit browser media settings such as:

```bash
agent-browser --color-scheme dark open http://localhost:4200
```

or switch an existing session if the tool supports it:

```bash
agent-browser set media dark
```

Useful commands during UI verification, only when they answer the current UI question:

- `agent-browser snapshot -i -c -s "#main"` for scoped, compact interactive refs that reduce output.
- `agent-browser set viewport 390 844` or `agent-browser set device "iPhone 14"` for responsive checks.
- `agent-browser screenshot --annotate` when visual layout, unlabeled icon controls, canvas, or image state needs inspection.
- `agent-browser screenshot --full` when footer, sticky, or long-page behavior matters.
- `agent-browser find role button click --name "Submit"`, `find label`, or `find text` when semantic locators are clearer than CSS selectors.
- `agent-browser hover`, `focus`, `press`, `check`, `uncheck`, `select`, `scroll`, and `scrollintoview` for real interaction states.
- `agent-browser get styles <sel>`, `get box <sel>`, and `is visible <sel>` for targeted layout, color, and visibility checks.
- `agent-browser console`, `errors`, and `network requests --type xhr,fetch` for debugging unexpected UI behavior.
- `agent-browser diff snapshot --selector "#main" --compact` or `agent-browser diff screenshot --baseline before.png --selector "#main"` for focused before/after comparison.

Use `agent-browser batch --bail` for setup steps that do not require intermediate output, but keep snapshot and interaction steps separate when refs or visible state need to be interpreted. If command details are uncertain, run `agent-browser --help` or `agent-browser skills get core` instead of guessing.

Use equivalent browser tooling only when `agent-browser` is unavailable or project conventions explicitly prefer another tool, but preserve the same behavior: open the real page, wait until it is ready, inspect the relevant state, interact when needed, and close the session.

Read [references/browser-verification-checklist.md](./references/browser-verification-checklist.md) when the changed UI spans multiple routes, themes, or responsive states.

## Workflow

### 1. Decide whether browser verification is warranted

Good times to use browser verification:

- after changing shared CSS, design tokens, theme files, component-library overrides, or layout primitives
- after changing a route, shell, nav, drawer, modal, menu, table, chart, graph, sticky element, or virtualized list
- after changing responsive behavior, mobile breakpoints, scroll behavior, focus styling, hover styling, or overlays
- after changing loading, empty, error, disabled, selected, expanded, active, or tooltip states
- after changing copy that may wrap, truncate, overflow, or affect important layout
- when the product supports dark mode and the change could affect colors, surfaces, shadows, borders, charts, icons, or contrast

Usually skip browser verification for:

- backend-only or API-only changes
- docs, comments, generated files, lockfile-only updates, or static metadata
- pure data wiring where existing rendered tests already prove the visible outcome
- routine test-only refactors that do not change rendered behavior

### 2. Identify the minimum browser matrix

Choose only the states that can reveal the changed behavior:

- route or component surface
- desktop and/or mobile viewport
- light and/or dark color scheme
- relevant data state: populated, empty, loading, error, long text, or many rows
- relevant interaction state: focused, hovered, open, expanded, selected, disabled, or scrolled

Keep the matrix small, but do not skip the state where the bug is most likely to show.

### 3. Confirm local runtime assumptions

Before opening a browser, confirm what the UI needs:

- dev server command and port
- backend or mock server expectations
- environment variables or fixture mode
- whether a server is already running
- whether dark mode follows browser media settings or an in-app toggle

Use an existing server when appropriate. If the expected port is already occupied by the user's session, coordinate instead of silently changing the workflow.

### 4. Inspect the real rendered state

Open the target page and wait for the app to be ready. Then inspect the changed UI in context.

Check for:

- visible content matches the intended state
- text does not clip, overlap, overflow, or become unreadable
- spacing, alignment, stacking, sticky elements, and scroll containers behave correctly
- controls remain usable and visibly focused
- overlays, dialogs, drawers, menus, and tooltips layer above the right content
- loading, empty, and error states are distinct
- charts, icons, images, and media render rather than appearing blank or stale

Use snapshots or screenshots when they help confirm what is on screen. Prefer interaction through real controls over inspecting markup alone.

### 5. Verify theme-sensitive UI explicitly

When dark mode or theme-sensitive styling is in scope:

- inspect the affected route in light mode
- inspect the same affected route in dark mode
- check surfaces, text, borders, focus rings, icons, shadows, charts, disabled states, and overlays
- hard refresh or restart the dev server if browser or dev-server caching appears to keep stale CSS

Do not assume dark mode works because light mode works.

### 6. Escalate to automated coverage only when needed

If browser inspection finds a repeatable behavioral regression, decide whether it deserves automated coverage:

- Testing Library for local component or page behavior
- E2E for route, shell, browser, or full-flow behavior
- visual regression tooling only when the project already supports it or the risk justifies introducing it

Do not add screenshots or E2E tests for every visual tweak. Use browser inspection to catch visual reality; use automated tests to protect durable behavior.

## Anti-Patterns

- Marking UI work done after tests pass without checking the rendered browser when styling or layout changed
- Checking only the default route when the changed UI lives elsewhere
- Checking only light mode in a dark-mode-capable app
- Treating Playwright E2E and manual browser inspection as interchangeable
- Leaving agent-browser or browser sessions open after the task
- Starting a second server on a surprise port without telling the user
- Using browser inspection for non-visual changes just to add ritual command output
- Trusting screenshots before the app has reached a stable loaded state

## Expected Behavior When This Skill Is Used

When applying this skill to a task:

1. Decide whether the change has real web rendering risk.
2. Identify the smallest honest browser matrix for route, viewport, theme, and state.
3. Confirm local server, backend, fixture, and theme assumptions.
4. Inspect the changed UI in a real browser with interaction where needed.
5. Check dark mode explicitly when theme-sensitive UI is in scope.
6. Escalate to automated tests only for durable behavior that should be protected.
7. Report exactly what was browser-verified and what was not, keeping the report concise.
