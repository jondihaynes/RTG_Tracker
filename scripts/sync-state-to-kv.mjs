import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const STORAGE_KEY = process.env.STATE_STORAGE_KEY || 'ready-to-go-tracker-state';

if (!fs.existsSync(STATE_FILE)) {
  console.log('No local state file found. Nothing to sync.');
  process.exit(0);
}

const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
await kv.set(STORAGE_KEY, state);
console.log('Synced tracker state to Vercel KV.');
