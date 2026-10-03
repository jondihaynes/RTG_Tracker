"""Fail on GitHub-hosted runner names in workflows unless the line carries the hosted tag.

Usage: runner_policy.py DIR...  (each DIR is searched for *.yml and *.yaml)
"""

import pathlib
import re
import sys

HOSTED = re.compile(r"\b(?:ubuntu|macos|windows)-(?:latest|\d[\w.-]*)\b")
TAG = re.compile(r"#\s*hosted:\s*\S")


def violations(text: str) -> list[tuple[int, str]]:
    found = []
    for n, line in enumerate(text.splitlines(), 1):
        code, _, comment = line.partition("#")
        if HOSTED.search(code) and not TAG.search("#" + comment):
            found.append((n, line.strip()))
    return found


def main(dirs: list[str]) -> int:
    bad = 0
    for d in dirs:
        root = pathlib.Path(d)
        files = sorted([*root.rglob("*.yml"), *root.rglob("*.yaml")]) if root.is_dir() else []
        for f in files:
            for n, line in violations(f.read_text()):
                print(
                    f"::error file={f},line={n}::GitHub-hosted runner without the hosted tag: {line}"
                )
                bad += 1
    if bad:
        print(
            f"{bad} untagged GitHub-hosted runner(s). Jobs run self-hosted (Jondi-Studio/ci CONTRACT.md, "
            "rule 10); only Jondi adds `# hosted: <why>, Jondi YYYY-MM-DD`."
        )
        return 1
    print("runner policy: ok")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
