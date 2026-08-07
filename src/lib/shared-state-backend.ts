import { kv } from '@vercel/kv';
import { createClient, type RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL?.trim();

let redisClientPromise: Promise<RedisClientType | null> | null = null;

function getRedisClient(): Promise<RedisClientType | null> {
  if (!REDIS_URL) {
    return Promise.resolve(null);
  }

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const client = createClient({ url: REDIS_URL });
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

async function readFromRedis<T>(key: string): Promise<T | null> {
  if (!REDIS_URL) {
    return null;
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
  if (!REDIS_URL) {
    return false;
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

export async function readSharedState<T>(key: string): Promise<T | null> {
  return (await readFromRedis<T>(key)) ?? (await readFromKv<T>(key));
}

export async function writeSharedState(key: string, value: unknown): Promise<boolean> {
  return (await writeToRedis(key, value)) || (await writeToKv(key, value));
}