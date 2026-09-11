# Development Docs

Read only the row matching the task; follow further links when needed. [AGENTS.md](../AGENTS.md) owns delivery/review rules; [README.md](../README.md) owns quick start.

| Task | Read |
| --- | --- |
| Setup, proxy/deployment, PWA, SEO, performance audit | [Development](development.md) |
| Locate code or understand route/shell boundaries | [Architecture](architecture.md) |
| Component behavior and shared UI contracts | [Components](components.md) |
| State, persistence, API/cache data flow | [Services](services.md) |
| TypeScript/Angular conventions, dates, naming | [Coding standards](coding-standards.md) |
| Tests, coverage, Playwright, fixtures, CI | [Testing](testing.md) |
| Keyboard, focus, dialogs, accessible tables | [Accessibility](accessibility.md) |
| SCSS ownership, theme tokens, Material overrides | [Styling](styling.md) |
| Explicit feature planning | [Roadmap](roadmap.md) |

The sibling [API docs](../../node-fantrax-stats-parser/docs/README.md) own backend operations and contract maintenance. Approved plans in `docs/plans/` are gitignored working memory; load only the relevant plan when resuming it. Never read or check `docs/researches/**` unless the user names a specific file or a document explicitly directs reading that file; a general folder link does not qualify.

Keep one authoritative home per rule. Use relative links and lowercase kebab-case topic filenames; reserve `README.md` for indexes. Prefer source/config links over copied signatures, version tables, or exhaustive file inventories. Installed skills supply generic workflows; load only matching skills and needed references.
