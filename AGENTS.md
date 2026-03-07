See `README.md` for project overview and `package.json` for available npm commands for this project.

# Project documentation
- Read accessibility, codebase structure, coding standards, component guide, development guide, project overview, project requirements, project testing, and roadmap docs via `docs/README.md` and its subpages.

Update `README.md` and files under `docs/` after every task when needed.

If documentation includes clearly bad decisions, challenge them and propose better alternatives. User decides whether to apply changes.

Always ask explicitly (with explanation) whether to use git worktree instead of a user-created branch before the first mutating step of a new implementation task or approved plan. Do not ask again between batches, review rounds, verify runs, or commits within the same plan unless the user asks to revisit the workflow or circumstances materially change.

For planning-heavy tasks, save the approved plan first under `docs/plans/` using a dated filename before implementation starts.

For an approved multi-batch plan, treat all batches as part of the same task until the user declares the plan complete or redirects to a different task.

In every task, include a user review phase before final verify. After review is accepted and verify passes, you can commit. After each user-accepted and verified batch, you may commit if useful as a checkpoint. Offer PR notes as a copy-pasteable code block only when the branch is fully implemented and ready for PR; user will handle the rest.
