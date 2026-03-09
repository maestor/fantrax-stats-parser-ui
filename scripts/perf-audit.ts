import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import {
  chromium,
  devices,
  type BrowserContextOptions,
  type Page,
} from '@playwright/test';

import { setupApiMocks } from '../e2e/mocks/api-mock';

const DIST_DIR = resolve('dist/fantrax-stats-parser-ui/browser');
const INDEX_PATH = resolve(DIST_DIR, 'index.html');

type RouteSpec = {
  label: string;
  path: string;
  readySelector: string;
  interactionLabel: string;
  runInteraction(page: Page): Promise<void>;
};

type ProfileSpec = {
  label: string;
  contextOptions: BrowserContextOptions;
};

type MetricRating = 'good' | 'needs-improvement' | 'poor' | 'not-supported';

type AuditResult = {
  profile: string;
  route: string;
  path: string;
  lcpMs: number | null;
  cls: number | null;
  interactionDelayMs: number | null;
  interactionType: string | null;
  domContentLoadedMs: number | null;
  loadMs: number | null;
  totalTransferKb: number;
  jsTransferKb: number;
};

const routes: RouteSpec[] = [
  {
    label: 'frontpage',
    path: '/',
    readySelector: 'tr[mat-row][data-row-index="0"]',
    interactionLabel: 'open player card',
    async runInteraction(page) {
      await page.locator('tr[mat-row][data-row-index="0"]').click();
      await page.locator('.player-card').waitFor({ state: 'visible' });
      await page.locator('.player-card > button').first().click();
      await page.locator('.player-card').waitFor({ state: 'hidden' });
    },
  },
  {
    label: 'career players',
    path: '/career/players',
    readySelector: '.virtual-table-row[data-row-index="0"]',
    interactionLabel: 'search career table',
    async runInteraction(page) {
      const searchInput = page.locator('input[type="search"]');
      await searchInput.click();
      await searchInput.fill('jamie');
    },
  },
];

const profiles: ProfileSpec[] = [
  {
    label: 'desktop',
    contextOptions: {
      ...devices['Desktop Chrome'],
      serviceWorkers: 'block',
    },
  },
  {
    label: 'mobile',
    contextOptions: {
      ...devices['Pixel 5'],
      serviceWorkers: 'block',
    },
  },
];

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff2': 'font/woff2',
};

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
  const pathname = decodeURIComponent(requestUrl.pathname);
  const extension = extname(pathname);

  let filePath = INDEX_PATH;
  let statusCode = 200;

  if (extension) {
    const candidatePath = normalize(join(DIST_DIR, pathname));
    const isInsideDist = candidatePath.startsWith(DIST_DIR);

    if (isInsideDist && existsSync(candidatePath)) {
      filePath = candidatePath;
    } else {
      statusCode = 404;
      filePath = INDEX_PATH;
    }
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(statusCode, {
      'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(statusCode === 404 ? 'Not found' : body);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Failed to serve ${filePath}: ${String(error)}`);
  }
}

async function startStaticServer(): Promise<{ origin: string; close(): Promise<void> }> {
  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine local server address.');
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }

          resolveClose();
        });
      }),
  };
}

async function installPerformanceObservers(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = {
      cls: 0,
      lcpMs: null as number | null,
      interactionDelayMs: null as number | null,
      interactionType: null as string | null,
    };

    (window as typeof window & { __perfAudit?: typeof state }).__perfAudit = state;

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
        if (entry.hadRecentInput) {
          continue;
        }

        state.cls += entry.value ?? 0;
      }
    }).observe({ type: 'layout-shift', buffered: true });

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (lastEntry) {
        state.lcpMs = lastEntry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & {
            interactionId?: number;
            name?: string;
            processingStart?: number;
          }
        >) {
          const processingStart = entry.processingStart ?? entry.startTime;
          const delay = processingStart - entry.startTime;

          if (state.interactionDelayMs === null || delay > state.interactionDelayMs) {
            state.interactionDelayMs = delay;
            state.interactionType = entry.name ?? 'interaction';
          }
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch {
      // Event Timing is not available in every browser context.
    }
  });
}

function classifyLcp(value: number | null): MetricRating {
  if (value === null) return 'not-supported';
  if (value <= 2500) return 'good';
  if (value <= 4000) return 'needs-improvement';
  return 'poor';
}

function classifyCls(value: number | null): MetricRating {
  if (value === null) return 'not-supported';
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
}

function classifyInteractionDelay(value: number | null): MetricRating {
  if (value === null) return 'not-supported';
  if (value <= 200) return 'good';
  if (value <= 500) return 'needs-improvement';
  return 'poor';
}

function formatRating(label: string, rating: MetricRating): string {
  const suffix =
    rating === 'good'
      ? 'GOOD'
      : rating === 'needs-improvement'
        ? 'NEEDS-IMPROVEMENT'
        : rating === 'poor'
          ? 'POOR'
          : 'N/A';

  return `${label}: ${suffix}`;
}

function round(value: number | null, digits = 0): number | null {
  if (value === null) {
    return null;
  }

  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function formatMs(value: number | null): string {
  return value === null ? 'n/a' : `${value.toFixed(0)} ms`;
}

function formatNumber(value: number | null, digits = 2): string {
  return value === null ? 'n/a' : value.toFixed(digits);
}

async function collectResult(
  page: Page,
  profile: ProfileSpec,
  route: RouteSpec,
  origin: string,
): Promise<AuditResult> {
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);

  await installPerformanceObservers(page);
  await setupApiMocks(page);

  await page.goto(`${origin}${route.path}`, { waitUntil: 'domcontentloaded' });
  await page.locator(route.readySelector).waitFor({ state: 'visible' });
  await page.waitForTimeout(800);

  await route.runInteraction(page);
  await page.waitForTimeout(500);

  const perfState = await page.evaluate(() => {
    const state = (window as typeof window & {
      __perfAudit?: {
        cls: number;
        lcpMs: number | null;
        interactionDelayMs: number | null;
        interactionType: string | null;
      };
    }).__perfAudit;

    return state ?? null;
  });

  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!entry) {
      return null;
    }

    return {
      domContentLoadedMs: entry.domContentLoadedEventEnd - entry.startTime,
      loadMs: entry.loadEventEnd - entry.startTime,
    };
  });

  const resources = await page.evaluate(() => {
    const summary = {
      totalTransferKb: 0,
      jsTransferKb: 0,
    };

    for (const entry of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      const transferSize = entry.transferSize || entry.encodedBodySize || 0;
      const transferKb = transferSize / 1024;
      summary.totalTransferKb += transferKb;

      try {
        const pathname = new URL(entry.name).pathname;
        if (pathname.endsWith('.js')) {
          summary.jsTransferKb += transferKb;
        }
      } catch {
        // Ignore malformed resource URLs.
      }
    }

    return summary;
  });

  return {
    profile: profile.label,
    route: route.label,
    path: route.path,
    lcpMs: round(perfState?.lcpMs ?? null),
    cls: round(perfState?.cls ?? null, 3),
    interactionDelayMs: round(perfState?.interactionDelayMs ?? null),
    interactionType: perfState?.interactionType ?? null,
    domContentLoadedMs: round(navigation?.domContentLoadedMs ?? null),
    loadMs: round(navigation?.loadMs ?? null),
    totalTransferKb: round(resources.totalTransferKb, 1) ?? 0,
    jsTransferKb: round(resources.jsTransferKb, 1) ?? 0,
  };
}

function printResult(result: AuditResult, route: RouteSpec): void {
  const lcpRating = classifyLcp(result.lcpMs);
  const clsRating = classifyCls(result.cls);
  const interactionRating = classifyInteractionDelay(result.interactionDelayMs);

  console.log(`\n[${result.profile}] ${result.route} (${result.path})`);
  console.log(`  ${formatRating('LCP', lcpRating)} -> ${formatMs(result.lcpMs)}`);
  console.log(`  ${formatRating('CLS', clsRating)} -> ${formatNumber(result.cls, 3)}`);
  console.log(
    `  ${formatRating('Interaction proxy', interactionRating)} -> ${formatMs(result.interactionDelayMs)} (${route.interactionLabel}${result.interactionType ? ` / ${result.interactionType}` : ''})`,
  );
  console.log(`  DOMContentLoaded -> ${formatMs(result.domContentLoadedMs)}`);
  console.log(`  Load -> ${formatMs(result.loadMs)}`);
  console.log(
    `  Transfer -> ${result.totalTransferKb.toFixed(1)} kB total, ${result.jsTransferKb.toFixed(1)} kB JS`,
  );
}

async function main(): Promise<void> {
  if (!existsSync(INDEX_PATH)) {
    throw new Error(
      'Production build output is missing. Run `npm run build` before the performance audit.',
    );
  }

  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const results: AuditResult[] = [];

  try {
    for (const profile of profiles) {
      const context = await browser.newContext(profile.contextOptions);

      try {
        for (const route of routes) {
          const page = await context.newPage();

          try {
            console.log(`Auditing [${profile.label}] ${route.label} (${route.path})...`);
            const result = await collectResult(page, profile, route, server.origin);
            results.push(result);
            printResult(result, route);
          } finally {
            await page.close();
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const hasPoorVital = results.some((result) => {
    return classifyLcp(result.lcpMs) === 'poor' || classifyCls(result.cls) === 'poor';
  });

  console.log('\nNote: this audit uses a local production build with mocked API responses.');
  console.log('Use PageSpeed Insights or Chrome DevTools for public scores and field-data validation.');

  if (hasPoorVital) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
