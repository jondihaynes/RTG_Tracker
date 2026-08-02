import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { siteConfig } from '@/lib/site-config';

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const STORAGE_KEY = siteConfig.stateStorageKey;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function readStateFromKv() {
  try {
    const value = await kv.get(STORAGE_KEY);
    if (value === null || value === undefined) return null;
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

async function writeStateToKv(obj: unknown) {
  try {
    await kv.set(STORAGE_KEY, obj);
    return true;
  } catch {
    return false;
  }
}

function readStateFromFile() {
  ensureDir();
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStateToFile(obj: unknown) {
  ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

export async function GET() {
  const kvState = await readStateFromKv();
  const state = kvState ?? readStateFromFile();
  return NextResponse.json({ state });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const savedToKv = await writeStateToKv(body);
    if (!savedToKv) {
      writeStateToFile(body);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
