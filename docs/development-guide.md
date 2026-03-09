# Development Guide

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
- By default, Copilot should not create git commits unless you explicitly ask for a commit.
   - This is **per task**, not “once per chat session”: earlier permission to commit does not carry forward.
   - If you want a commit, say it explicitly (e.g. “commit this change now”). If you don’t, Copilot should leave changes uncommitted.

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

- `initial`: warning at `1.2 MB`, error at `1.6 MB`
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

Key files:

- `src/theme.scss`: Angular Material theme configuration (emits `--mat-sys-*` tokens via `theme-type: color-scheme`)
- `src/styles.scss`: global styles + targeted overrides for overlays/tabs/toggles to ensure dark mode renders consistently

#### Debugging dark mode

In DevTools Console:

- Check preference: `window.matchMedia('(prefers-color-scheme: dark)').matches`
- Check a token: `getComputedStyle(document.documentElement).getPropertyValue('--mat-sys-surface')`

If the page looks like it’s using a stale/light bundle (common during theming work):

- Hard refresh: `Cmd+Shift+R`
- If still wrong under `ng serve`, restart `npm start` (browser/dev-server caching can keep older CSS around)

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

   This ensures tests and the production build pass.
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
- [ ] `npm run verify` passes (tests + production build)
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

1. Create feature branch
2. Make changes
3. Commit with descriptive messages
4. Push and create PR
5. Address review comments
6. Merge when approved

## Helpful Resources

- [Angular Documentation](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
