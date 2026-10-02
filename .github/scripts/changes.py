# Copy of Jondi-Studio/ci actions/changes/changes.py (this repo cannot call the private org repo).
"""Decide which parts of the gate a change needs. Standard library only, so it runs on any runner.

`FILTERS` holds one filter per line, `name: pattern pattern ...`, and a name may repeat over several
lines. Patterns are gitignore-style globs (`*` within a path segment, `**` across segments, a
pattern with no `/` matches a file name at any depth); a leading `!` excludes. A file belongs to a
filter when it matches one of its include patterns (every file does, if it has none) and none of
its excludes. The answer is a JSON object of filter name to true or false.

Only a pull request is ever narrowed: any other event (a push to main, a manual run) answers true
for every filter, because main always runs the whole gate (CONTRACT.md, rule 1). So does a pull
request whose changes can't be read, so a mistake here costs time, never coverage.
"""

import json
import os
import re
import subprocess
import sys

PR_EVENTS = {"pull_request", "pull_request_target"}


def parse(text: str) -> dict[str, list[str]]:
    filters: dict[str, list[str]] = {}
    for raw in text.splitlines():
        line = raw.split(" #", 1)[0].strip()
        if not line or line.startswith("#"):
            continue
        name, sep, patterns = line.partition(":")
        name = name.strip()
        if not sep or not re.fullmatch(r"[A-Za-z_][\w-]*", name):
            raise ValueError(f"not `name: pattern ...`: {raw!r}")
        filters.setdefault(name, []).extend(patterns.split())
    if not filters:
        raise ValueError("no filters given")
    return filters


def translate(pattern: str) -> re.Pattern[str]:
    anchored = "/" in pattern.rstrip("/")
    pattern = pattern.strip("/")
    out, i = [], 0
    while i < len(pattern):
        if pattern.startswith("**/", i):
            out.append("(?:.*/)?")
            i += 3
        elif pattern.startswith("**", i):
            out.append(".*")
            i += 2
        elif pattern[i] == "*":
            out.append("[^/]*")
            i += 1
        elif pattern[i] == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(pattern[i]))
            i += 1
    body = "".join(out)
    # A directory pattern also matches everything under it.
    return re.compile(("" if anchored else "(?:.*/)?") + body + "(?:/.*)?")


def matches(files: list[str], patterns: list[str]) -> list[str]:
    include = [translate(p) for p in patterns if not p.startswith("!")]
    exclude = [translate(p[1:]) for p in patterns if p.startswith("!")]
    return [
        f
        for f in files
        if (not include or any(r.fullmatch(f) for r in include))
        and not any(r.fullmatch(f) for r in exclude)
    ]


def changed_files() -> list[str] | None:
    """The pull request's files: its merge commit against the base it merges into."""
    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", "--no-renames", "HEAD^1", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout
        subprocess.run(
            ["git", "rev-parse", "-q", "--verify", "HEAD^2"], capture_output=True, check=True
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return [line for line in out.splitlines() if line]


def decide(filters: dict[str, list[str]], files: list[str] | None) -> dict[str, list[str] | None]:
    """Each filter's matching files, or None for "run it": not a narrowable event."""
    if files is None:
        return {name: None for name in filters}
    return {name: matches(files, patterns) for name, patterns in filters.items()}


def main() -> int:
    try:
        filters = parse(os.environ.get("FILTERS", ""))
    except ValueError as e:
        print(f"changes: {e}")
        return 1
    event = os.environ.get("EVENT", "")
    files, reason = None, f"`{event}` runs the whole gate"
    if event in PR_EVENTS:
        files = changed_files()
        reason = (
            "couldn't read the PR's changes (check out with `fetch-depth: 2`), so everything runs"
            if files is None
            else f"{len(files)} file(s) changed in this pull request"
        )
    picked = decide(filters, files)
    answer = {name: hits is None or bool(hits) for name, hits in picked.items()}

    lines = [f"### changes: {reason}", ""]
    for name, hits in picked.items():
        if hits is None:
            lines.append(f"- **{name}**: runs")
        elif hits:
            shown = ", ".join(f"`{h}`" for h in hits[:5]) + (", ..." if len(hits) > 5 else "")
            lines.append(f"- **{name}**: runs ({shown})")
        else:
            lines.append(f"- **{name}**: skipped, nothing it covers changed")
    print("\n".join(lines))
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a") as f:
            f.write("\n".join(lines) + "\n\n")
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a") as f:
            f.write(f"changes={json.dumps(answer, separators=(',', ':'))}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
