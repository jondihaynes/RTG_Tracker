---
paths:
  - "**/package.json"
  - "**/pnpm-lock.yaml"
  - "**/package-lock.json"
  - "**/pyproject.toml"
  - "**/uv.lock"
  - ".github/dependabot.yml"
---

<!-- Synced from Jondi-Studio/ci standards/topics/dependencies.md. Don't edit here; change it there. -->

# Dependencies

- **Dependabot** runs weekly, grouped, for `github-actions` and the repo's own ecosystem
  (`Jondi-Studio/ci` `templates/dependabot.yml`).
- **Minor and patch** updates are routine: merge when green.
- **Major** bumps wait for Jondi. Take them to green, check the changelog for breaking changes,
  and say in one line what the bump changes.
- **Ignore rules live in `dependabot.yml`**, with a comment saying why. Cloud sessions can't post
  `@dependabot` commands (the proxy breaks the mention), so close the PR through the API after adding
  the ignore.
- `@types/node` tracks the Node runtime the repo runs (Node 24): ignore majors above it.
- Dependabot won't rebase a branch someone else pushed to, so merge such a PR promptly once green.

## Known breakages (2026-10-02)

- `actions/checkout@v7` fails auth on the Mac runners; git-runner's Mac workflows stay on `@v5`
  until that is understood. It works on the PC runners.
- `pnpm/action-setup@v6` exits 127 on the PC WSL runner; Priorities stays on `@v4`.
- RTG_Tracker can't take TypeScript 7 or ESLint 10 yet (its ESLint plugins lag).
