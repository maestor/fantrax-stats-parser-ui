import { Page } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const FIXTURES_DIR = resolve('e2e/fixtures/data');

/** In-memory cache for loaded fixture files */
const fixtureCache = new Map<string, string>();

/**
 * Convert an API URL to the matching fixture filename.
 *
 * Handles both dev (`http://localhost:3000/teams`) and production (`/api/teams`) API URLs.
 *
 * Examples:
 *   /teams                                → teams.json
 *   /api/teams                            → teams.json
 *   /seasons/regular?teamId=16            → seasons--regular--teamId=16.json
 *   /players/combined/regular?startFrom=2020&teamId=16
 *     → players--combined--regular--startFrom=2020--teamId=16.json
 */
function urlToFixtureName(url: URL): string {
  // Strip leading slash and /api/ prefix (production builds use /api/*)
  let name = url.pathname.replace(/^\/(?:api\/)?/, '').replace(/\//g, '--');

  // Append sorted query params
  const params = [...url.searchParams.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  for (const [key, value] of params) {
    name += `--${key}=${value}`;
  }

  return `${name}.json`;
}

/** Load a fixture file by name, returning the JSON string or null if not found */
function loadFixture(filename: string): string | null {
  const cached = fixtureCache.get(filename);
  if (cached !== undefined) return cached;

  const filePath = resolve(FIXTURES_DIR, filename);
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, 'utf-8');
  fixtureCache.set(filename, content);
  return content;
}

/** Route handler that maps requests to fixture files */
function handleRoute(route: Parameters<Parameters<Page['route']>[1]>[0]): Promise<void> {
  const url = new URL(route.request().url());
  const filename = urlToFixtureName(url);
  const body = loadFixture(filename);

  if (body === null) {
    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ error: `No fixture: ${filename}` }),
    });
  }

  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body,
  });
}

/**
 * Set up API route mocking on the given page.
 * Intercepts requests to both dev (localhost:3000) and production (/api/) backends.
 */
export async function setupApiMocks(page: Page): Promise<void> {
  // Dev: http://localhost:3000/**
  await page.route('http://localhost:3000/**', handleRoute);
  // Production build: /api/** (relative URL served from same origin)
  await page.route('**/api/**', handleRoute);
}
