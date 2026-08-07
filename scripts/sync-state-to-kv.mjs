import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { createClient } from 'redis';

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const STORAGE_KEY = process.env.STATE_STORAGE_KEY || 'ready-to-go-tracker-state';
const REDIS_URL = process.env.REDIS_URL?.trim();

let redisClientPromise = null;

function getRedisClient() {
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

async function writeStateToKv(state) {
  try {
    await kv.set(STORAGE_KEY, state);
    return true;
  } catch {
    return false;
  }
}

async function writeStateToRedis(state) {
  if (!REDIS_URL) {
    return false;
  }

  try {
    const client = await getRedisClient();
    if (!client) {
      return false;
    }

    await client.set(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

async function writeSharedState(state) {
  return (await writeStateToRedis(state)) || (await writeStateToKv(state));
}

if (!fs.existsSync(STATE_FILE)) {
  console.log('No local state file found. Nothing to sync.');
  process.exit(0);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
} catch {
  console.error('Local state file is not valid JSON.');
  process.exit(1);
}

const saved = await writeSharedState(state);

if (saved) {
  console.log(REDIS_URL ? 'Synced tracker state to Redis.' : 'Synced tracker state to Vercel KV.');
} else {
  console.error('Failed to sync tracker state to any shared store.');
  process.exit(1);
}
