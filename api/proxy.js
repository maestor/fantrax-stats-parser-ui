/**
 * Vercel Serverless Function: /api/proxy
 *
 * CommonJS implementation to match Vercel Node runtime loader.
 *
 * Configure on Vercel (Project Settings → Environment Variables):
 * - API_URL: absolute backend base URL, e.g. https://your-backend.example.com
 * - API_KEY: secret value
 * - ALLOWED_ORIGINS (required): comma-separated list of allowed origins/patterns
 *   e.g. https://ffhl-stats.vercel.app,https://ffhl-stats-*-development.vercel.app
 * - RATE_LIMIT_MAX (optional): max requests per window per IP (default: 120)
 * - RATE_LIMIT_WINDOW_SEC (optional): window size in seconds (default: 60)
 *
 * Frontend calls: /api/<path>?a=b
 * Vercel rewrite maps that to: /api/proxy?path=<path>&a=b
 */

const rateLimitState = new Map();
const ALLOWED_METHODS = ['GET', 'OPTIONS'];
const REPORT_TYPE_PATTERN = '(regular|playoffs|both)';
const CAREER_HIGHLIGHT_TYPES = [
  'most-teams-played',
  'most-teams-owned',
  'same-team-seasons-played',
  'same-team-seasons-owned',
  'most-stanley-cups',
  'reunion-king',
  'stash-king',
  'regular-grinder-without-playoffs',
  'most-trades',
  'most-claims',
  'most-drops',
];
const ALLOWED_PATH_PATTERNS = [
  /^teams$/,
  /^last-modified$/,
  /^leaderboard\/(regular|playoffs|transactions|finals)$/,
  new RegExp(`^seasons/${REPORT_TYPE_PATTERN}$`),
  new RegExp(`^players/combined/${REPORT_TYPE_PATTERN}$`),
  new RegExp(`^players/season/${REPORT_TYPE_PATTERN}/\\d{4}$`),
  new RegExp(`^goalies/combined/${REPORT_TYPE_PATTERN}$`),
  new RegExp(`^goalies/season/${REPORT_TYPE_PATTERN}/\\d{4}$`),
  /^career\/players$/,
  /^career\/goalies$/,
  new RegExp(
    `^career/highlights/(${CAREER_HIGHLIGHT_TYPES.map(escapeForRegExp).join('|')})$`,
  ),
  /^draft\/original$/,
  /^draft\/entry$/,
];

function toOrigin(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin.toLowerCase();
  } catch {
    return raw.replace(/\/+$/, '').toLowerCase();
  }
}

function escapeForRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function originPatternToRegExp(pattern) {
  const escaped = escapeForRegExp(pattern);
  return new RegExp(`^${escaped.replace(/\\\*/g, '.*')}$`);
}

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return null;

  const origins = raw
    .split(',')
    .map((s) => toOrigin(s))
    .filter(Boolean);

  if (!origins.length) return null;

  return origins.map((pattern) => ({
    pattern,
    regex: pattern.includes('*') ? originPatternToRegExp(pattern) : null,
  }));
}

function isAllowedOrigin(origin, allowedOrigins) {
  return allowedOrigins.some((entry) => {
    if (entry.regex) {
      return entry.regex.test(origin);
    }
    return entry.pattern === origin;
  });
}

function isAllowedByOriginOrReferer(req, allowedOrigins) {
  const originHeader = req.headers.origin;
  const requestOrigin = toOrigin(originHeader);
  if (requestOrigin) return isAllowedOrigin(requestOrigin, allowedOrigins);

  const refererHeader = req.headers.referer;
  const refererOrigin = toOrigin(refererHeader);
  if (refererOrigin) return isAllowedOrigin(refererOrigin, allowedOrigins);

  // No Origin/Referer (e.g. curl). Deny by default.
  return false;
}

function applyCors(req, res, allowedOrigins) {
  const requestOrigin = toOrigin(req.headers.origin);
  if (requestOrigin && isAllowedOrigin(requestOrigin, allowedOrigins)) {
    res.setHeader('access-control-allow-origin', requestOrigin);
    res.setHeader('vary', 'Origin');
  }
  res.setHeader('access-control-allow-methods', ALLOWED_METHODS.join(','));
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('access-control-max-age', '86400');
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  if (raw && typeof raw === 'string') {
    const first = raw.split(',')[0].trim();
    if (first) return first;
  }
  const xri = req.headers['x-real-ip'];
  if (typeof xri === 'string' && xri.trim()) return xri.trim();
  return req.socket?.remoteAddress || 'unknown';
}

function parsePositiveInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function applyRateLimit(req, res) {
  const max = parsePositiveInt(process.env.RATE_LIMIT_MAX, 120);
  const windowSec = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_SEC, 60);
  const windowMs = windowSec * 1000;

  const now = Date.now();
  const key = getClientIp(req);
  const entry = rateLimitState.get(key);

  let resetAt = now + windowMs;
  let count = 0;

  if (entry && typeof entry.resetAt === 'number' && typeof entry.count === 'number') {
    if (now <= entry.resetAt) {
      resetAt = entry.resetAt;
      count = entry.count;
    }
  }

  count += 1;
  rateLimitState.set(key, { count, resetAt });

  const remaining = Math.max(0, max - count);
  res.setHeader('x-ratelimit-limit', String(max));
  res.setHeader('x-ratelimit-remaining', String(remaining));
  res.setHeader('x-ratelimit-reset', String(Math.ceil(resetAt / 1000)));

  if (count > max) {
    res.setHeader('retry-after', String(Math.max(1, Math.ceil((resetAt - now) / 1000))));
    sendJson(res, 429, { error: 'Rate limit exceeded' });
    return false;
  }

  return true;
}

function normalizeHeader(value) {
  if (Array.isArray(value)) return value.join(', ');
  return value;
}

function joinPaths(basePathname, extraPath) {
  const a = String(basePathname || '').replace(/\/+$/, '');
  const b = String(extraPath || '').replace(/^\/+/, '');
  if (!a && !b) return '/';
  if (!a) return `/${b}`;
  if (!b) return a.startsWith('/') ? a : `/${a}`;
  return `${a.startsWith('/') ? a : `/${a}`}/${b}`;
}

function normalizeProxyPath(path) {
  return String(path || '').replace(/^\/+/, '').replace(/\/+$/, '');
}

function isAllowedProxyPath(path) {
  const normalizedPath = normalizeProxyPath(path);
  return ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handler(req, res) {
  try {
    const allowedOrigins = getAllowedOrigins();
    if (!allowedOrigins) {
      sendJson(res, 500, { error: 'Missing ALLOWED_ORIGINS server env var' });
      return;
    }

    // Browser enforcement: CORS + reject requests not coming from allowed origins.
    // Note: Origin/Referer can be spoofed by non-browser clients; this is primarily to prevent
    // other websites from using your proxy via browser fetch.
    applyCors(req, res, allowedOrigins);

    const method = String(req.method || '').toUpperCase();

    if (method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (method !== 'GET') {
      sendJson(res, 405, {
        error: 'Method not allowed',
        allowedMethods: ALLOWED_METHODS,
      });
      return;
    }

    if (!isAllowedByOriginOrReferer(req, allowedOrigins)) {
      const requestOrigin = toOrigin(req.headers.origin) || toOrigin(req.headers.referer);
      sendJson(res, 403, {
        error: 'Forbidden origin',
        origin: requestOrigin,
        hint: 'Set ALLOWED_ORIGINS to comma-separated site origins/patterns (no path), e.g. https://ffhl-stats.vercel.app,https://ffhl-stats-*-development.vercel.app',
      });
      return;
    }

    if (!applyRateLimit(req, res)) return;

    const backendBaseUrl = process.env.API_URL;
    const apiKey = process.env.API_KEY;

    console.log('[proxy] incoming', {
      method: req.method,
      url: req.url,
      hasApiUrl: Boolean(backendBaseUrl),
      hasApiKey: Boolean(apiKey),
    });

    if (!backendBaseUrl) {
      sendJson(res, 500, { error: 'Missing API_URL server env var' });
      return;
    }

    if (!apiKey) {
      sendJson(res, 500, { error: 'Missing API_KEY server env var' });
      return;
    }

    let base;
    try {
      base = new URL(backendBaseUrl);
    } catch {
      sendJson(res, 500, { error: 'Invalid API_URL (must be an absolute URL)' });
      return;
    }

    const incomingHost =
      normalizeHeader(req.headers['x-forwarded-host']) ?? normalizeHeader(req.headers['host']);

    if (incomingHost && base.host === incomingHost) {
      sendJson(res, 500, {
        error:
          'API_URL points to this same deployment host; this would cause a proxy loop. Set API_URL to your backend service domain instead.',
        incomingHost,
        apiUrlHost: base.host,
      });
      return;
    }

    const incomingUrl = new URL(req.url || '/', 'http://localhost');
    const path = normalizeProxyPath(incomingUrl.searchParams.get('path') || '');
    incomingUrl.searchParams.delete('path');

    if (!isAllowedProxyPath(path)) {
      sendJson(res, 404, {
        error: 'Path not allowed',
        path,
      });
      return;
    }

    const target = new URL(base.toString());
    target.pathname = joinPaths(target.pathname, path);
    for (const [k, v] of incomingUrl.searchParams.entries()) {
      target.searchParams.append(k, v);
    }

    console.log('[proxy] forward', { method: req.method, target: target.toString() });
    const headers = {
      'x-api-key': apiKey,
    };

    const contentType = normalizeHeader(req.headers['content-type']);
    if (contentType) headers['content-type'] = contentType;

    const accept = normalizeHeader(req.headers['accept']);
    if (accept) headers['accept'] = accept;

    const init = { method, headers };

    let upstream;
    try {
      upstream = await fetch(target, init);
    } catch (e) {
      console.error('[proxy] upstream fetch failed', e);
      sendJson(res, 502, {
        error: 'Upstream fetch failed',
        upstreamHost: target.host,
        upstreamPath: target.pathname,
      });
      return;
    }

    res.statusCode = upstream.status;

    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);

    const cc = upstream.headers.get('cache-control');
    if (cc) res.setHeader('cache-control', cc);

    const data = Buffer.from(await upstream.arrayBuffer());
    res.end(data);
  } catch (err) {
    console.error('[proxy] crash', err);
    sendJson(res, 500, { error: 'Proxy crashed' });
  }
}

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
