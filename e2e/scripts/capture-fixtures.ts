/**
 * Capture API fixtures from the live backend for use in CI E2E tests.
 *
 * Only captures the exact fixtures needed by the test suite — not every
 * possible API permutation. When adding new tests that hit new API
 * endpoints/params, add matching entries to buildFixtureList() and re-run.
 *
 * Usage:
 *   npx tsx e2e/scripts/capture-fixtures.ts
 *
 * Requires the backend running on http://localhost:3000
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const API_URL = 'http://localhost:3000';
const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'fixtures', 'data');

type Season = { season: number; text: string };

type FixtureEntry = {
  path: string;
  params?: Record<string, string>;
};

/** Fetch JSON from the API */
async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}/${path}`);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${path}`);
  return response.json() as Promise<T>;
}

/**
 * Build fixture list based on what the E2E tests actually request.
 *
 * The list is derived from analysing all spec files and their API calls.
 * Season indices are resolved dynamically so the script stays correct
 * even when new seasons are added.
 */
async function buildFixtureList(): Promise<FixtureEntry[]> {
  const regularSeasons = await fetchJson<Season[]>('seasons/regular');

  // The default team's oldest season (used as default startFrom by the app)
  const oldest = String(regularSeasons[0].season);
  // The most recent season (used for single-season views)
  const latest = String(regularSeasons[regularSeasons.length - 1].season);
  // Tests pick startFrom options by index: .nth(3) and .nth(5)
  const startFromIdx3 = String(regularSeasons[3].season);
  const startFromIdx5 = String(regularSeasons[5].season);

  // Secondary team IDs used in team-switching and mobile tests
  const TAMPA_BAY = '16';
  const DALLAS = '29';

  const entries: FixtureEntry[] = [
    // ── Static endpoints ─────────────────────────────────────────────
    { path: 'teams' },
    { path: 'last-modified' },
    { path: 'leaderboard/regular' },
    { path: 'leaderboard/playoffs' },

    // ── Seasons ──────────────────────────────────────────────────────
    // Default team (no params → uses default startFrom=oldest internally)
    { path: 'seasons/regular' },
    { path: 'seasons/regular', params: { startFrom: oldest } },
    { path: 'seasons/regular', params: { startFrom: startFromIdx3 } },
    { path: 'seasons/regular', params: { startFrom: startFromIdx5 } },

    // Playoffs (only default team needed)
    { path: 'seasons/playoffs', params: { startFrom: oldest } },

    // Secondary teams — seasons
    { path: 'seasons/regular', params: { teamId: TAMPA_BAY } },
    { path: 'seasons/regular', params: { startFrom: oldest, teamId: TAMPA_BAY } },
    { path: 'seasons/regular', params: { teamId: DALLAS } },
    { path: 'seasons/regular', params: { startFrom: oldest, teamId: DALLAS } },

    // ── Players — combined ───────────────────────────────────────────
    { path: 'players/combined/regular' },
    { path: 'players/combined/regular', params: { startFrom: oldest } },
    { path: 'players/combined/regular', params: { startFrom: startFromIdx3 } },
    { path: 'players/combined/regular', params: { startFrom: startFromIdx5 } },
    { path: 'players/combined/playoffs', params: { startFrom: oldest } },

    // Secondary teams — players combined
    { path: 'players/combined/regular', params: { startFrom: oldest, teamId: TAMPA_BAY } },
    { path: 'players/combined/regular', params: { startFrom: oldest, teamId: DALLAS } },

    // ── Players — single season (latest, for season selector .nth(1)) ─
    { path: `players/season/regular/${latest}` },

    // ── Goalies — combined (for goalie tab tests) ────────────────────
    { path: 'goalies/combined/regular', params: { startFrom: oldest } },

    // ── Career highlights ─────────────────────────────────────────────
    { path: 'career/highlights/most-teams-played', params: { skip: '0', take: '10' } },
    { path: 'career/highlights/most-teams-played', params: { skip: '10', take: '10' } },
    { path: 'career/highlights/most-teams-owned', params: { skip: '0', take: '10' } },
    { path: 'career/highlights/most-teams-owned', params: { skip: '10', take: '10' } },
    { path: 'career/highlights/same-team-seasons-played', params: { skip: '0', take: '10' } },
    { path: 'career/highlights/same-team-seasons-played', params: { skip: '10', take: '10' } },
    { path: 'career/highlights/same-team-seasons-owned', params: { skip: '0', take: '10' } },
    { path: 'career/highlights/same-team-seasons-owned', params: { skip: '10', take: '10' } },
  ];

  return entries;
}

/** Convert a fixture entry to a filename */
function toFilename(entry: FixtureEntry): string {
  let name = entry.path.replace(/\//g, '--');
  if (entry.params) {
    const sorted = Object.keys(entry.params).sort();
    for (const key of sorted) {
      name += `--${key}=${entry.params[key]}`;
    }
  }
  return `${name}.json`;
}

/** Build a URL from a fixture entry */
function toUrl(entry: FixtureEntry): string {
  const url = new URL(`${API_URL}/${entry.path}`);
  if (entry.params) {
    for (const [key, value] of Object.entries(entry.params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function main() {
  mkdirSync(FIXTURES_DIR, { recursive: true });

  console.log(`Building fixture list from ${API_URL}...`);
  const entries = await buildFixtureList();
  console.log(`Capturing ${entries.length} fixtures...\n`);

  let success = 0;
  let failed = 0;

  for (const entry of entries) {
    const filename = toFilename(entry);
    const url = toUrl(entry);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`  FAIL ${filename} — HTTP ${response.status}`);
        failed++;
        continue;
      }
      const data = await response.json();
      writeFileSync(join(FIXTURES_DIR, filename), JSON.stringify(data, null, 2) + '\n');
      console.log(`  OK   ${filename}`);
      success++;
    } catch (error) {
      console.error(`  FAIL ${filename} — ${(error as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} captured, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
