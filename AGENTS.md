<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues live as GitHub issues, driven through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## CI
Run `npm run gate` (format check, lint, tests, build) before pushing; it equals the `check` job in `.github/workflows/ci.yml`. The `ci-ok` check is the single one to watch and the merge bar. Prettier formats the code: run `npm run format` before committing.

Org-wide rules for agents (merge and review, CI, testing, runners, skills, secrets): read `docs/standards/core.md` first. It is synced from `Jondi-Studio/ci`; don't edit it here.
