import { NextResponse } from 'next/server';
import { siteConfig } from '@/lib/site-config';
import { hasConfiguredSharedStorage, probeSharedStorage, readSharedState, writeSharedState } from '@/lib/shared-state-backend';

export const dynamic = 'force-dynamic';

const STORAGE_KEY = siteConfig.stateStorageKey;
const isProduction = process.env.NODE_ENV === 'production';

function getStorageError() {
  if (isProduction && !hasConfiguredSharedStorage()) {
    return 'No shared Redis/Vercel KV storage is configured for production.';
  }

  return null;
}

export async function GET() {
  const storageError = getStorageError();
  if (storageError) {
    return NextResponse.json(
      { state: null, error: storageError },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  }

  const sharedState = await readSharedState(STORAGE_KEY);
  return NextResponse.json(
    { state: sharedState },
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
    const storageError = getStorageError();
    if (storageError) {
      return NextResponse.json({ ok: false, error: storageError }, { status: 503 });
    }

    const body = await req.json();
    const savedToSharedState = await writeSharedState(STORAGE_KEY, body);
    if (!savedToSharedState) {
      return NextResponse.json({ ok: false, error: 'Shared storage write failed.' }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PATCH() {
  const probe = await probeSharedStorage();
  return NextResponse.json(
    {
      ok: probe.ok,
      backend: probe.backend,
      message: probe.message,
    },
    {
      status: probe.ok ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        Pragma: 'no-cache',
        Expires: '0',
      },
    },
  );
}
