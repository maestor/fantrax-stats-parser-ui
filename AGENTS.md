# Agent Instructions

This is the sole agent initialization entrypoint. Load supporting docs and skills on demand; do not add tool-specific instruction mirrors.

Explicit user instructions override repository and skill defaults.

## Read on demand

- Start with [README.md](README.md) and the task map in [docs/README.md](docs/README.md). Read only relevant topic guides and source; do not load the whole documentation tree.
- Consult [package.json](package.json) for commands. Code/config owns exact APIs, dependency versions, coverage thresholds, and build budgets.
- Use matching project-local skills under `.agents/skills/`: `project-documentation` for docs; `git-pr-workflow` for delivery; `intelligence-testing` for behavior protection; `api-contract-sync` for contracts/types/fixtures; `local-first-verification` for checks; `browser-ui-verification` for browser risk; `accessibility-first-ui` for semantics/focus/labels/contrast.
- Use `angular-developer` and official Angular docs for generic Angular guidance; project rules take precedence. Load skill references only as needed.

## Delivery

- Work on a non-main branch; follow `git-pr-workflow` for branch creation, commit style, push, and PR notes. The user creates the PR.
- Implement and run relevant iterative checks, then pause for user review. Do not run final `npm run verify` or commit until the user explicitly accepts the current batch.
- After acceptance, `npm run verify` is required for any batch that can affect its result; targeted checks do not replace it.
- Docs/workflow-text-only batches may skip verify if no code, fixtures, configs, or generated artifacts changed.
- E2E-only batches (`e2e/**` plus optional docs) may skip verify if no app/runtime/config/generated artifacts changed and relevant Playwright coverage ran and was reported.
- After an accepted, verified commit, provide copy-pasteable PR notes unless the user declines or more work is queued. State explicitly when the branch is not PR-ready.
- Save approved plans for planning-heavy work to gitignored `docs/plans/YYYY-MM-DD-*.md` before implementation; do not commit them unless requested. Continue all approved batches until the user declares completion or redirects.
- Confirm proposed user-visible behavior or semantic changes before implementation unless already explicitly authorized.

## Task-specific rules

- UI work must preserve keyboard access, visible/predictable focus, meaningful labels, and non-focusable hidden content. Read [accessibility](docs/accessibility.md) for affected interaction patterns.
- For styling, read [styling](docs/styling.md) before editing; check light/dark mode and relevant responsive widths before review.
- For tests, read [testing](docs/testing.md), including local resource limits, backend ownership, and CI fixture rules.

## Documentation maintenance

Update only the canonical topic when behavior, workflow, commands, or standards change; link to it elsewhere. Keep project-specific decisions and operational exceptions; omit generic tutorials, mirrored APIs, test counts, and historical implementation narration. Challenge weak decisions for user review.

Use lowercase kebab-case topic filenames; preserve conventional `README.md`, `AGENTS.md`, and `SKILL.md` entrypoints. Never read, search, or check `docs/researches/**` unless the user points to a specific document or another document explicitly instructs reading that specific research file. A folder/index link alone is not permission. Load local plans only when needed for the active approved task.
