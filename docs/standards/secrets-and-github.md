<!-- Synced from Jondi-Studio/ci standards/topics/secrets-and-github.md. Don't edit here; change it there. -->

# Secrets and GitHub

## Secrets

- Values live in 1Password, **Dev** vault. Name the item; never print, log or commit a value.
- Run commands that need a secret through `agent-run` (the `agent-secrets` skill) on Jondi's PC.
- **GitHub Free:** private repos can't read org-level Actions secrets, so secrets stay repo
  secrets on the repos that use them. Don't "tidy" them into org secrets: that broke CI once.
- A real secret found in a diff is revoked first, then removed. A false positive gets a
  `gitleaks:allow` comment or a path allowlist in `.gitleaks.toml`.
- Changing secrets waits for Jondi.

## The org

- Repos live in the `Jondi-Studio` org (Free plan). RTG_Tracker, t-display-s3-amoled-164-base and
  route-minutes-desktop stay on the personal `jondihaynes` account.
- Renamed repos don't redirect in workflow `uses:` lines (mac-runners is now `git-runner`; any
  `uses: Jondi-Studio/mac-runners/...` fails).

## What cloud sessions can't do on GitHub

- GraphQL is blocked: no `gh pr checks`, `gh pr create` or marking a draft ready. Use `gh api` REST.
- Pushing tags, deleting branches and changing repo settings return 403. Branch cleanup relies on
  the repo's auto-delete-on-merge setting; settings changes go into a PowerShell script for Jondi.
- Repos whose names start with `.` can't be attached (why the shared repo is `ci`, not `.github`).
- Requesting Jondi as a reviewer fails (422); assign him instead.
- Commits from cloud sessions default to `Claude <noreply@anthropic.com>`; a repo that needs a
  different author says so in its `AGENTS.md`.
