<!-- Synced from Jondi-Studio/ci standards/topics/runners.md. Don't edit here; change it there. -->

# Runners

Rule (Jondi, 2026-10-03): **every CI job runs on self-hosted runners. There is no other option.**
GitHub-hosted runners can't be used in any repo, for any job, and agents don't propose them.

- The shared Linux pool is `runs-on: [self-hosted, linux, linux-ci]`: WSL runners on Jondi's PC
  (distro `gh-runner`). The image is plain Ubuntu with git, python and uv; jobs install Node with
  `actions/setup-node` and shellcheck or pwsh with `Jondi-Studio/ci/actions/setup-tools`.
- The Macs (air-1, air-2) join runs through git-runner's work stealing (`ci-plan`, `steal`).
  Labels and pools are listed in the git-runner README.
- Capacity is small, so jobs queue; selective CI keeps the queue short.
- When the runners are busy or off, jobs queue. That is a runner problem, not a code failure: say
  so, and wait or raise it in the self-hosted CI infrastructure work.
- Public repos (RTG_Tracker, t-display-s3-amoled-164-base): a pull request from a fork must never
  run on a self-hosted runner, because its code would run on Jondi's machines. So their
  workflows must skip fork pull requests, and only branches in the repo itself run CI.

Changes to runners, their labels or registration wait for Jondi (see `docs/standards/merge-and-review.md`).
