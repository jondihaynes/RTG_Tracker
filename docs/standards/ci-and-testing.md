<!-- Synced from Jondi-Studio/ci standards/topics/ci-and-testing.md. Don't edit here; change it there. -->

# CI and testing

The full specification is the CI contract in `Jondi-Studio/ci`:
https://github.com/Jondi-Studio/ci/blob/main/CONTRACT.md (readable with
`gh api "repos/Jondi-Studio/ci/contents/CONTRACT.md?ref=v1" -H "Accept: application/vnd.github.raw"`).
This is the summary an agent needs day to day. Where they differ, the contract wins for CI
mechanics and `docs/standards/runners.md` wins for runners.

## Shape of every repo's CI

- One entry workflow, `.github/workflows/ci.yml`, on `pull_request`, `push` to `main` and
  `workflow_dispatch`.
- One aggregate job, `ci-ok`, that needs every gate job. It is the only check anyone watches.
- Stages run cheapest first: format check, lint, typecheck, unit, integration, build, slow tests.
- Shared hygiene (actionlint and a gitleaks secret scan of added lines) from
  `Jondi-Studio/ci/.github/workflows/hygiene.yml@v1`.
- Shared pieces are pinned `@v1`, which is a **branch**, not a tag. After a `ci` change merges:
  `git push origin origin/main:refs/heads/v1`. A breaking change needs a `v2` branch.
- Personal-account repos (RTG_Tracker, t-display-s3-amoled-164-base) can't call the private `ci`
  repo, so they carry inlined copies of the scripts. A change in `ci` may need porting there.
- New repos are brought up to the contract with `/jondis-skills:setup-ci`.

## Running it locally

- `gate` runs what CI runs (an npm/pnpm script, or `scripts/gate.sh` / `scripts/gate.ps1`).
- `test:changed` is the fast inner loop where a repo has one. Run it before every push.
- The repo's `AGENTS.md` names both commands.

## Test what the change can reach (selective CI)

- A PR runs only the parts of the gate its files can affect, chosen from the repo's own dependency
  graph (pnpm workspace graph, maths' ownership index), never a hand-written path map.
- Docs-only PRs skip installs, tests and builds (`actions/changes`, filter `code: !**/*.md !docs/**`).
- Edges the graph can't see go in one table that a repo check enforces (Priorities: `EXTRA_EDGES`).
- Run everything for lockfiles, root manifests, toolchain config, `.github/**`, test tooling, or a
  diff that can't be read or is huge. `workflow_dispatch` on a branch runs the whole gate.
- **10-minute rule:** while the full suite takes 10 minutes or less, every push to `main` runs the
  full gate (Priorities, about 3 minutes). Past that, `main` pushes run the same selection as PRs and
  the full suite runs nightly, on manual dispatch and before a release (maths, 14 to 28 minutes).
  A nightly failure is fixed before new merges.
- A suite skipped on purpose counts as passed in `ci-ok`; the run summary says what was skipped.

## Tests

- Layer names are the same everywhere: `unit` (no network or database), `integration` (a real
  database or service the job starts and throws away), `e2e`/`smoke` (deployed app), `perf`/`timing`
  (runs alone).
- A flaky test is a bug. No retry plugins; never skip or quarantine a test.
- No coverage thresholds for now.

## Format and lint

- Every repo checks formatting and lints in CI (ruff for Python, Prettier or oxfmt plus ESLint or
  oxlint for TypeScript). Line width is 120 everywhere.
- A whole-repo reformat is its own commit, listed in `.git-blame-ignore-revs`, merged with a merge
  commit.

## Reading CI from a cloud session

GraphQL is blocked, so `gh pr checks` and `gh pr create` fail. Use REST:
`gh api repos/<owner>/<repo>/commits/<sha>/check-runs` and `gh api -X POST repos/<owner>/<repo>/pulls`.
A re-run reuses the reusable workflow's original SHA, so use `workflow_dispatch` or a push to pick
up a change in `ci`.
