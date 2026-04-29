import { Readable } from 'node:stream';
import { createRequire } from 'node:module';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const proxyModule = require('./proxy.js');
const handler = proxyModule;

function createRequest({
  method = 'GET',
  url = '/api/proxy?path=teams',
  headers = {},
  body,
  remoteAddress = '127.0.0.1',
} = {}) {
  const chunks = body ? [Buffer.from(body)] : [];
  const req = Readable.from(chunks);
  req.method = method;
  req.url = url;
  req.headers = headers;
  req.socket = { remoteAddress };
  return req;
}

function createResponse() {
  return {
    statusCode: 200,
    headers: new Map(),
    body: Buffer.alloc(0),
    ended: false,
    setHeader(name, value) {
      this.headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return this.headers.get(String(name).toLowerCase());
    },
    end(data) {
      if (data !== undefined) {
        this.body = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
      }
      this.ended = true;
    },
  };
}

describe('Vercel proxy handler', () => {
  const originalEnv = {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    API_KEY: process.env.API_KEY,
    API_URL: process.env.API_URL,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_SEC: process.env.RATE_LIMIT_WINDOW_SEC,
  };

  beforeEach(() => {
    process.env.ALLOWED_ORIGINS = 'https://ffhl-stats.vercel.app';
    process.env.API_KEY = 'server-secret';
    process.env.API_URL = 'https://backend.example.com/api';
    process.env.RATE_LIMIT_MAX = '20';
    process.env.RATE_LIMIT_WINDOW_SEC = '60';
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    process.env.ALLOWED_ORIGINS = originalEnv.ALLOWED_ORIGINS;
    process.env.API_KEY = originalEnv.API_KEY;
    process.env.API_URL = originalEnv.API_URL;
    process.env.RATE_LIMIT_MAX = originalEnv.RATE_LIMIT_MAX;
    process.env.RATE_LIMIT_WINDOW_SEC = originalEnv.RATE_LIMIT_WINDOW_SEC;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('forwards allowlisted read endpoints with the server API key only', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify([{ id: '1', name: 'Colorado Avalanche' }]), {
        status: 200,
        headers: {
          'cache-control': 'public, max-age=60',
          'content-type': 'application/json',
          'set-cookie': 'should-not-leak=1',
        },
      }),
    );

    const req = createRequest({
      url: '/api/proxy?path=teams',
      headers: {
        origin: 'https://ffhl-stats.vercel.app',
        accept: 'application/json',
        authorization: 'Bearer browser-token',
      },
    });
    const res = createResponse();

    await handler(req, res);

    expect(fetch).toHaveBeenCalledWith(
      new URL('https://backend.example.com/api/teams'),
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-api-key': 'server-secret',
        },
      },
    );
    expect(res.statusCode).toBe(200);
    expect(res.getHeader('access-control-allow-origin')).toBe(
      'https://ffhl-stats.vercel.app',
    );
    expect(res.getHeader('set-cookie')).toBeUndefined();
    expect(JSON.parse(res.body.toString('utf8'))).toEqual([
      { id: '1', name: 'Colorado Avalanche' },
    ]);
  });

  it('forwards allowlisted dynamic read endpoints with their query params', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    const req = createRequest({
      url: '/api/proxy?path=players/season/playoffs/2024&teamId=29',
      headers: {
        origin: 'https://ffhl-stats.vercel.app',
      },
    });
    const res = createResponse();

    await handler(req, res);

    expect(fetch).toHaveBeenCalledWith(
      new URL('https://backend.example.com/api/players/season/playoffs/2024?teamId=29'),
      {
        method: 'GET',
        headers: {
          'x-api-key': 'server-secret',
        },
      },
    );
    expect(res.statusCode).toBe(200);
  });

  it('rejects mutation methods before reaching the backend', async () => {
    const req = createRequest({
      method: 'POST',
      url: '/api/proxy?path=teams',
      headers: {
        origin: 'https://ffhl-stats.vercel.app',
        'content-type': 'application/json',
      },
      body: '{"name":"Should not be forwarded"}',
    });
    const res = createResponse();

    await handler(req, res);

    expect(fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body.toString('utf8'))).toEqual({
      error: 'Method not allowed',
      allowedMethods: ['GET', 'OPTIONS'],
    });
  });

  it('rejects unknown rewritten paths before reaching the backend', async () => {
    const req = createRequest({
      url: '/api/proxy?path=admin/secrets',
      headers: {
        origin: 'https://ffhl-stats.vercel.app',
      },
    });
    const res = createResponse();

    await handler(req, res);

    expect(fetch).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body.toString('utf8'))).toEqual({
      error: 'Path not allowed',
      path: 'admin/secrets',
    });
  });
});
