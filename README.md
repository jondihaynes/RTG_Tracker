# Ready to Go Status

A reusable Next.js starter for a shared status page.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
cp .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev`: Start local dev server.
- `npm run build`: Build production bundle.
- `npm run start`: Run production server.
- `npm run lint`: Run ESLint.
- `npm run test`: Run all tests once.
- `npm run test:watch`: Run tests in watch mode.
- `npm run sync:state`: Copy local `.data/state.json` into shared KV/Redis state.

## Environment Variables

Use `.env.local` for local development. Core values:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_OWNER_NAME`
- `NEXT_PUBLIC_PAGE_TITLE`
- `NEXT_PUBLIC_PAGE_DESCRIPTION`
- `NEXT_PUBLIC_AUTH_CODE`

The app also supports unprefixed alternatives (for example `APP_NAME`, `AUTH_CODE`) when needed.

## Shared State Backends

Local development falls back to `.data/state.json` when no shared backend is configured.

Backend priority:

1. `REDIS_URL` for a standard Redis server
2. `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for Upstash Redis
3. Vercel KV (`KV_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`)
4. Local file fallback (`.data/state.json`)

For Vercel deployments, add the KV integration in the Vercel dashboard and set the generated variables. For Upstash, set the REST URL and token from your database details.

## Deploying

Deploy through Vercel UI or CLI:

```bash
vercel --prod
```

## Migrating Existing Local State

If you already have local status data in `.data/state.json`, run:

```bash
npm run sync:state
```

This preserves the current state by copying it into your configured shared backend.
