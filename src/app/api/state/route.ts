import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { siteConfig } from '@/lib/site-config';
import { readSharedState, writeSharedState } from '@/lib/shared-state-backend';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const STORAGE_KEY = siteConfig.stateStorageKey;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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
  const sharedState = await readSharedState(STORAGE_KEY);
  const state = sharedState ?? readStateFromFile();
  return NextResponse.json(
    { state },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const savedToSharedState = await writeSharedState(STORAGE_KEY, body);
    if (!savedToSharedState) {
      writeStateToFile(body);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
