# Ready to Go Status

This is a reusable [Next.js](https://nextjs.org) starter for a shared status page that you can customize and build on.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Easy local customization

You can change the visible app text and auth code without editing the main code files. Create a local file named `.env.local` by copying [.env.example](.env.example) and changing the values you want:

```bash
cp .env.example .env.local
```

The most common values to edit are:

- `NEXT_PUBLIC_APP_NAME` (also accepts `APP_NAME`)
- `NEXT_PUBLIC_OWNER_NAME` (also accepts `OWNER_NAME`)
- `NEXT_PUBLIC_PAGE_TITLE` (also accepts `PAGE_TITLE`)
- `NEXT_PUBLIC_PAGE_DESCRIPTION` (also accepts `PAGE_DESCRIPTION`)
- `NEXT_PUBLIC_AUTH_CODE` (also accepts `AUTH_CODE`)

These values are stored locally and will stay intact even if you pull updated code from Git.

## Deploying to Vercel without losing status data

The tracker now uses Vercel KV for shared state when the proper environment variables are set. Local development still falls back to the local `.data/state.json` file.

### 1. Create a Vercel KV store

- Open your Vercel project dashboard.
- Add the Vercel KV integration from the marketplace.
- Copy the generated environment variables into your project settings.

### 2. Add the environment variables

In Vercel, add the deployment variables for both the site text and the KV connection:

```env
NEXT_PUBLIC_APP_NAME=Ready to Go
NEXT_PUBLIC_OWNER_NAME=Your Name
NEXT_PUBLIC_PAGE_TITLE=Ready to Go Status
NEXT_PUBLIC_PAGE_DESCRIPTION=A clean live status page for your current focus, next task, and recent history.
NEXT_PUBLIC_AUTH_CODE=1111
```

The app also accepts the Vercel-style unprefixed names (`APP_NAME`, `OWNER_NAME`, `PAGE_TITLE`, `PAGE_DESCRIPTION`, `AUTH_CODE`) if you prefer that format.

Add the KV variables:

```env
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

### 3. Deploy

Push your repo to GitHub and connect it to Vercel, or run:

```bash
vercel --prod
```

### 4. Migrate your current local state

To preserve the existing status state from `.data/state.json`, run:

```bash
npm run sync:state
```

That copies the current local tracker state into Vercel KV so future deploys and pushes keep the same data.
