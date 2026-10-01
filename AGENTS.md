<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## CI
Run `npm run gate` (lint, tests, build) before pushing; it equals the `check` job in `.github/workflows/ci.yml`. The `ci-ok` check is the single one to watch and the merge bar.
