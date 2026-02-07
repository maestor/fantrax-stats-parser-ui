# Roadmap

Planned improvements and future development ideas, roughly ordered by priority.

## Application features

### High priority

#### Favorites / Watchlist

Star/bookmark players, persisted in localStorage. Add a "Suosikit" filter toggle to quickly view only watched players. No API changes needed.

### Medium priority

#### Player Card Navigation (Prev/Next)

Navigate to the next/previous player in the current table sort order from within the player card. No visible UI buttons — use keyboard arrows and swipe gestures (mobile/touchpad/mouse), similar to carousel grid interaction patterns.

#### Highlight Career Bests in Player Card

In the "Kausittain" (By Season) tab, bold the career-best value for each individual stat column. Only applies to players with more than one season of data. Show a tooltip on hover/keyboard focus: "Kauden paras {statName}" (personal best). Should be subtle — not draw too much visual attention.

#### Search Focus Shortcut

Press `/` to focus the search field (GitHub-style). Complements the existing `?` help shortcut.

### Low priority

#### URL-Persisted Filter State

Encode stats table filter state (team, season, report type, per-game mode, etc.) in URL query parameters so users can share and bookmark specific views. Lower priority since player card deep linking already exists.

#### Manual Dark/Light Mode Toggle

Override the current auto-only system-preference-based theme. Persist choice in localStorage.

#### Remember Sort Column

Persist the user's last sort column and direction per table (players/goalies) in localStorage across sessions.

## E2E Testing

### Test data management

- Add test data builder utilities

### Advanced testing

- Visual regression testing (Playwright screenshot comparison)
- Performance testing (Core Web Vitals)
