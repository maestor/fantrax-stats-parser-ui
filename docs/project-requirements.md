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
  - >= 95% statements
  - >= 95% lines
  - >= 95% functions
  - >= 85% branches
- **Long-term target**:
  - 100% statements, lines, and functions
  - >= 90% branches
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
| Statements | >= 95%                 | 100%             |
| Lines      | >= 95%                 | 100%             |
| Functions  | >= 95%                 | 100%             |
| Branches   | >= 85%                 | >= 90%           |

#### Coverage Enforcement

- Unit-test coverage must remain above the enforced coverage gate.
- Long-term target is 100% statements/lines/functions and >=90% branches.
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

#### ❌ DON'T

- Use `setTimeout` in tests (use `fakeAsync` + `tick` instead)
- Test Angular framework internals (like change detection)
- Forget to provide dependencies in test configuration
- Skip cleanup in `afterEach`
- Write tests that depend on execution order
- Use production services in tests (use mocks)

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

### Before Committing

```bash
npm test -- --browsers=ChromeHeadless --watch=false  # Full test run
npm run build                                         # Verify build
# All must pass before commit
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

- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] App serves without errors (`npm start`)
- [ ] New features have tests
- [ ] Test coverage meets gate (>=95% statements/lines/functions, >=85% branches)
- [ ] No TypeScript errors
- [ ] Code follows project structure
- [ ] Documentation updated
- [ ] Commit message follows format

---

**Last Verified**: January 23, 2026
**Status**: All requirements (including coverage gate) passing ✅
