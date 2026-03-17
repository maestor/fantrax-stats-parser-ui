See @README for project overview and @package.json for available npm commands for this project.

# Project documentation
- Learn accessibility, codebase structure, coding standards, component guide, development guide, project overview, project requirement, project testing and roadmap @docs/README.md and it's subpages.

Update @README and @docs/* after every task if needed.

If documentation includes clearly bad decisions, challenge them and propose better alternatives. User decides whether to apply changes.

## Git Workflow Rules
- Default workflow is a user-created branch (not `main`).
- If currently on `main`, ask user to create a branch before implementing task changes.
- If considering `git worktree`, always ask explicitly first and explain why worktree would help.
- In every task, include a user review phase before final verify. After implementation, pause and hand the work to the user for review before running the final `npm run verify` or creating a commit.
- Do not run the final verification gate and do not commit until the user has explicitly accepted the review phase for that batch.
- After review is accepted and `verify` passes, commit by default unless the user has explicitly denied committing for that batch or asked to do something else first.
- Documentation-only batches may skip `npm run verify` when the touched files are limited to workflow/docs text such as `@README`, `@docs/**`, `AGENTS.md`, or `CLAUDE.md` and no code, fixtures, configs, or generated artifacts changed.
- E2E-only batches may skip `npm run verify` when the touched files are limited to `e2e/**` and optional workflow/docs text, no app/runtime/config/generated artifacts changed, and the relevant Playwright coverage for the batch has been run and reported.
- Before any commit for a non-docs-only batch, `npm run verify` must pass. Targeted tests are not a substitute for the full verification gate.
- After a verified commit, offer PR notes as a copy-pasteable code block when the branch is fully implemented and ready for PR, unless the user explicitly says they do not want them.
- Commit message prefixes should use capitalized conventional labels.
- New features must use the prefix `Feature: `.
- Non-feature commits should use a capitalized prefix such as `Fix:`, `Docs:`, `Chore:`, etc.
- Use sentence-style capitalization after the colon: capitalize the first word, but do not title-case the whole message unless normal capitalization requires it. Example: `Feature: Add career player and goalie listings`.

For planning-heavy tasks, save the approved plan first under @docs/plans/ using a dated filename before implementation starts. Plans in @docs/plans/ are intentionally gitignored local working files and must not be committed unless the user explicitly asks for that.

For an approved multi-batch plan, treat all batches as part of the same task until the user declares the plan complete or redirects to a different task.

If a proposed change would alter user-visible application behavior or semantics, stop and confirm with the user before implementing it. Do not make behavior-changing production edits based only on inference from a plan or coverage goal.

## Browser Automation Rules
- For manual browser automation and visual inspection that previously used Playwright MCP, prefer the device-wide `agent-browser` CLI.
- Typical workflow: `agent-browser open <url>`, `agent-browser wait --load networkidle`, `agent-browser snapshot -i`, interact via refs such as `@e2`, then `agent-browser close` when finished.
- When checking theme-sensitive UI, use explicit browser media settings such as `agent-browser --color-scheme dark open <url>` or `agent-browser set media dark`.
- Keep Playwright focused on automated E2E coverage; use agent-browser for ad hoc browser inspection instead.
