---
name: accessibility-first-ui
description: Use when building or changing user interfaces that should be accessible by default rather than audited later. Helps design and implement semantic, keyboard-friendly, screen-reader-friendly, and touch-friendly web or mobile UI, choose accessible names and structure, handle focus and status messaging correctly, and verify accessibility through real behavior tests.
---

# Accessibility First UI

## Overview

Use this skill when UI work should be accessible from the first implementation, not patched afterward.

The goal is to build interfaces that remain understandable and usable for:

- keyboard users
- screen-reader users
- touch users
- users with low vision or zoomed layouts
- users moving through forms, dialogs, tables, drawers, tabs, and navigation flows

This skill applies to web UI and mobile UI. Platform details differ, but the core rule is the same: accessibility is part of the behavior, not decoration around it.

## Core Rules

- Start from semantic structure, not visual appearance alone.
- Give every interactive control a clear accessible name.
- Ensure text, controls, focus indicators, and meaningful graphics have sufficient contrast.
- Make focus order and navigation intentional.
- Ensure status, error, and loading changes are communicated.
- Use real interaction patterns for dialogs, drawers, menus, tabs, and forms.
- Prefer accessible queries in tests because they reflect real usage.
- Fix inaccessible patterns in the implementation instead of testing around them.
- Keep accessibility work proportional and practical, but never optional for core flows.

## Token Discipline

- Keep explanations short unless the accessibility tradeoff is non-obvious.
- Report only:
  - the main accessibility behavior protected
  - key semantics or focus decisions
  - any remaining known gap
- Expand only when a pattern is subtle or a platform-specific compromise is required.

## Workflow

### 1. Identify the interaction model

Before implementing, identify what the UI actually is:

- navigation target
- button or action trigger
- form control
- dialog or drawer
- menu or tablist
- data table or list
- alert, status, or validation surface

Read [references/ui-checklist.md](./references/ui-checklist.md) when the component type or platform behavior needs a concrete checklist.

### 2. Build semantic structure first

Choose the right underlying structure:

- headings that reflect content hierarchy
- buttons for actions
- links for navigation
- labeled inputs for forms
- appropriate roles only when native semantics are not enough

Do not start from anonymous clickable containers and patch semantics later.

### 3. Define accessible names and instructions

Make sure users can understand the UI without visual guessing:

- controls have clear labels
- icon-only controls have usable accessible names
- grouped controls have contextual labeling where needed
- validation or helper text is associated with the relevant control

### 4. Design focus and navigation flow

For interactive flows, ensure users can move predictably:

- keyboard order follows meaning
- dialogs and drawers move focus intentionally on open and close
- route changes and major content swaps do not leave focus lost
- mobile touch targets remain usable without precision tapping

### 5. Communicate state changes

Make loading, success, error, and empty states understandable:

- loading is visible and not confused with emptiness
- errors are announced or clearly associated with the affected area
- validation feedback is specific
- toggled or expanded state is clear

### 6. Check contrast deliberately

Do not assume a visually nice palette is accessible.

- normal text should meet at least `4.5:1` contrast against its background
- large text may use `3:1`
- user interface components, focus indicators, and meaningful non-text graphics should meet at least `3:1` against adjacent colors
- do not rely on color alone to communicate state, meaning, or validation
- verify contrast in the actual states users see: default, hover, focus, disabled styling that is still relevant, error, success, selected, and dark-mode or themed variants

Use [references/ui-checklist.md](./references/ui-checklist.md) for a concrete contrast checklist during implementation or review.

### 7. Verify through real behavior

Use tests and checks that reflect actual interaction:

- accessible queries in component or screen tests
- keyboard and focus checks for relevant web flows
- route or screen behavior tests for navigation semantics
- browser or device verification when layout or visual clipping may affect usability

Do not treat accessibility as a checklist detached from behavior.

## Anti-Patterns

- clickable `div` patterns when a button or link is correct
- icon-only actions with no accessible name
- low-contrast text, controls, focus rings, or chart elements that look refined but are hard to perceive
- focus disappearing after dialog, drawer, or route changes
- relying on placeholder text as the only label
- using color as the only indicator for error, success, selection, or required state
- testing through CSS selectors instead of accessible roles and names
- adding ARIA roles that fight native semantics

## Expected Behavior When This Skill Is Used

When applying this skill to a task:

1. Identify the real interaction model.
2. Choose semantic structure before styling details.
3. Define labels, names, contrast, and state communication clearly.
4. Make focus and navigation behavior intentional.
5. Verify accessibility through real interaction tests or checks.
