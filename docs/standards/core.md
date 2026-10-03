<!-- Synced from Jondi-Studio/ci standards/core.md. Don't edit here; change it there. -->

# Jondi-Studio standards

These rules apply to every agent in every Jondi-Studio repo. Each one says why it exists, so it can
be dropped when the reason goes. Detail lives in `docs/standards/`; read the matching file before
acting on that topic.

1. **Finish what you start.** Drive work to its end: PR green and merged (or handed over), question
   answered. Stop only for something only Jondi can do, then say what you need in one line and keep
   doing everything else. *Why: Jondi checks in rarely; a stalled agent wastes hours.*
2. **Iterate until green, then merge it yourself.** Branch, PR, then push, wait for CI, fix every
   failure and review finding, repeat. When every check on the head commit passed and the PR has no
   conflict, merge to `main` (squash unless this repo says otherwise) and delete the branch. Verify
   the checks yourself; never merge red, pending, cancelled or conflicted.
   *Why: Jondi doesn't review routine PRs, and GitHub Free can't enforce required checks.*
   Detail: `docs/standards/merge-and-review.md`.
3. **Some changes wait for Jondi:** major-version dependency bumps; secrets, runners, deploy or
   release workflows, and `Jondi-Studio/ci` workflows and actions; database or data migrations;
   deleting files, branches or data the task didn't create; anything you're unsure about. Take them
   to green, leave the PR open, say in one line what needs his call. *Why: hard to undo, or they
   affect every repo.*
4. **Never skip, disable, quarantine or weaken a test or check to get green.** A flaky test is a
   bug: fix it. *Why: a green that lies is worse than red.*
5. **Run this repo's local gate before pushing** (named in the repo's AGENTS.md or CLAUDE.md).
   `ci-ok` is the one CI check to watch. *Why: each red push costs a CI cycle on a small runner
   pool.* Detail: `docs/standards/ci-and-testing.md`.
6. **CI runs on self-hosted runners only.** A GitHub-hosted runner needs Jondi's `# hosted:` tag on
   its `runs-on` line, and only he adds it. *Why: Jondi's decision on 2026-10-02, after GitHub
   refused hosted jobs over billing.* Detail: `docs/standards/runners.md`.
7. **Shared skills and agents come only from the `jondis-skills` plugin.** Never copy one into a
   repo. *Why: copies drift.* Detail: `docs/standards/skills-and-agents.md`.
8. **Subagents run on Sonnet** (`claude-sonnet-5-5`). Use Opus only when Jondi asks; use Fable only
   when he names it for that subagent. *Why: Jondi's choice of cost and speed.*
9. **Secrets live in 1Password (Dev vault).** Name the item, never print the value.
   *Why: logs and transcripts are not private.* Detail, including what cloud sessions can't do on
   GitHub: `docs/standards/secrets-and-github.md`. Dependencies: `docs/standards/dependencies.md`.
10. **Jondi works in Windows PowerShell.** Anything he has to run is PowerShell, not bash.
    How to ask him things: `docs/standards/working-with-jondi.md`.

**Precedence:** Jondi's own words in the conversation, then the repo's own AGENTS.md or CLAUDE.md,
then these standards, then a skill's defaults. **Changing a rule:** edit `standards/` in
`Jondi-Studio/ci` and merge; a sync opens a PR in every repo. Never edit `docs/standards/` in a
repo: the next sync overwrites it.
