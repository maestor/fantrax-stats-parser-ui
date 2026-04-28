See @README for project overview and @package.json for available npm commands for this project.

Keep this file aligned with `AGENTS.md`; if wording diverges, treat `AGENTS.md` as the canonical repo workflow description.

# User Overrides
- Explicit user instructions in chat override the repo workflow defaults in this file and related docs.
- If the user tells you to skip, delay, or reorder a normal repo step such as review pause, `npm run verify`, or commit timing, follow the user's instruction.
- Treat repo workflow rules as defaults for cases where the user has not said otherwise.

# Project documentation
- Read accessibility, codebase structure, coding standards, component guide, development guide, project overview, project requirements, project testing, roadmap, and styling guide docs via @docs/README.md and its subpages.
- Use the project-local skills in `.agents/skills/` when their trigger matches the task.
- Use `intelligence-testing` as the starting point for new tasks that touch testing or behavior protection. Apply the repo's testing rules first, then use the skill's behavior-first TDD lens.
- Use `api-contract-sync` when backend contracts, OpenAPI, generated API types, fixtures, or consumer assumptions may drift.
- Use `local-first-verification` when choosing the right local verification depth before handoff, review, or commit.
- Use `browser-ui-verification` for web UI work with real browser, layout, theme, responsive, or interaction risk.
- Use `accessibility-first-ui` for UI work that affects semantics, focus, labels, status messaging, or contrast.
- Use the installed `angular-developer` skill and official Angular docs for generic Angular guidance only.
- Use repo docs for project-specific workflow, architecture, testing, accessibility, routing/shell structure, and deliberate overrides.
- If repo docs conflict with generic Angular guidance, follow the repo docs for this project.
- When a local doc drifts into generic Angular tutorial material, trim it back to the repo-specific rule instead of expanding it further.

Update @README and @docs/* after every task when needed.

If documentation includes clearly bad decisions, challenge them and propose better alternatives. User decides whether to apply changes.

## Git Workflow Rules
- Explicit user instructions in chat override every repo workflow rule below.
- Default workflow is a user-created branch (not `main`).
- If currently on `main`, ask user to create a branch before implementing task changes.
- If considering `git worktree`, always ask explicitly first and explain why worktree would help.
- In every task, include a user review phase before final verify. After implementation, pause and hand the work to the user for review before running the final `npm run verify` or creating a commit.
- Do not run the final verification gate and do not commit until the user has explicitly accepted the review phase for that batch.
- Expected batch flow:
  1. Check workspace/branch state and read the required docs first.
  2. Implement the change and run only the minimum iterative checks needed while working.
  3. Pause for user review before final verify.
  4. If review feedback comes in, iterate on that feedback and return to the review pause when needed.
  5. After the user explicitly accepts the batch, run `npm run verify` unless the accepted batch is documentation-only or E2E-only and cannot affect the verification result.
  6. If `verify` fails, fix the issues, rerun the necessary checks, and keep going until `verify` passes.
  7. After `verify` passes, or immediately for documentation-only or E2E-only batches where verify is intentionally skipped, commit by default unless the user has explicitly denied committing for that batch or asked to do something else first.
- After each user-accepted and verified batch, you may commit if useful as a checkpoint.
- Documentation-only batches may skip `npm run verify` when the touched files are limited to workflow/docs text such as `@README`, `@docs/**`, `AGENTS.md`, or `CLAUDE.md` and no code, fixtures, configs, or generated artifacts changed.
- E2E-only batches may skip `npm run verify` when the touched files are limited to `e2e/**` and optional workflow/docs text, no app/runtime/config/generated artifacts changed, and the relevant Playwright coverage for the batch has been run and reported.
- After a verified commit, if no further implementation work is queued in the task, automatically provide copy-pasteable PR notes in a code block unless the user explicitly says they do not want them.
- If PR notes are intentionally omitted because the branch is clearly not PR-ready, say that explicitly instead of silently stopping after the commit.
- Before any batch that can affect the `npm run verify` result, `npm run verify` must pass. Targeted tests are not a substitute for the full verification gate.
- Commit message prefixes should use capitalized conventional labels.
- New features must use the prefix `Feature: `.
- Non-feature commits should use a capitalized prefix such as `Fix:`, `Docs:`, `Chore:`, etc.
- Use sentence-style capitalization after the colon: capitalize the first word, but do not title-case the whole message unless normal capitalization requires it. Example: `Feature: Add career player and goalie listings`.

For planning-heavy tasks, save the approved plan first under `docs/plans/` using a dated filename before implementation starts. Plans in `docs/plans/` are intentionally gitignored local working files and must not be committed unless the user explicitly asks for that.

For an approved multi-batch plan, treat all batches as part of the same task until the user declares the plan complete or redirects to a different task.

If a proposed change would alter user-visible application behavior or semantics, stop and confirm with the user before implementing it. Do not make behavior-changing production edits based only on inference from a plan or coverage goal.

## Styling And Theming Rules
- Read `docs/styling-guide.md` before changing shared styles, theme tokens, or Material overrides.
- Default to component-local SCSS for feature styling.
- If multiple components share the same shell or layout pattern, prefer a shared Sass mixin under `src/app/shared/styles/` before adding another copy.
- Use `src/styles/` only for truly global styles, overlay DOM, shared DOM-targeted shells, or Angular Material/MDC overrides that cannot live in component styles.
- Prefer `--mat-sys-*` tokens first. Add `--app-*` semantic tokens only when the same styling role repeats across multiple consumers.
- Avoid introducing new raw color literals in component SCSS when a Material token or app token should own the value.
- `!important`, MDC-internal selectors, and similar override-heavy rules are acceptable only when narrowly scoped and justified by Angular Material or overlay behavior.
- New graph work should use shared theme/app chart colors instead of embedding a fresh hard-coded palette per component.
- For UI styling work, validate light mode, dark mode, and relevant responsive widths before review.

## Browser Automation Rules
- For manual browser automation and visual inspection that previously used Playwright MCP, prefer the device-wide `agent-browser` CLI.
- Typical workflow: `agent-browser open <url>`, `agent-browser wait --load networkidle`, `agent-browser snapshot -i`, interact via refs such as `@e2`, then `agent-browser close` when finished.
- When checking theme-sensitive UI, use explicit browser media settings such as `agent-browser --color-scheme dark open <url>` or `agent-browser set media dark`.
- Use agent-browser only when the task includes real theming or styling risk that benefits from browser inspection.
- Do not use agent-browser for routine non-visual changes that do not meaningfully affect rendering, such as pure data wiring, copy-only tweaks, or simple column-order updates.
- If using agent-browser during a task, close the browser after you are done with it and no longer need it. Do not leave sessions open across unrelated steps or future sessions.

## Playwright Rules
- For local `npm run e2e` or other local Playwright test runs, prefer running outside the sandbox. In this repo the sandboxed path is not reliable for the Playwright web server / browser flow, while the non-sandbox path works consistently better.
- Keep Playwright focused on automated E2E and perf-audit coverage; do not route ad hoc manual browser inspection through Playwright MCP anymore.
- If a real `CI=true` Playwright run is needed locally and `http://localhost:4200` is already occupied by the user's frontend session, ask the user to stop that server before continuing. Do not introduce alternate local-only fixture flags as a workaround.

For local Playwright E2E runs, the user controls the backend on `localhost:3000`. If it is not running, ask the user to start it instead of switching to CI-mode mocking as a workaround.
