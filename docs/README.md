# Project Documentation

These docs are intentionally project-specific.

Use the project-local skills in `.agents/skills/` when they match the task. In particular, start testing-related work with `intelligence-testing`, use `api-contract-sync` for contract drift, `local-first-verification` for local check depth, `browser-ui-verification` for browser-risk UI work, and `accessibility-first-ui` for accessible UI implementation. Use `angular-developer` and official Angular docs only for generic framework guidance.

Use the docs in this directory for this repo's architecture, workflow, testing rules, accessibility requirements, and deliberate overrides of generic Angular guidance.

If a local doc conflicts with generic Angular guidance, follow the local doc for work in this repo.

## Start Here

- [Project Overview](./project-overview.md) - What the app does and how the main route/shell split works
- [Development Guide](./development-guide.md) - Local setup, commands, browser/testing workflow, and operational notes
- [Project Testing](./project-testing.md) - Repo-specific testing strategy and rules
- [Accessibility](./accessibility.md) - Non-negotiable keyboard/focus/ARIA patterns for this app
- [Project Requirements & Standards](./project-requirements.md) - Quality gates and local exceptions

## Reference Guides

- [Codebase Structure](./codebase-structure.md) - Durable repo layout and where to look first
- [Component Guide](./component-guide.md) - Project-specific component boundaries and shared UI patterns
- [Service Guide](./service-guide.md) - Service responsibilities and data-flow notes
- [Coding Standards](./coding-standards.md) - Repo-specific coding conventions and overrides
- [Styling Guide](./styling-guide.md) - Style ownership, theming, shared Sass patterns, and Material override rules
- [Roadmap](./roadmap.md) - High-level future work

## Documentation Philosophy

- Prefer durable project decisions over generic Angular tutorials
- Document only the repo-specific parts that contributors and agents are likely to get wrong without local context
- When a repo rule intentionally overrides generic Angular guidance, document that override in the most specific relevant guide
- Use the real code as the source of truth for exact component/service APIs when signatures move faster than docs
- Keep `docs/plans/` as local gitignored working memory for approved plans, not as committed product documentation

## Installed Skills

- `intelligence-testing`: starting point for tasks that add or change tests or rely on behavior-first TDD.
- `api-contract-sync`: use when backend contracts, generated types, fixtures, or consumer assumptions might drift.
- `local-first-verification`: use to choose the cheapest honest local verification path before review or commit.
- `browser-ui-verification`: use for web UI changes with real browser, theme, responsive, or interaction risk.
- `accessibility-first-ui`: use for UI work where semantics, focus, labels, contrast, and state announcements matter from the start.
