See `README.md` for project overview and `package.json` for available npm commands for this project.

# User Overrides
- Explicit user instructions in chat override repo workflow defaults, shared skill defaults, and related docs.

# Start Here
- Read project docs through `docs/README.md` and its subpages for accessibility, codebase structure, coding standards, component guidance, development workflow, project overview, requirements, testing, roadmap, and styling.
- Use project-local skills from `.agents/skills/` when their trigger matches the task.
- Use the installed `angular-developer` skill and official Angular docs for generic Angular guidance only.
- If repo docs conflict with generic Angular guidance, follow the repo docs for this project.
- If local docs drift into generic Angular tutorial material, trim them back to repo-specific rules instead of expanding them.

# Shared Skills
- Use `$project-documentation` when updating `README.md`, `docs/**`, contributor guidance, or other repository documentation.
- Use `$git-pr-workflow` for the standard branch, review, final-verify, commit, push, and PR-notes flow.
- Use `intelligence-testing` for new tasks that touch testing or behavior protection.
- Use `api-contract-sync` when backend contracts, OpenAPI, generated API types, fixtures, or consumer assumptions may drift.
- Use `local-first-verification` when choosing the right local verification depth.
- Use `browser-ui-verification` for web UI work with real browser, layout, theme, responsive, or interaction risk.
- Use `accessibility-first-ui` for UI work that affects semantics, focus, labels, status messaging, or contrast.

# Documentation Rules
- Update `README.md` and files under `docs/` when task changes affect behavior, workflow, commands, testing, or contributor guidance.
- If documentation includes clearly bad decisions, challenge them and propose better alternatives. User decides whether to apply changes.

# Repo-Specific Workflow Overrides
- In every task, include a user review phase before final verify. After implementation, pause and hand the work to the user for review before running the final `npm run verify` or creating a commit.
- Do not run the final verification gate and do not commit until the user has explicitly accepted the current review batch.
- Documentation-only batches may skip `npm run verify` when the touched files are limited to docs or workflow text such as `README.md`, `docs/**`, or `AGENTS.md` and no code, fixtures, configs, or generated artifacts changed.
- E2E-only batches may skip `npm run verify` when the touched files are limited to `e2e/**` and optional docs/workflow text, no app/runtime/config/generated artifacts changed, and the relevant Playwright coverage for the batch has been run and reported.
- Before any accepted batch that can affect the `npm run verify` result, the final gate must be `npm run verify`. Targeted tests are not a substitute for the full verification gate.
- After a verified commit, if no further implementation work is queued, provide copy-pasteable PR notes in a code block unless the user explicitly says they do not want them.
- If PR notes are intentionally omitted because the branch is clearly not PR-ready, say that explicitly.
- For planning-heavy tasks, save the approved plan first under `docs/plans/` using a dated filename before implementation starts. Plans in `docs/plans/` are intentionally gitignored local working files and must not be committed unless the user explicitly asks for that.
- For an approved multi-batch plan, treat all batches as part of the same task until the user declares the plan complete or redirects to a different task.
- If a proposed change would alter user-visible application behavior or semantics, stop and confirm with the user before implementing it.

# Styling And Theming Rules
- Read `docs/styling-guide.md` before changing shared styles, theme tokens, or Material overrides.
- Default to component-local SCSS for feature styling.
- If multiple components share the same shell or layout pattern, prefer a shared Sass mixin under `src/app/shared/styles/` before adding another copy.
- Use `src/styles/` only for truly global styles, overlay DOM, shared DOM-targeted shells, or Angular Material or MDC overrides that cannot live in component styles.
- Prefer `--mat-sys-*` tokens first. Add `--app-*` semantic tokens only when the same styling role repeats across multiple consumers.
- Avoid introducing new raw color literals in component SCSS when a Material token or app token should own the value.
- `!important`, MDC-internal selectors, and similar override-heavy rules are acceptable only when narrowly scoped and justified by Angular Material or overlay behavior.
- New graph work should use shared theme or app chart colors instead of embedding a fresh hard-coded palette per component.
- For UI styling work, validate light mode, dark mode, and relevant responsive widths before review.

# Browser Automation Rules
- For manual browser automation and visual inspection, prefer the device-wide `agent-browser` CLI over old Playwright MCP usage.
- Use `agent-browser` only when the task includes real theming or styling risk that benefits from browser inspection.
- Do not use `agent-browser` for routine non-visual changes that do not meaningfully affect rendering.
- If using `agent-browser` during a task, close the browser after you are done with it.

# Playwright Rules
- For local `npm run e2e` or other local Playwright test runs, prefer running outside the sandbox. In this repo the sandboxed path is not reliable for the Playwright web server or browser flow.
- Keep Playwright focused on automated E2E and perf-audit coverage; do not route ad hoc manual browser inspection through Playwright anymore.
- If a real `CI=true` Playwright run is needed locally and `http://localhost:4200` is already occupied by the user's frontend session, ask the user to stop that server before continuing.
- For local Playwright E2E runs, the user controls the backend on `localhost:3000`. If it is not running, ask the user to start it instead of switching to CI-mode mocking as a workaround.
