# FFHL Stats UI

Angular UI for the [FFHL Stats API](https://github.com/maestor/node-fantrax-stats-parser): player/goalie stats, comparisons and charts, career highlights, team leaderboards, finals, and draft history. Finnish UI with keyboard navigation, responsive layouts, automatic light/dark mode, and a production PWA.

[Live app](https://ffhl-stats.vercel.app/) · [Development docs](docs/README.md) · [Agent workflow](AGENTS.md)

## Quick start

Use Node.js `>=24.15 <25` and start the sibling API on `http://localhost:3000`.

```sh
npm install
npm start
```

Open `http://localhost:4200`. Development calls the API directly; production uses the Vercel proxy. See [development](docs/development.md) for configuration and deployment.

## Commands

| Command | Purpose |
| --- | --- |
| `npm start` | Dev server; live reload, HMR disabled |
| `npm test` | Vitest + Testing Library, once |
| `npm run test:watch` | Watch tests |
| `npm run e2e` | Playwright; requires local API |
| `npm run build` | Production build with prerendering |
| `npm run verify` | Lint, coverage tests, production build; after review acceptance |
| `npm run generate:types` | Generate UI types from hosted OpenAPI |

[package.json](package.json) owns the complete command and dependency lists. Read only the task-relevant guides from the [docs index](docs/README.md).
