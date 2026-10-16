// Serve the built client shell with career metadata for crawlers that do not run JavaScript.
const fs = require('node:fs/promises');
const path = require('node:path');
const { seo } = require('../public/i18n/fi.json');

const SITE_URL = 'https://ffhl-stats.vercel.app';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function meta(html, key, value) {
  const attribute = key.startsWith('og:') ? 'property' : 'name';
  return html.replace(
    new RegExp(`<meta\\b[^>]*\\b${attribute}="${key}"[^>]*>`, 'i'),
    () => `<meta ${attribute}="${key}" content="${escapeHtml(value)}">`,
  );
}

function profileHtml(html, profile, kind) {
  const position = profile.position || 'G';
  const interpolate = (template) => template
    .replaceAll('{{name}}', () => profile.name)
    .replaceAll('{{position}}', () => position);
  const title = interpolate(seo.careerTitle);
  const description = interpolate(seo.careerDescription);
  // Keep this normalization aligned with the UI's toSlug/careerProfileSlug helpers.
  const slug = profile.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const canonical = `${SITE_URL}/career/${kind}/${slug}-${profile.id}`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(title)}</title>`);
  for (const key of ['og:title', 'twitter:title']) html = meta(html, key, title);
  for (const key of ['description', 'og:description', 'twitter:description']) html = meta(html, key, description);
  html = meta(html, 'og:url', canonical);
  return html.replace(/<link\b[^>]*\brel="canonical"[^>]*>/i, () => `<link rel="canonical" href="${escapeHtml(canonical)}">`);
}

module.exports = async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('allow', 'GET, HEAD');
    res.end();
    return;
  }
  const params = new URL(req.url, 'http://localhost').searchParams;
  const kind = params.get('kind');
  const slug = params.get('slug') || '';
  const id = slug.slice(slug.lastIndexOf('-') + 1);
  if (!['players', 'goalies'].includes(kind) || !/^[A-Za-z0-9_-]+$/.test(slug) || !id) {
    res.statusCode = 404;
    res.end();
    return;
  }

  let html;
  try {
    html = await fs.readFile(path.join(process.cwd(), 'dist/fantrax-stats-parser-ui/browser/index.csr.html'), 'utf8');
  } catch {
    res.statusCode = 500;
    res.setHeader('cache-control', 'no-store');
    res.end();
    return;
  }
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  try {
    if (!process.env.API_URL || !process.env.API_KEY) throw new Error('Missing API configuration');
    const target = new URL(process.env.API_URL);
    target.pathname = `${target.pathname.replace(/\/$/, '')}/career/${kind === 'goalies' ? 'goalie' : 'player'}/${id}`;
    target.search = '';
    const upstream = await fetch(target, {
      headers: { 'x-api-key': process.env.API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    if (upstream.status === 404) {
      res.statusCode = 404;
      html = meta(html, 'robots', 'noindex,follow');
    } else {
      if (!upstream.ok) throw new Error('Career request failed');
      const profile = await upstream.json();
      if (profile.id !== id || typeof profile.name !== 'string' || !profile.name ||
          (kind === 'players' && typeof profile.position !== 'string')) {
        throw new Error('Invalid career response');
      }
      html = profileHtml(html, profile, kind);
      res.setHeader('cache-control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    }
  } catch {
    // Keep the app usable during API failures; the browser can load/retry the profile.
  }
  res.end(req.method === 'HEAD' ? '' : html);
};
