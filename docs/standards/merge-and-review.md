<!-- Synced from Jondi-Studio/ci standards/topics/merge-and-review.md. Don't edit here; change it there. -->

# Merge and review

Agreed with Jondi 2026-10-01: he does not review or merge routine PRs. Agents do, under these rules.

## The loop

1. Work on a branch (never commit straight to `main`) and open a PR, not a draft: cloud sessions
   can't mark a draft ready.
2. Push, wait for CI, fix whatever failed and whatever a review comment or review bot asks, push
   again. Repeat until every check on the head commit has passed. There is no round limit.
3. Verify it yourself, because private repos on GitHub Free can't enforce required checks:
   - every check run on the head SHA is `success` or `skipped`, including `ci-ok`:
     `gh api repos/<owner>/<repo>/commits/<sha>/check-runs --jq '.check_runs[] | "\(.name) \(.status) \(.conclusion)"'`
   - the PR is mergeable with no conflict: `gh api repos/<owner>/<repo>/pulls/<n> --jq .mergeable_state`
     (never `dirty`).
4. Merge: `gh api -X PUT repos/<owner>/<repo>/pulls/<n>/merge -f merge_method=squash`.
   Then delete the branch (or rely on the repo's auto-delete setting; cloud sessions get 403 on
   branch deletes).

Never merge with a check failed, pending or cancelled, and never close and reopen a PR or push an
empty commit to kick CI.

## Merge style

- **Squash** by default.
- **Merge commit** where the repo says so (maths), and for a whole-repo reformat: the reformat is its
  own commit, listed in `.git-blame-ignore-revs`, so it must survive the merge.
- Never rewrite history on someone else's branch (no rebase, amend or force-push there); bring the
  base in with a merge commit.

## What waits for Jondi

Take these to green too, then leave the PR open and say in one line what needs his call:

- major-version dependency bumps
- changes to secrets, runners, deploy or release workflows
- changes to `Jondi-Studio/ci` workflows and actions (every repo runs them)
- database or data migrations
- deleting files, branches or data the task didn't create
- anything you are not confident about

Docs-only changes (including these standards) are routine.

## Reviews

- Address every review comment: push the fix, or reply on the thread saying why not.
- A finding from a review bot is a bug report: verify it and fix it. Optional or nit findings get a
  one-line reply and ride along with the next real push.
- Re-request a human reviewer after pushing for their requested changes.

## PR descriptions

Use the repo's PR template if it has one. Otherwise open with a "Before:" paragraph and an
"After:" paragraph in plain language, then a short "How". Assign Jondi (`jondihaynes`); requesting
him as reviewer fails (422) because cloud PRs are opened as him.
