See @README for project overview and @package.json for available npm commands for this project.

# Project documentation
- Learn accessibility, codebase structure, coding standards, component guide, development guide, project overview, project requirement, project testing and roadmap @docs/README.md and it's subpages.

Update @README and @docs/* after every task if needed.

If documentation includes clearly bad decisions, challenge them and propose better alternatives. User decides whether to apply changes.

Always ask explicitly (with explanation) whether to use git worktree instead of a user-created branch before the first mutating step of a new implementation task or approved plan. Do not ask again between batches, review rounds, verify runs, or commits within the same plan unless the user asks to revisit the workflow or circumstances materially change.

For planning-heavy tasks, save the approved plan first under @docs/plans/ using a dated filename before implementation starts.

For an approved multi-batch plan, treat all batches as part of the same task until the user declares the plan complete or redirects to a different task.

If a proposed change would alter user-visible application behavior or semantics, stop and confirm with the user before implementing it. Do not make behavior-changing production edits based only on inference from a plan or coverage goal.

In every task, include a user review phase before final verify. After review is accepted and verify passes, you can commit. After each user-accepted and verified batch, you may commit if useful as a checkpoint. Offer PR notes as a copy-pasteable code block only when the branch is fully implemented and ready for PR; user will handle the rest.