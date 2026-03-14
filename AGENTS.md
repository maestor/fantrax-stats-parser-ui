See `README.md` for project overview and `package.json` for available npm commands for this project.

# Project documentation
- Read accessibility, codebase structure, coding standards, component guide, development guide, project overview, project requirements, project testing, and roadmap docs via `docs/README.md` and its subpages.

Update `README.md` and files under `docs/` after every task when needed.

If documentation includes clearly bad decisions, challenge them and propose better alternatives. User decides whether to apply changes.

## Git Workflow Rules
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
  5. After the user explicitly accepts the batch, run `npm run verify` unless the accepted batch is documentation-only and cannot affect the verification result.
  6. If `verify` fails, fix the issues, rerun the necessary checks, and keep going until `verify` passes.
  7. After `verify` passes, or immediately for documentation-only batches where verify is intentionally skipped, commit when the user has asked for or approved a commit.
- After each user-accepted and verified batch, you may commit if useful as a checkpoint.
- Documentation-only batches may skip `npm run verify` when the touched files are limited to docs/workflow text such as `README.md`, `docs/**`, or `AGENTS.md` and no code, fixtures, configs, or generated artifacts changed.
- After a verified commit, if no further implementation work is queued in the task, automatically provide copy-pasteable PR notes in a code block unless the user explicitly says they do not want them.
- If PR notes are intentionally omitted because the branch is clearly not PR-ready, say that explicitly instead of silently stopping after the commit.
- Before any non-documentation-only commit, `npm run verify` must pass. Targeted tests are not a substitute for the full verification gate.
- Commit message prefixes should use capitalized conventional labels.
- New features must use the prefix `Feature: `.
- Non-feature commits should use a capitalized prefix such as `Fix:`, `Docs:`, `Chore:`, etc.
- Use sentence-style capitalization after the colon: capitalize the first word, but do not title-case the whole message unless normal capitalization requires it. Example: `Feature: Add career player and goalie listings`.

For planning-heavy tasks, save the approved plan first under `docs/plans/` using a dated filename before implementation starts. Plans in `docs/plans/` are intentionally gitignored local working files and must not be committed unless the user explicitly asks for that.

For an approved multi-batch plan, treat all batches as part of the same task until the user declares the plan complete or redirects to a different task.

If a proposed change would alter user-visible application behavior or semantics, stop and confirm with the user before implementing it. Do not make behavior-changing production edits based only on inference from a plan or coverage goal.

If using Playwright MCP during a task, close the browser after you are done with it and no longer need it. Do not leave Playwright browser sessions open across unrelated steps or future sessions.

For local Playwright E2E runs, the user controls the backend on `localhost:3000`. If it is not running, ask the user to start it instead of switching to CI-mode mocking as a workaround.
