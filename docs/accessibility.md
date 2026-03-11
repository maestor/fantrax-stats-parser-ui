# Accessibility Guide

Accessibility is a **core, non-negotiable requirement** of this project.

If a feature is not usable with keyboard and assistive technologies, it is considered incomplete.

## Goals

- Keep the UI usable for:
  - Keyboard-only users
  - Screen reader users
  - Users with low vision (clear focus, sufficient contrast, zoom)
- Aim for WCAG 2.2 AA-aligned behavior where practical.

## Project Principles

### 1) Keyboard-first interactions

- Every interactive element must be reachable via `Tab` in a logical order.
- No “keyboard traps”.
- Use semantic elements whenever possible:
  - Prefer `<button>` and `<a>` over clickable `<div>`.
  - If you must use a non-semantic element, you must implement **role + tabindex + keyboard events** (but avoid this unless necessary).

### 2) Visible focus

- Focus must always be visible.
- Don’t remove outlines unless you replace them with an equally visible alternative.

### 3) No focus in hidden UI

Collapsed/hidden regions must not be tabbable.

In this project, collapsible sections use:

- `aria-hidden` when collapsed
- `inert` when collapsed (prevents focus + interaction)

This prevents confusing focus jumps into content that is not visible.

### 4) Announce intent with labels

- Inputs must have labels (`<label>` or `mat-label`).
- Icon-only buttons must have `aria-label`.
- Prefer plain-language labels.

### 5) Prefer minimal ARIA

- Use ARIA to *complete* semantics, not to re-create them.
- Avoid adding roles that conflict with native semantics.

## Patterns Used in This Codebase

### Skip link ("Siirry taulukkoon")

- The app provides a skip link as the first focusable element.
- It becomes visible on focus and moves focus into the table when rows exist.

Implementation:

- Skip link in the app shell
- Target table container uses a stable `id` (default `stats-table`)
- Career highlights reuse the career skip target (`career-table`) and move focus to the first available card row without adding those rows to normal tab order

### Stats table keyboard navigation

The stats table is designed to be usable without tabbing through every column header.

Supported behavior:

- Search input:
  - `ArrowDown` moves focus into the table (first active row)
- Table headers:
  - `ArrowDown` moves focus to the first data row
  - `ArrowUp` moves focus back to the player search input
- Table rows (roving tabindex):
  - `ArrowUp` / `ArrowDown` moves between rows
  - `Home` / `End` jumps to first/last row
  - `PageUp` / `PageDown` jumps 10 rows
  - `Enter` / `Space` opens the Player Card dialog

Notes:

- Rows expose a single tab stop using roving `tabindex`.
- The table provides screen-reader-only instructions via `aria-describedby`.

### Collapsible controls

- On desktop, top controls and the per-page settings panel are collapsible.
- When collapsed, their content must not be focusable:
  - `inert` + `aria-hidden` is applied on the content container

On mobile, top controls + settings are shown inside a left-side settings drawer (opened via the settings icon in the app header). The drawer content is rendered in a non-collapsible "content-only" mode.

### Player Card navigation

The player card supports navigating between players without closing the dialog:

- **Keyboard**: `ArrowLeft` (previous player) / `ArrowRight` (next player)
- **Touch**: Single-finger horizontal swipe on mobile devices
- **Trackpad**: Two-finger horizontal swipe on laptop trackpads (via `wheel` events)
- Navigation wraps circularly (last → first, first → last)

Accessibility details:

- A `aria-live="polite"` region announces the current player name and position after each navigation (e.g., "Pelaaja 3 / 25: Jamie Benn")
- The stats table's active row stays in sync with the navigated player
- On dialog close, focus returns to the row of the last-navigated player (not the originally opened row)
- Browser back/forward gestures are suppressed while the dialog is open (`preventDefault()` on horizontal `wheel` events + `overscroll-behavior-x: none` CSS)
- Navigation uses a direction-aware slide transition (125ms per phase). When `prefers-reduced-motion: reduce` is active, the transition is skipped entirely (instant data swap, no visual animation)

### Player Card (Graphs tab) focus shortcuts

On desktop, the Graphs tab shows a long list of stat checkboxes. To keep tab navigation convenient:

- From any stat checkbox:
  - `ArrowUp` focuses the active tab header (quickly return to tab navigation)
  - `ArrowDown` focuses the dialog close button

### Global keyboard shortcuts

The app provides global keyboard shortcuts (handled in `AppComponent`):

- Press `/` to focus the search field (GitHub-style)
- Press `?` to open the help dialog (detection uses `event.key`, so it works regardless of keyboard layout)
- Shortcuts must **not** trigger while typing in:
  - `<input>`, `<textarea>`, `<select>`
  - contenteditable elements

This keeps the shortcuts discoverable without interfering with normal text entry.

## Development Checklist (Always)

Before you consider a feature “done”:

- [ ] Can you reach it with `Tab`?
- [ ] Can you operate it with keyboard only?
- [ ] Is focus visible and not lost?
- [ ] Does focus avoid hidden/collapsed content?
- [ ] Does it have a meaningful label/announcement?
- [ ] Are new user-visible strings added to i18n files?

## Testing Guidance

### Component tests

- Add behavior tests for keyboard handlers when you introduce keyboard behavior.
- Test through user-visible behavior using Testing Library accessible queries.

### E2E tests (Playwright)

For major interaction changes, add/extend Playwright tests to cover:

- Keyboard navigation through the feature
- Opening/closing dialogs with keyboard
- Focus landing in the correct place after actions

## References

- WCAG Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
