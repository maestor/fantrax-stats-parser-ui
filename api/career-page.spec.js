import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const fs = require('node:fs/promises');
const template = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

function response() {
  return {
    statusCode: 200,
    headers: new Map(),
    setHeader(name, value) { this.headers.set(name.toLowerCase(), value); },
    end(body = '') { this.body = body; },
  };
}

async function request(kind = 'goalies', slug = 'mitchell-gibson-04qzr', method = 'GET') {
  const res = response();
  await require('./career-page.js')({ method, url: `/api/career-page?kind=${kind}&slug=${slug}&from=career-highlights` }, res);
  return res;
}

describe('career page HTML for shared links', () => {
  beforeEach(() => {
    vi.stubEnv('API_URL', 'https://backend.example.com/api');
    vi.stubEnv('API_KEY', 'server-secret');
    vi.spyOn(fs, 'readFile').mockResolvedValue(template);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: '04qzr', name: 'Mitchell Gibson' }))));
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('routes both profile kinds before the generic app fallback and bundles the built shell', () => {
    expect(config.rewrites[0]).toEqual({ source: '/career/:kind(players|goalies)/:slug', destination: '/api/career-page?kind=:kind&slug=:slug' });
    expect(config.functions['api/career-page.js'].includeFiles).toBe('dist/fantrax-stats-parser-ui/browser/index.csr.html');
  });

  it.each([
    ['goalies', 'Mitchell Gibson', undefined, 'G', 'goalie'],
    ['players', 'Artturi Lehkonen', 'F', 'F', 'player'],
    ['players', 'Miro Heiskanen', 'D', 'D', 'player'],
  ])('returns player-specific metadata to a crawler without JavaScript: %s %s', async (kind, name, position, expectedPosition, endpoint) => {
    fetch.mockResolvedValue(new Response(JSON.stringify({ id: '04qzr', name, position })));
    const res = await request(kind);
    const title = `FFHL-ura - ${name} (${expectedPosition})`;
    const description = `Uratilastot ja siirtohistoria FFHL:ssä pelaajasta ${name} (${expectedPosition})`;
    expect(res.statusCode).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(res.body).toContain(`<title>${title}</title>`);
    for (const tag of ['og:title', 'twitter:title']) expect(res.body).toContain(`${tag}" content="${title}"`);
    for (const tag of ['description', 'og:description', 'twitter:description']) expect(res.body).toContain(`${tag}" content="${description}"`);
    expect(fetch.mock.calls[0][0].toString()).toBe(`https://backend.example.com/api/career/${endpoint}/04qzr`);
    expect(fetch.mock.calls[0][1].headers).toEqual({ 'x-api-key': 'server-secret' });
    expect(res.body).toContain('<app-root></app-root>');
    expect(res.body).not.toContain('server-secret');
  });

  it('uses the API name for stale slugs and ID-only links and escapes HTML', async () => {
    fetch.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ id: '04qzr', name: 'Éric "A&B" <Test>', position: 'D' }))));
    for (const slug of ['old-name-04qzr', '04qzr']) {
      const res = await request('players', slug);
      expect(res.body).toContain('Éric &quot;A&amp;B&quot; &lt;Test&gt; (D)');
      expect(res.body).toContain('href="https://ffhl-stats.vercel.app/career/players/eric-a-b-test-04qzr"');
      expect(res.body).toContain('og:url" content="https://ffhl-stats.vercel.app/career/players/eric-a-b-test-04qzr"');
    }
  });

  it('returns the app shell without caching generic metadata when the API fails', async () => {
    fetch.mockRejectedValue(new Error('Unavailable'));
    const res = await request();
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(template);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns a non-indexable 404 shell for a missing profile', async () => {
    fetch.mockResolvedValue(new Response('{}', { status: 404 }));
    const res = await request();
    expect(res.statusCode).toBe(404);
    expect(res.body).toContain('name="robots" content="noindex,follow"');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it.each([['players', '../secret', 'GET', 404], ['teams', '04qzr', 'GET', 404], ['goalies', '04qzr', 'POST', 405]])('rejects invalid routes and methods before fetching', async (kind, slug, method, status) => {
    const res = await request(kind, slug, method);
    expect(res.statusCode).toBe(status);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('supports HEAD requests without sending the HTML body', async () => {
    const res = await request('goalies', '04qzr', 'HEAD');
    expect(res.statusCode).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(res.body).toBe('');
  });
});
