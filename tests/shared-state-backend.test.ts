import assert from 'node:assert/strict';
import test from 'node:test';

const originalFetch = global.fetch;
const originalEnv = {
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  REDIS_URL: process.env.REDIS_URL,
};

test('writeSharedState uses Upstash REST credentials when present', async () => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  delete process.env.REDIS_URL;

  const requests: Array<{ url: string; method: string; headers: HeadersInit | undefined }> = [];

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    requests.push({
      url,
      method: init?.method ?? 'GET',
      headers: init?.headers,
    });

    return new Response(JSON.stringify({ result: 'OK' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const { writeSharedState } = await import('../src/lib/shared-state-backend.ts');
    const wrote = await writeSharedState('tracker-state', { status: 'ok' });

    assert.equal(wrote, true);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'POST');
    assert.match(requests[0].url, /\/set\/tracker-state$/);

    const headers = requests[0].headers;
    const authorizationHeader =
      headers instanceof Headers
        ? headers.get('authorization')
        : (headers as Record<string, string> | undefined)?.authorization ??
          (headers as Record<string, string> | undefined)?.Authorization;

    assert.equal(authorizationHeader, 'Bearer test-token');
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
});

test('probeSharedStorage reports a successful Upstash connection', async () => {
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  delete process.env.REDIS_URL;

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/set/')) {
      return new Response(JSON.stringify({ result: 'OK' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ result: JSON.stringify({ ok: true }) }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const { probeSharedStorage } = await import('../src/lib/shared-state-backend.ts');
    const result = await probeSharedStorage();

    assert.equal(result.ok, true);
    assert.equal(result.backend, 'upstash');
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
});

function restoreEnv() {
  if (originalEnv.UPSTASH_REDIS_REST_URL === undefined) {
    delete process.env.UPSTASH_REDIS_REST_URL;
  } else {
    process.env.UPSTASH_REDIS_REST_URL = originalEnv.UPSTASH_REDIS_REST_URL;
  }

  if (originalEnv.UPSTASH_REDIS_REST_TOKEN === undefined) {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  } else {
    process.env.UPSTASH_REDIS_REST_TOKEN = originalEnv.UPSTASH_REDIS_REST_TOKEN;
  }

  if (originalEnv.REDIS_URL === undefined) {
    delete process.env.REDIS_URL;
  } else {
    process.env.REDIS_URL = originalEnv.REDIS_URL;
  }
}
