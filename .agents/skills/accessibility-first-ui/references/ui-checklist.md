# UI Checklist

Use this checklist when building or reviewing accessible UI.

## Shared Questions

- Can users understand what each control does without seeing the visual styling?
- Can they reach and use the control through the platform's normal interaction model?
- Is state communicated when content loads, fails, expands, collapses, opens, or closes?
- Do text, controls, focus indicators, and meaningful graphics have enough contrast in the actual theme and state being shown?
- Does the testing approach use roles, labels, names, or other accessible affordances?

## Contrast Checklist

- normal text should meet at least `4.5:1` contrast against its background
- large text can use `3:1`
- UI component boundaries, focus indicators, and meaningful non-text graphics should meet at least `3:1`
- check contrast in all meaningful states, not only the default state
- do not rely on color alone for errors, selection, requiredness, success, or warnings
- check both light and dark themes when the product supports them
- check text placed over gradients, images, tinted surfaces, or translucent overlays carefully
- prefer design tokens or shared color roles that preserve contrast consistently instead of one-off local color choices

## Web UI

### Buttons, Links, And Icon Actions

- use buttons for actions
- use links for navigation
- give icon-only controls explicit accessible names
- keep text, icons, outlines, and focus rings distinguishable from the surrounding surface
- ensure visible focus is not lost or suppressed

### Forms

- associate labels with inputs
- keep helper text and validation messages connected to the control
- avoid placeholder-only labeling
- make invalid state and requiredness clear

### Dialogs, Drawers, Menus

- move focus intentionally on open
- keep interaction contained appropriately while open
- return focus predictably on close when the user flow expects it
- ensure trigger state is still understandable after closing
- verify overlays, scrims, and layered surfaces do not reduce text or control contrast below usable levels

### Tables, Lists, Tabs

- use real structure where possible
- make sorting, selection, and active-tab state understandable
- keep keyboard movement predictable
- avoid hiding key context when content updates dynamically
- make selected, sorted, active, and focused states distinguishable without depending on color alone

## Mobile UI

### Touch Targets And Labels

- controls should be clearly labeled for assistive technologies
- small visual affordances should still be comfortably tappable
- stacked controls should remain distinguishable in reading order
- ensure text and icons remain legible in bright conditions and on tinted mobile surfaces

### Navigation And Screen Changes

- route targets and back actions should be understandable
- major screen changes should not leave the user without context
- loading, empty, and error states should read as distinct outcomes

### Forms And Feedback

- text inputs need clear labels or equivalent accessible descriptions
- validation should be specific and associated with the field
- transient success or error feedback should still be understandable

## Testing Checklist

- use accessible queries first
- include keyboard or focus checks when the web flow depends on them
- verify dialogs, drawers, and navigation through actual interaction
- inspect or test contrast-sensitive states when colors, themes, or overlays changed
- do not mark a UI as accessible just because it visually looks clean
