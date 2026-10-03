<!-- Synced from Jondi-Studio/ci standards/topics/runners.md. Don't edit here; change it there. -->

# Runners

Rule (Jondi, 2026-10-02): **every CI job runs on self-hosted runners.**

- The shared Linux pool is `runs-on: [self-hosted, linux, linux-ci]`: WSL runners on Jondi's PC
  (distro `gh-runner`). The image is plain Ubuntu with git, python and uv; jobs install Node with
  `actions/setup-node` and shellcheck or pwsh with `Jondi-Studio/ci/actions/setup-tools`.
- The Macs (air-1, air-2) join maths runs through git-runner's work stealing (`ci-plan`, `steal`).
  Labels and pools are listed in the git-runner README.
- Capacity is small (two Linux runners for the whole org), so jobs queue; selective CI keeps the
  queue short.
- When the PC is off, self-hosted jobs queue. That is a runner problem, not a code failure: say so
  rather than moving the job to a hosted runner.

## The hosted tag

A GitHub-hosted runner is allowed only when Jondi asks for it, tagged on the same line:

```yaml
runs-on: ubuntu-latest # hosted: <why>, Jondi YYYY-MM-DD
```

`Jondi-Studio/ci` `actions/runner-policy` (in hygiene) fails untagged hosted runners. Never add the
tag yourself. Today it is used only by the public personal repos (RTG_Tracker and
t-display-s3-amoled-164-base), because a fork PR must never run on a self-hosted runner.

Changes to runners, their labels or registration wait for Jondi (see `docs/standards/merge-and-review.md`).

Rollout note (2026-10-03): the PRs moving each repo onto the `linux-ci` pool (ci #9 and one per
repo) are waiting for Jondi. Until they merge, some workflows and `CONTRACT.md` rule 10 still show
`ubuntu-latest`; the rule above is the decision.
