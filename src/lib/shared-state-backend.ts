import { kv } from '@vercel/kv';
import { createClient, type RedisClientType } from 'redis';

type RedisBackendConfig =
  | { type: 'redis'; url: string }
  | { type: 'upstash'; url: string; token: string };

let redisClientPromise: Promise<RedisClientType | null> | null = null;

function getRedisBackendConfig(): RedisBackendConfig | null {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    return { type: 'redis', url: redisUrl };
  }

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!upstashUrl || !upstashToken) {
    return null;
  }

  const normalizedUrl = upstashUrl.replace(/^redis:\/\//, 'https://').replace(/^rediss:\/\//, 'https://');
  if (/^https?:\/\//i.test(normalizedUrl)) {
    return { type: 'upstash', url: normalizedUrl, token: upstashToken };
  }

  if (/^redis(?:s)?:\/\//i.test(upstashUrl)) {
    return { type: 'redis', url: upstashUrl };
  }

  return { type: 'upstash', url: upstashUrl, token: upstashToken };
}

function getRedisClient(): Promise<RedisClientType | null> {
  const backendConfig = getRedisBackendConfig();
  if (!backendConfig || backendConfig.type !== 'redis') {
    return Promise.resolve(null);
  }

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const client = createClient({ url: backendConfig.url });
      client.on('error', () => undefined);
      await client.connect();
      return client;
    })().catch((error) => {
      redisClientPromise = null;
      throw error;
    });
  }

  return redisClientPromise;
}

function parseUpstashPayload(value: unknown): unknown {
  if (typeof value === 'string') {
    try {
      return parseUpstashPayload(JSON.parse(value));
    } catch {
      return value;
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.value !== undefined && Object.keys(record).length === 1) {
      return parseUpstashPayload(record.value);
    }
  }

  return value;
}

async function readFromUpstash<T>(key: string, backendConfig: Extract<RedisBackendConfig, { type: 'upstash' }>): Promise<T | null> {
  const url = new URL(`/get/${encodeURIComponent(key)}`, backendConfig.url.endsWith('/') ? backendConfig.url : `${backendConfig.url}/`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${backendConfig.token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { result?: string | null; error?: string };
    if (payload.result === null || payload.result === undefined) {
      return null;
    }

    return parseUpstashPayload(payload.result) as T;
  } catch {
    return null;
  }
}

async function writeToUpstash(key: string, value: unknown, backendConfig: Extract<RedisBackendConfig, { type: 'upstash' }>): Promise<boolean> {
  const url = new URL(`/set/${encodeURIComponent(key)}`, backendConfig.url.endsWith('/') ? backendConfig.url : `${backendConfig.url}/`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${backendConfig.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: JSON.stringify(value) }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function readFromRedis<T>(key: string): Promise<T | null> {
  const backendConfig = getRedisBackendConfig();
  if (!backendConfig) {
    return null;
  }

  if (backendConfig.type === 'upstash') {
    return readFromUpstash<T>(key, backendConfig);
  }

  try {
    const client = await getRedisClient();
    if (!client) {
      return null;
    }

    const value = await client.get(key);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function writeToRedis(key: string, value: unknown): Promise<boolean> {
  const backendConfig = getRedisBackendConfig();
  if (!backendConfig) {
    return false;
  }

  if (backendConfig.type === 'upstash') {
    return writeToUpstash(key, value, backendConfig);
  }

  try {
    const client = await getRedisClient();
    if (!client) {
      return false;
    }

    await client.set(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

async function readFromKv<T>(key: string): Promise<T | null> {
  try {
    const value = await kv.get(key);
    if (value === null || value === undefined) {
      return null;
    }

    return typeof value === 'string' ? (JSON.parse(value) as T) : (value as T);
  } catch {
    return null;
  }
}

async function writeToKv(key: string, value: unknown): Promise<boolean> {
  try {
    await kv.set(key, value);
    return true;
  } catch {
    return false;
  }
}

export function hasConfiguredSharedStorage(): boolean {
  return Boolean(getRedisBackendConfig() || process.env.KV_URL || process.env.KV_REST_API_URL);
}

export async function probeSharedStorage() {
  const backendConfig = getRedisBackendConfig();

  if (!backendConfig) {
    return {
      ok: false,
      backend: null,
      message: 'No shared Redis or Upstash storage is configured.',
    } as const;
  }

  if (backendConfig.type === 'upstash') {
    const key = `__probe__${Date.now()}`;
    const wrote = await writeToUpstash(key, { ok: true }, backendConfig);

    if (!wrote) {
      return {
        ok: false,
        backend: 'upstash',
        message: 'Upstash REST write failed.',
      } as const;
    }

    const readBack = await readFromUpstash<unknown>(key, backendConfig);
    const ok = readBack !== null && readBack !== undefined;

    return {
      ok,
      backend: 'upstash' as const,
      message: ok
        ? 'Upstash Redis is reachable and working.'
        : 'Upstash write succeeded, but the read-back response did not match the expected probe payload.',
    } as const;
  }

  try {
    const client = await getRedisClient();
    if (!client) {
      return {
        ok: false,
        backend: 'redis',
        message: 'Redis client could not be initialized.',
      } as const;
    }

    const probeKey = `__probe__${Date.now()}`;
    await client.set(probeKey, 'ok');
    const value = await client.get(probeKey);
    await client.del(probeKey);

    return {
      ok: value === 'ok',
      backend: 'redis' as const,
      message: value === 'ok' ? 'Redis server is reachable and working.' : 'Redis connection responded unexpectedly.',
    } as const;
  } catch (error) {
    return {
      ok: false,
      backend: 'redis' as const,
      message: error instanceof Error ? error.message : 'Redis connection failed.',
    } as const;
  }
}

export async function readSharedState<T>(key: string): Promise<T | null> {
  return (await readFromRedis<T>(key)) ?? (await readFromKv<T>(key));
}

export async function writeSharedState(key: string, value: unknown): Promise<boolean> {
  return (await writeToRedis(key, value)) || (await writeToKv(key, value));
}