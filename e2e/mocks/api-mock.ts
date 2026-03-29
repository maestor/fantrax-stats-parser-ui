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

function loadFixtureJson<T>(filename: string): T | null {
  const body = loadFixture(filename);
  return body === null ? null : JSON.parse(body) as T;
}

function buildCareerHighlightsFallback(url: URL): string | null {
  const match = url.pathname.match(/^\/(?:api\/)?career\/highlights\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const type = match[1];
  const skip = Number(url.searchParams.get('skip') ?? '0');
  const take = Number(url.searchParams.get('take') ?? '0');

  if (!Number.isFinite(skip) || !Number.isFinite(take) || skip !== 0 || take <= 0) {
    return null;
  }

  type CareerHighlightsFixture = {
    readonly items: readonly unknown[];
    readonly skip: number;
    readonly take: number;
    readonly total: number;
    readonly minAllowed?: number;
    readonly type: string;
  };

  const page0 = loadFixtureJson<CareerHighlightsFixture>(
    `career--highlights--${type}--skip=0--take=10.json`,
  );
  if (!page0) {
    return null;
  }

  const combinedItems = [...page0.items];

  if (take > combinedItems.length) {
    const page1 = loadFixtureJson<CareerHighlightsFixture>(
      `career--highlights--${type}--skip=10--take=10.json`,
    );
    if (page1) {
      combinedItems.push(...page1.items);
    }
  }

  return JSON.stringify({
    ...page0,
    skip: 0,
    take,
    items: combinedItems.slice(0, take),
  });
}

/** Route handler that maps requests to fixture files */
function handleRoute(route: Parameters<Parameters<Page['route']>[1]>[0]): Promise<void> {
  const url = new URL(route.request().url());
  const filename = urlToFixtureName(url);
  const body = loadFixture(filename) ?? buildCareerHighlightsFallback(url);

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
