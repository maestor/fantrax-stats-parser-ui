# Development Guide

This guide focuses on local setup, commands, and repo-specific operational notes.

Use the project-local skills in `.agents/skills/` when they match the task, especially `intelligence-testing` for testing-related work, `local-first-verification` for local check strategy, and `browser-ui-verification` for browser-risk UI changes. Use `angular-developer` and official Angular docs for generic framework guidance only. Follow `AGENTS.md` and `CLAUDE.md` for the authoritative task workflow, review pause, verify, and commit rules.

The upstream source for the repo-local skills is [maestor/agent-skills](https://github.com/maestor/agent-skills). Its README documents the `skills.sh` install source as `npx skills add maestor/agent-skills --skill <skill-name>`. This repo vendors the selected skills under `.agents/skills/` so they stay project-local and available automatically in future sessions.

Explicit user instructions in chat override those repo workflow defaults. Treat the documented workflow as the fallback when the user has not said otherwise.

## Prerequisites

1. **Node.js**: Version 24.x
2. **npm**: Comes with Node.js
3. **Backend**: [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser) running

Note: If you see `npm WARN npm npm does not support Node.js v24.x`, see `docs/project-requirements.md` → "npm Warning About Node 24".

## VS Code + Copilot Terminal Notes

If you work on this repo using GitHub Copilot Chat in VS Code, you may notice multiple terminals get created during command execution. This is normal: Copilot may start separate terminal sessions so it can run and/or poll long-running commands without disrupting your existing terminal.

There isn’t a reliable “reuse one terminal only” switch that can be set from the project. Practical mitigations:

- Use Command Palette → “Terminal: Kill All Terminals” (fast cleanup).
- When you work with Copilot, ask it to “batch commands into one run” so it uses fewer tool calls.
- Copilot or any coding agent should still follow the repo workflow in `AGENTS.md` / `CLAUDE.md` for review, verify, and commit behavior.
- Do not treat VS Code tool defaults as the repo's source of truth for workflow rules.

If Copilot Chat (or VS Code) shows “Enable shell integration to improve command detection”, ensure both of these settings are enabled:

- `terminal.integrated.inheritEnv`: `true`
- `terminal.integrated.shellIntegration.enabled`: `true`

## Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd fantrax-stats-parser-ui

# Install dependencies
npm install
```

## Development Commands

### Start Development Server
```bash
npm start
# or
npm run start
```
- Runs on http://localhost:4200
- Auto-reloads on file changes
- Uses normal live reload instead of HMR because this app contains `@defer` blocks and we want local startup behavior closer to the shipped app
- Does not open a browser automatically (open the URL manually)

### Build for Production
```bash
npm run build
```
- Outputs to `dist/` directory
- Optimized and minified
- Ready for deployment
- Enforces production bundle budgets from `angular.json`

Note: If the production build fails with a Node "heap out of memory" error, the repo scripts set a higher heap size via `NODE_OPTIONS` for `npm run build`.

#### Current production budgets

- `initial`: warning at `1 MB`, error at `1.5 MB`
- `anyComponentStyle`: warning at `4 kB`, error at `8 kB`

#### How to handle bundle warnings

Do not treat build budget warnings as harmless background noise.

Use this rule during development after `npm run verify`:

1. Confirm which bundle or component stylesheet exceeded budget.
2. Decide whether the increase is accidental or intentional.
3. Prefer optimization first:
   - lazy-load heavy dialogs, tabs, charts, or route-only UI
   - remove duplicated SCSS or broad overrides
   - move code out of the initial app shell when it is not needed at startup
4. Adjust the budget only if the size increase is understood and justified by current product scope.
5. When budgets are changed, update `README.md` and relevant docs so the threshold change is explicit.

### Run Performance Audit
```bash
npm run perf:audit
```
- Builds the production bundle before auditing
- Serves the local production output instead of `ng serve`
- Reuses Playwright plus the repo's fixture-backed API mocking to keep the audit deterministic
- Covers `/`, `/career/players`, and `/leaderboards/regular` in desktop + mobile profiles
- Reports `LCP`, `CLS`, and a scripted interaction-delay proxy
- Prints the top layout-shift sources so desktop/mobile CLS regressions are easier to trace

Use this as a local regression check after startup-bundle or rendering changes. It is intentionally a lab audit, so keep using PageSpeed Insights / Chrome DevTools when you need public-score or field-data confirmation.

### Theming / Automatic Dark Mode

The UI follows the device/browser color scheme automatically (no manual toggle).

Dark mode verification is mandatory for every UI/styling change.

Use `docs/styling-guide.md` as the source of truth for style ownership, shared Sass primitives, and app-token rules.

- Any new component, layout, card, table, dialog, tooltip, or color tweak must be checked in both light mode and dark mode before the task is considered done.
- Do not assume a change is "too small" to affect dark mode.

Key files:

- `src/theme.scss`: Angular Material theme configuration (emits `--mat-sys-*` tokens via `theme-type: color-scheme`)
- `src/styles.scss`: global style composition root for responsibility-based partials
- `src/styles/`: global partials for overlays, Material overrides, utilities, and shared DOM-targeted shells
- `src/app/shared/styles/`: shared component-level Sass mixins such as dialog and browse-route shells

Theme/token rule of thumb:

- prefer `--mat-sys-*` first
- add `--app-*` only for repeated semantic values such as focus rings, scrims, badge backgrounds, or chart palettes
- do not add new raw color literals to component SCSS when a token should own the value

#### Debugging dark mode

In DevTools Console:

- Check preference: `window.matchMedia('(prefers-color-scheme: dark)').matches`
- Check a token: `getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-surface')`

If the page looks like it’s using a stale/light bundle (common during theming work):

- Hard refresh: `Cmd+Shift+R`
- If still wrong under `ng serve`, restart `npm start` (browser/dev-server caching can keep older CSS around)

Before review/verify for any UI-facing change:

- Check the changed view in light mode
- Check the changed view in dark mode
- Verify focus, hover, tooltip, loading, and empty/error states in the affected UI where relevant

### PWA (Installable App)

The app is configured as a PWA in production builds.

Key files:

- `public/manifest.webmanifest`
- `ngsw-config.json`
- `src/index.html` (manifest + favicon + iOS install meta)

#### Test the PWA locally

Angular’s service worker does not run under `ng serve`. To test installability and caching locally:

```bash
npm run build
cd dist/fantrax-stats-parser-ui/browser
python3 -m http.server 8080
```

Then open http://localhost:8080 and check:

- Chrome DevTools → Application → Manifest
- Chrome DevTools → Application → Service Workers

If icons/manifest don’t update after changes, clear site data or uninstall/reinstall the installed PWA.

#### Regenerate icons

The placeholder icons (including maskable icons and favicon PNGs) are generated by:

```bash
python3 scripts/generate-pwa-icons.py
```

Outputs go to `public/icons/`.

### SEO / Share Metadata

The app now has a lightweight metadata layer for search/share basics.

Key files:

- `src/index.html`: crawler-visible fallback title, description, canonical URL, and Open Graph/Twitter tags
- `src/app/app.routes.ts`: route SEO data (`sectionKey` / `tabKey`)
- `src/app/services/seo.service.ts`: updates title/canonical/social tags after navigation
- `src/app/shared/utils/seo.utils.ts`: title builder + active-route SEO helpers
- `src/app/app.config.server.ts` + `src/app/app.routes.server.ts`: prerender configuration for fixed public routes
- `src/app/services/server-translate.loader.ts`: server-side translation loader used during prerendering
- `public/robots.txt`
- `public/sitemap.xml`

Title rules:

- `/` uses only the site title: `FFHL tilastopalvelu`
- Fixed public routes use `FFHL tilastopalvelu | SectionName | TabName`
- Section and tab names come from existing translation keys, so route titles stay in sync with the UI labels

When adding or renaming a public route:

- update the route's SEO data in `src/app/app.routes.ts`
- update `src/app/app.routes.server.ts` if the route should be prerendered for share crawlers
- update `public/sitemap.xml` if the route should be crawlable
- keep `src/index.html` fallback metadata sensible for non-JavaScript crawlers

Prerendering notes:

- `npm run build` now emits static HTML for `/`, `/player-stats`, `/goalie-stats`, `/career/*`, and `/leaderboards/*`
- dynamic `/player/...` and `/goalie/...` routes intentionally stay client-rendered in this batch
- backend API data is still fetched in the browser after hydration for these prerendered routes; the prerender output is primarily for metadata/share previews and route shell HTML

### Watch Mode (Development Build)
```bash
npm run watch
```
- Builds in development mode
- Watches for file changes
- Rebuilds automatically

### Run Tests
```bash
npm test                # Tests (Vitest + Testing Library) — runs once, no browser window
```

For watch mode (re-run on file changes):

```bash
npm run test:watch
```

### Run E2E Tests
```bash
npx playwright test
```

- Runs Playwright E2E tests
- Headless by default
- Results in `test-results/`
- Requires the backend API on `http://localhost:3000`
- Playwright starts `npm start` automatically when needed, or reuses an existing frontend on `http://localhost:4200`
- Do not use `CI=true` for routine local runs; that switches to the repo's fixture-backed CI flow instead of using your live local backend
- If you need to reproduce real CI fixture mode locally with `CI=true`, free up `http://localhost:4200` first so Playwright can start the CI-mode web server instead of reusing your dev session
- If the backend is not running during a collaborative session, ask the user to start it before trying fallback approaches

Useful local variants:

```bash
# Full suite
npm run e2e

# Single spec while iterating
npx playwright test e2e/specs/leaderboards.spec.ts

# Headed browser run
npx playwright test --headed
```

### Manual Browser Automation For Agent Work

Use the device-wide `agent-browser` CLI for ad hoc browser inspection tasks that are not Playwright E2E tests.

Recommended flow:

```bash
agent-browser open http://localhost:4200
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser click @e2
agent-browser close
```

Notes:

- Prefer `agent-browser` for manual UI/theme inspection that older workflow text may still call "Playwright MCP".
- Keep Playwright for automated E2E coverage (`npm run e2e`, `npx playwright test`, `npm run perf:audit`).
- For dark-mode checks, use explicit browser media settings such as `agent-browser --color-scheme dark open http://localhost:4200`.

### Angular CLI Commands
```bash
# Generate new component
npx ng generate component component-name

# Generate new service
npx ng generate service service-name

# Generate other artifacts
npx ng generate <schematic> <name>

# Help
npx ng help
```

### Dates and times

When you add or change user-visible date/time formatting:

- Prefer shared `Intl.DateTimeFormat`-based helpers in `src/app/shared/utils/` over manual string splitting.
- Match the locale to the active UI language unless the feature intentionally uses a fixed locale.
- Pick the timezone deliberately:
  - `Europe/Helsinki` for league/app-local timestamps
  - `UTC` when an ISO timestamp's calendar date must not drift by browser timezone
- Validate invalid/missing dates and show a safe fallback instead of leaking `Invalid Date`

## Project Configuration

### Backend API Endpoint
The API endpoint is configured in the service layer. Check:
- `src/app/services/api.service.ts`

### Build Configuration
- **Development**: `angular.json` → `projects.architect.build.configurations.development`
- **Production**: `angular.json` → `projects.architect.build.configurations.production`

### TypeScript Configuration
- **App**: `tsconfig.app.json`
- **Tests**: `tsconfig.spec.json`
- **Base**: `tsconfig.json`

## Development Workflow

### Verification Expectations

- Run `npm run verify` for batches that can affect app code, runtime behavior, config, generated artifacts, or the verification result.
- Documentation-only batches may skip `npm run verify` when the touched files are limited to workflow/docs text such as `README.md`, `docs/**`, `AGENTS.md`, or `CLAUDE.md` and no code, fixtures, configs, or generated artifacts changed.
- E2E-only batches may skip `npm run verify` when the touched files are limited to `e2e/**` and optional workflow/docs text, no app/runtime/config/generated artifacts changed, and the relevant Playwright coverage for the batch has been run and reported.
- When in doubt, follow `AGENTS.md`, `CLAUDE.md`, and `docs/project-requirements.md`.

### Adding a New Feature

1. **Plan the feature**
   - Identify affected components/services
   - Consider data flow
   - Check for reusable components

2. **Create/modify components**
   ```bash
   npx ng generate component feature-name
   ```

3. **Update services if needed**
   - Add API calls to `api.service.ts`
   - Add business logic to `stats.service.ts`
   - Update cache/filter services as needed

4. **Add translations**
   - Update translation files for new UI text

5. **Write tests**
   - Component tests (`*.spec.ts`) using `@testing-library/angular` with accessible queries
   - Update E2E tests if needed

6. **Test locally**
   ```bash
   npm start
   npm test
   ```

7. **Verify before pushing**
   
   Run the same checks CI runs:
   ```bash
   npm run verify
   ```

   This ensures tests and the production build pass for normal code-changing batches.
   Documentation-only and qualifying E2E-only batches follow the verification exceptions above.
   If `verify` reports a bundle budget warning, investigate it before merging; either optimize the source of the increase or intentionally update the budget with documentation.

### Fixing a Bug

1. **Reproduce the issue**
   - Check browser console
   - Review network requests
   - Check component state

2. **Identify the cause**
   - Use Angular DevTools
   - Add console logs
   - Check RxJS observable chains

3. **Write a test** (if missing)
   - Add test case that fails
   - Fix the bug
   - Verify test passes

4. **Test the fix**
   - Manual testing
   - Run tests
   - Run E2E tests

### Code Review Checklist

- [ ] Code follows Angular style guide
- [ ] No console.log statements in production code
- [ ] Tests updated/added (Testing Library)
- [ ] `npm run verify` passes (tests + production build) for non-documentation-only changes
- [ ] No TypeScript errors
- [ ] No `any` types — run `npm run lint` to verify
- [ ] Components properly typed
- [ ] RxJS subscriptions properly cleaned up
- [ ] Material components used correctly
- [ ] Responsive design maintained
- [ ] Accessibility verified (keyboard, focus, labels; no focus in collapsed content)
- [ ] Documentation updated when changes affect usage/behavior or project standards

## Debugging Tips

### Common Issues

1. **API not responding**
   - Ensure backend is running
   - Check network tab
   - Verify API endpoint URL

2. **Component not updating**
   - Check change detection
   - Verify observable subscriptions
   - Use async pipe when possible

3. **TypeScript errors**
   - Run `npm run build` to see all errors
   - Check type definitions
   - Verify imports

4. **Test failures**
   - Check test setup/teardown
   - Verify mock data
   - Check async test handling

### Browser DevTools

- **Angular DevTools**: Chrome/Edge extension for Angular debugging
- **Console**: Check for runtime errors
- **Network**: Monitor API calls
- **Sources**: Set breakpoints

### VSCode Debugging

Configuration in `.vscode/launch.json`:
- Attach to Chrome
- Debug unit tests
- Debug E2E tests

## Performance Optimization

### During Development

- Use Angular DevTools Profiler
- Monitor bundle size: `npm run build -- --stats-json`
- Check for memory leaks (unsubscribed observables)
- Optimize change detection

### Build Optimization

- Production builds automatically optimize
- Use `--optimization` flag for custom builds
- Analyze bundle: `webpack-bundle-analyzer`

## Git Workflow

See `AGENTS.md` and `CLAUDE.md` for the authoritative workflow.

That includes:

- branch expectations
- required user review pause before final verify
- when `npm run verify` is required
- docs-only and E2E-only exceptions
- commit and PR-note expectations

## Helpful Resources

- [Angular Documentation](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
