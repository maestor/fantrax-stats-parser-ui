# Development

[README](../README.md) covers installation; [AGENTS](../AGENTS.md) owns review/commit rules. Use [package.json](../package.json) for exact commands and engine versions.

## API and deployment

Development uses `src/environments/environment.ts` → `http://localhost:3000`. Production uses `environment.production.ts` → `/api`.

Vercel rewrites `/api/<path>` to [api/proxy.js](../api/proxy.js), which forwards allowed read endpoints via GET/OPTIONS, injects the server-side API key, strips client Authorization, and suppresses upstream Set-Cookie.

| Vercel variable | Value |
| --- | --- |
| `API_URL` | Absolute backend base URL |
| `API_KEY` | Backend secret; never put it in browser configuration |
| `ALLOWED_ORIGINS` | Comma-separated origins; wildcard supported, no paths |
| `RATE_LIMIT_MAX` | Optional per-IP limit, default 120 |
| `RATE_LIMIT_WINDOW_SEC` | Optional limit window, default 60 seconds |

Example origins: `https://ffhl-stats.vercel.app,https://ffhl-stats-*-development.vercel.app`. Redeploy after changing environment variables.

Do not add `"type": "module"` to this UI package: it breaks the Vercel proxy. Use `.mjs` for individual ESM config files. The sibling API has its own package-level ESM setup.

## API types

The sibling API's `openapi.yaml` owns the contract. `npm run generate:types` uses the pinned generator in package.json and the **hosted** `/openapi.json`, writing `src/app/services/api.types.generated.ts`. Do not hand-edit generated types. Ensure the source schema includes the intended backend change before regeneration; see [API contract maintenance](../../node-fantrax-stats-parser/docs/development.md#openapi-contract).

## Build and performance

`npm start` uses live reload with HMR disabled because of deferred blocks. `npm run build` sets its own larger Node heap and outputs to `dist/fantrax-stats-parser-ui/`.

[angular.json](../angular.json) owns bundle/style budgets. Investigate warnings: identify growth, prefer lazy-loading or removing duplicated styles, and raise a budget only when justified by product scope. Document intentional threshold changes.

`npm run perf:audit` builds and serves production output, mocks API traffic with E2E fixtures, and audits `/`, `/career/players`, `/leaderboards/regular` at desktop/mobile sizes. It reports LCP, CLS, an interaction-delay proxy, and layout-shift sources. The interaction metric is not field INP; use this for local regressions, not public-score claims. It stays outside verify.

## PWA

The service worker registers only in production. Manifest/icons: `public/manifest.webmanifest`, `public/icons/`; caching: `ngsw-config.json`.

```sh
npm run build
cd dist/fantrax-stats-parser-ui/browser
python3 -m http.server 8080
```

Open `http://localhost:8080` and inspect Application → Manifest/Service Workers. This checks the shell/installability; stats still need API connectivity. Clear site data or reinstall if cached icons/manifest remain stale. Regenerate placeholder icons with `python3 scripts/generate-pwa-icons.py`.

## SEO and prerendering

When adding/renaming a public route, update:

- `src/app/app.routes.ts`: translated `sectionKey` / `tabKey` metadata.
- `src/app/app.routes.server.ts`: prerender eligibility for fixed public routes; dynamic player/goalie cards remain client-rendered.
- `public/sitemap.xml`: crawlable routes; `public/robots.txt` for crawler policy.

`SeoService` updates metadata after navigation/language changes. `/` uses `FFHL tilastopalvelu`; other titles append translated section/tab names. `src/index.html` supplies fallback social metadata. Prerendering uses `ServerTranslateLoader` with bundled Finnish translations and skips live API requests; browser hydration fetches stats.

## Local tooling

See [testing](testing.md) for Playwright, fixtures, and local resource rules; [styling](styling.md) for light/dark validation. Node engine requirements live in package.json. An older npm's Node 24 compatibility warning is a known local exception when commands still succeed.

Project-local workflow skills are vendored from `maestor/agent-skills`; update from that source instead of copying generic guidance into these docs.
