# Project Requirements & Standards

**Project**: Fantrax Stats Parser UI
**Last Updated**: January 23, 2026

---

## 🎯 Core Requirements

### Accessibility Is Mandatory

Accessibility is a primary requirement for this project.

- All features must be usable with keyboard only
- Focus must be visible and predictable
- Hidden/collapsed UI must not receive focus
- Interactive controls must be properly labeled (visible label or `aria-label`)

See: `docs/accessibility.md`

### Mandatory Quality Gates

Before any code can be committed or deployed, ALL of the following must pass:

**Primary command (recommended)**

Run the same command CI runs (headless unit tests + production build):

```bash
npm run verify
```

#### 1. ✅ Tests Must Pass

```bash
npm test -- --browsers=ChromeHeadlessNoSandbox --watch=false
```

- **Requirement**: 100% of tests must pass
- **Current**: 100% pass rate (200+ tests)
- **Action on Failure**: Fix the failing test or update it if code changed
- **Exception**: None (don’t merge flaky tests; fix them)

#### 2. ✅ Build Must Succeed

```bash
npm run build
```

- **Requirement**: Build must complete without TypeScript errors
- **Current**: ✅ Passing (warnings about bundle size are acceptable)
- **Action on Failure**: Fix TypeScript errors in output

#### 3. ✅ Application Must Serve

```bash
npm start
```

- **Requirement**: Development server must start without errors
- **Current**: ✅ Passing
- **Action on Failure**: Check for missing dependencies or circular imports

#### 4. ✅ Coverage Must Meet Targets

```bash
npm run test:coverage
```

- **Scope**: Application implementation under `src/` (test files excluded)
- **Coverage gate (enforced by tooling)**:
  - >= 98% statements
  - >= 98% lines
  - >= 98% functions
  - >= 96% branches
- **Long-term target**:
  - 100% statements, lines, functions, and branches
- **Action on Failure**: Add/update tests or refactor/simplify code until targets are met
- **Prefer**: Remove unused/dead code rather than writing tests solely to “cover” it
- **Contribution rule (required)**: every new/changed code path must be covered by tests (aim 100% coverage for the code you touched, including error/edge cases)
- **Exception**: None for uncovered new/changed logic

#### 5. ✅ Accessibility Must Not Regress

- **Requirement**: Every change must preserve (or improve) keyboard and screen-reader usability
- **Minimum checks (manual)**:
  - Can you reach and operate the feature with `Tab`, arrow keys (where applicable), and `Enter`/`Space`?
  - Is focus always visible?
  - Does focus avoid collapsed/hidden areas?
  - Are labels/announcements meaningful?
- **Action on Failure**: Fix before merging

---

## 🧪 Testing Standards

### Test Coverage Requirements

Coverage is enforced by tooling (Karma coverage check) and must meet the gate.

| Metric     | Enforced Coverage Gate | Long-term Target |
| ---------- | ---------------------- | ---------------- |
| Statements | >= 98%                 | 100%             |
| Lines      | >= 98%                 | 100%             |
| Functions  | >= 98%                 | 100%             |
| Branches   | >= 96%                 | 100%             |

#### Coverage Enforcement

- Unit-test coverage must remain above the enforced coverage gate.
- Long-term target is 100% statements/lines/functions/branches.
- New/changed logic must be fully tested (aim 100% coverage for the code you touched, including error/edge cases).
- Don’t merge changes that add uncovered new behavior.

### Testing Best Practices

#### ✅ DO

- Use `fakeAsync` and `tick()` for async tests
- Mock all external dependencies
- Clean up subscriptions in `afterEach`
- Test business logic, not framework internals
- Use descriptive test names
- Test edge cases and error scenarios
- Keep tests isolated and independent
- Use `@testing-library/angular` for new feature tests (`*.behavior.spec.ts`)
- Use accessible queries (`getByRole`, `getByText`, `getByLabelText`) in behavior tests
- Render translation keys directly with `TranslateModule.forRoot()` instead of loading locale files

#### ❌ DON'T

- Use `setTimeout` in tests (use `fakeAsync` + `tick` instead)
- Test Angular framework internals (like change detection)
- Forget to provide dependencies in test configuration
- Skip cleanup in `afterEach`
- Write tests that depend on execution order
- Use production services in tests (use mocks)
- Write new unit tests for features (use behavior tests with `@testing-library/angular` instead)
- Use CSS selectors or class names in behavior tests (use accessible queries)
- Load real translation files in behavior tests (use `TranslateModule.forRoot()` with translation keys)

### Test File Structure

```typescript
describe("ComponentName", () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName, RequiredModules],
      providers: [RequiredServices],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Clean up
  });

  describe("feature name", () => {
    it("should do something specific", fakeAsync(() => {
      // Arrange
      // Act
      tick();
      // Assert
    }));
  });
});
```

---

## ⚠️ Known Issues & Exceptions

### npm Warning About Node 24

If you see a warning like:

```text
npm WARN npm npm does not support Node.js v24.x
```

You can ignore it for this project.

- The project is intended to run on **Node.js 24.x** (see `package.json` `engines`).
- The warning is emitted by npm and does not indicate a project incompatibility.
- Treat only errors that stop scripts (non-zero exit codes) as blockers.

### Headless Karma Infrastructure

Sometimes Chrome headless launch can fail due to local environment issues (not the tests themselves).

**Protocol**:

1. Re-run `npm run verify`
2. If it still fails, run `npm ci` and retry
3. If it still fails, treat it as a blocker and fix the root cause (don’t merge)

### Build Warnings (Acceptable)

- **Bundle size warning**: "bundle initial exceeded maximum budget"
  - This is a performance suggestion, not a blocker
  - Can be ignored or addressed by code splitting later

### ❌ Never Add `"type": "module"` to package.json

**Do not add `"type": "module"` to `package.json`.** This will break the Vercel API proxy and cannot be typed around.

**Background:** This was added once because `eslint.config.js` uses CommonJS syntax and the ESLint CLI warned about it. The warning is harmless — the real fix is to use the `.mjs` extension for config files that trigger it.

**Correct solution when a config file causes a "module type" warning:**

- Rename the config to use `.mjs` (e.g., `eslint.config.js` → `eslint.config.mjs`)
- The `.mjs` extension explicitly marks it as ESM, silencing the warning without touching `package.json`

**Never do:**
```diff
- "type": "module"  // breaks Vercel API proxy
```

**Do instead:**
```bash
mv eslint.config.js eslint.config.mjs   # or whichever config is affected
```

---

## 🔧 TypeScript Standards

### Strict Mode Requirements

```json
{
  "strict": true,
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "noUnusedParameters": true,
  "noUnusedLocals": true
}
```

All code must pass these strict TypeScript checks.

### Path Aliases

Use these aliases for imports:

- `@base/*` → `./src/app/base/*`
- `@services/*` → `./src/app/services/*`
- `@shared/*` → `./src/app/shared/*`

Example:

```typescript
import { ApiService } from "@services/api.service";
import { NavigationComponent } from "@base/navigation/navigation.component";
```

---

## 📁 Project Structure Standards

### Directory Organization

```
src/app/
├── base/              # Framework components (nav, footer)
│   └── [component]/
│       ├── component.ts
│       ├── component.html
│       ├── component.scss
│       └── component.spec.ts
├── services/          # Business logic services
│   ├── tests/        # Service tests
│   └── [service].service.ts
├── shared/           # Reusable components
│   └── [component]/
└── [feature]/        # Feature modules (player-stats, etc.)
```

### File Naming

- Components: `kebab-case.component.ts`
- Services: `kebab-case.service.ts`
- Tests: `kebab-case.spec.ts`
- Types: `PascalCase`

---

## 🚀 Development Workflow

### Before Starting Work

```bash
git pull origin main
npm install  # If package.json changed
npm test     # Ensure clean state
```

### During Development

```bash
npm start    # Development server
npm test     # Run tests in watch mode
```

### Before Writing Tests

For UI/visual features, ask the user to review the implementation on `localhost:4200` before writing or updating unit tests. This avoids extra fix-test iteration cycles when the user requests adjustments to the visual result.

### Before Committing

```bash
npm run verify  # Runs tests (headless), coverage check, and production build — single command, don't run these separately
```

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `style`, `chore`

Example:

```
feat(player-stats): add per-game stats toggle

- Added MatSlideToggle component
- Integrated with FilterService
- Added 15 comprehensive tests

Closes #123
```

---

## 📚 Documentation Requirements

### Code Documentation

- **Services**: JSDoc comments for public methods
- **Components**: Input/Output descriptions
- **Complex Logic**: Inline comments explaining "why", not "what"

### Test Documentation

- Test names must clearly describe what is being tested
- Use `describe` blocks to group related tests
- Add comments for non-obvious test setup

Example:

```typescript
describe("getPlayerStatsPerGame", () => {
  it("should calculate per-game stats for single player", () => {
    // Test validates division by games and rounding to 2 decimals
    const result = service.getPlayerStatsPerGame(players);
    expect(result[0].goals).toBe(1.0); // 82 goals / 82 games
  });
});
```

---

## 🔄 Error Recovery Procedures

### When Tests Fail

1. **Identify the failure type**:

   - Flaky test? → Re-run, check known flaky list
   - New test? → Fix the test
   - Existing test? → Code change broke it, fix code or update test

2. **Debug process**:

   ```bash
   # Run specific test file
   npm test -- --include='**/failing-test.spec.ts'

   # Add console.log statements
   # Use Chrome DevTools (remove --browsers flag)
   npm test -- --include='**/failing-test.spec.ts' --browsers=Chrome
   ```

3. **Fix and verify**:
   ```bash
   # After fix, run full suite
   npm test -- --browsers=ChromeHeadless --watch=false
   ```

### When Build Fails

1. **Read TypeScript errors carefully**
2. **Common issues**:

   - Missing import
   - Type mismatch
   - Missing dependency in providers array
   - Circular dependency

3. **Fix process**:

   ```bash
   # Run build to see all errors
   npm run build

   # Fix errors one by one
   # Re-run build until clean
   ```

### When Serve Fails

1. **Check console output** for error messages
2. **Common issues**:

   - Port 4200 already in use
   - Missing dependencies
   - Circular imports
   - Translation files missing

3. **Fix process**:

   ```bash
   # Kill existing process on port 4200
   lsof -ti:4200 | xargs kill -9

   # Clear node_modules if dependency issues
   rm -rf node_modules package-lock.json
   npm install

   # Try again
   npm start
   ```

---

## 📖 Reference Documentation

- **Testing Guide**: [project-testing.md](./project-testing.md)
- **Project README**: [README.md](../README.md)

---

## ✅ Quality Checklist

Before marking work complete, verify:

- [ ] Build and test coverage succeeds (`npm run verify`)
- [ ] App serves without errors (`npm start`)
- [ ] New features have tests
- [ ] Test coverage meets gate (>=98% statements/lines/functions, >=96% branches)
- [ ] No TypeScript errors
- [ ] Code follows project structure
- [ ] Documentation updated (README, related docs/*.md)
- [ ] Commit message follows format
- [ ] New user-facing features have E2E tests (Playwright)

---

**Last Verified**: January 23, 2026
**Status**: All requirements (including coverage gate) passing ✅
