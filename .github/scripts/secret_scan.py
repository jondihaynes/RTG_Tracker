"""Run gitleaks over the lines a unified diff adds, keeping each line's own file and line number.

Every added line is written to a scratch tree at its path and line number (the lines in between left
blank), and gitleaks scans that tree as a directory. Findings then name the real file and line, and
the repo's own `.gitleaks.toml` and `.gitleaksignore` apply, path allowlists included. Matches stay
redacted: CI logs are readable by anyone who can read the repo, and for a public repo that is
everyone.
"""

import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")
REPO_CONFIG = (".gitleaks.toml", ".gitleaksignore")


def added_lines(diff: str) -> dict[str, dict[int, str]]:
    """{file: {line in the new file: text}} for every line the diff adds."""
    out: dict[str, dict[int, str]] = {}
    path, line = None, 0
    for raw in diff.splitlines():
        if raw.startswith("+++ "):
            path = raw[6:] if raw.startswith("+++ b/") else None
        elif m := HUNK.match(raw):
            line = int(m.group(1))
        elif raw.startswith("+") and path:
            out.setdefault(path, {})[line] = raw[1:]
            line += 1
    return out


def write_tree(root: pathlib.Path, added: dict[str, dict[int, str]]) -> None:
    for path, lines in added.items():
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        last = max(lines)
        target.write_text("".join(lines.get(n, "") + "\n" for n in range(1, last + 1)))


def main(gitleaks: str, diff_path: str, repo: str = ".") -> int:
    with open(diff_path, encoding="utf-8", errors="replace") as f:
        added = added_lines(f.read())
    count = sum(len(lines) for lines in added.values())
    if not count:
        print("secret-scan: no added lines to scan")
        return 0
    with tempfile.TemporaryDirectory() as tmp:
        root = pathlib.Path(tmp) / "tree"
        write_tree(root, added)
        for name in REPO_CONFIG:
            if os.path.isfile(os.path.join(repo, name)):
                shutil.copy(os.path.join(repo, name), root / name)
        report = pathlib.Path(tmp) / "report.json"
        cmd = [gitleaks, "dir", ".", "--redact", "--no-banner", "--exit-code", "0",
               "--report-format", "json", "--report-path", str(report)]  # fmt: skip
        proc = subprocess.run(cmd, cwd=root, text=True, capture_output=True)
        if proc.returncode != 0:
            sys.stderr.write(proc.stdout + proc.stderr)
            return proc.returncode
        findings = json.loads(report.read_text())
    for leak in findings:
        path = os.path.relpath(leak["File"], root) if os.path.isabs(leak["File"]) else leak["File"]
        print(f"::error file={path},line={leak['StartLine']}::gitleaks {leak['RuleID']}: "
              f"{leak['Description']}")  # fmt: skip
    print(f"secret-scan: {count} added lines in {len(added)} files, {len(findings)} finding(s)")
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main(*sys.argv[1:]))
