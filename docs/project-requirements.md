# Project Requirements & Standards

This file defines repo-local quality gates and deliberate overrides.

Use the installed `angular-developer` skill and official Angular docs for generic Angular guidance. Use this file for the requirements that are specific to this project and its workflow.

## Non-Negotiable Requirements

### Accessibility Is Mandatory

- Every feature must be usable with keyboard only
- Focus must be visible and predictable
- Hidden or collapsed UI must not receive focus
- Interactive controls must have meaningful labels

See `docs/accessibility.md`.

### Dark Mode Must Not Regress

- Every UI, styling, layout, color, or surface change must be checked in both light mode and dark mode before review
- Do not treat dark mode verification as optional polish

### Tested Changes Are Required

- New or changed behavior must be covered by tests
- Aim for full coverage of touched logic, including edge and error cases
- Prefer removing dead logic over writing tests for impossible states

## Quality Gates

### Default Verification Gate

For non-documentation-only batches, run the same command CI enforces:

```bash
npm run verify
```

That runs linting, coverage-enabled tests, and the production build.

### Documentation-Only Batches

Documentation-only batches may skip `npm run verify` when the touched files are limited to docs/workflow text such as:

- `README.md`
- `docs/**`
- `AGENTS.md`
- `CLAUDE.md`

and no code, fixtures, configs, or generated artifacts changed.

### E2E-Only Batches

E2E-only batches may skip `npm run verify` when the touched files are limited to:

- `e2e/**`
- optional docs/workflow text

and no app/runtime/config/generated artifacts changed, while the relevant Playwright coverage for the batch has been run and reported.

### Coverage Thresholds

`npm run verify` enforces minimum coverage of:

- 93% statements
- 85% branches
- 94% functions
- 95% lines

The gate is configured in `angular.json`.

### Bundle Budget Warnings Must Be Reviewed

Budget warnings are not background noise.

When `npm run build` or `npm run verify` reports a bundle/style budget warning:

1. Identify what grew
2. Decide whether the growth is accidental or intentional
3. Prefer optimization before raising budgets
4. Update docs if a budget threshold changes intentionally

## Repo-Specific Testing Rules

These rules override generic Angular examples when they conflict.

- Behavior/UI tests use Testing Library with accessible queries
- Focused service/platform tests may use Angular `TestBed` directly
- E2E uses Playwright, not Cypress
- UI tests mock only approved external/platform boundaries such as `ApiService`, `ViewportService`, and `PwaUpdateService`
- Do not add `data-testid` or `data-cy` attributes just to support routine testing

See `docs/project-testing.md` for the full testing workflow.

## Repo-Specific Workflow Reminders

- Planning-heavy work should save the approved plan under local gitignored `docs/plans/YYYY-MM-DD-*.md` before implementation starts
- Follow `AGENTS.md` and `CLAUDE.md` for branch, review, verify, and commit workflow
- Update docs when behavior, scripts/workflows, or project standards change

## Known Local Exceptions

### Node 24 npm Warning

If you see:

```text
npm WARN npm npm does not support Node.js v24.x
```

you can ignore it for this project as long as scripts still succeed. The repo intentionally targets Node 24.x.

### Never Add `"type": "module"` To `package.json`

Do not add `"type": "module"` to `package.json`. It breaks the Vercel API proxy in this repo.

If a config file needs ESM, rename the config file to `.mjs` instead of changing the package type.
