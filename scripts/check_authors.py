#!/usr/bin/env python3
"""Skill author checker for the agent-skills repository.

Checks that every SKILL.md has an `author` field in its frontmatter,
and provides query / stats / list views grouped by author.

Usage:
  python scripts/check_authors.py [command] [options]

Commands (default: check):
  check    Verify every SKILL.md has an author. Exit code 1 if any missing.
  stats    Count skills per author (sorted by count, then name).
  list     List all skills; filter with --author or --no-author.

Options:
  --author NAME   Filter by author (e.g. "@mattpocock" or "mattpocock"; @ optional)
  --no-author     Show only skills missing an author (check/list)
  --root PATH     Repository root to scan (default: repo root of this file)
  --json          Output machine-readable JSON (stats/list)

Examples:
  python scripts/check_authors.py                  # check all skills
  python scripts/check_authors.py stats            # counts per author
  python scripts/check_authors.py list             # full listing
  python scripts/check_authors.py list --author @mattpocock
  python scripts/check_authors.py list --no-author
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

# Windows GBK consoles cannot print some unicode (e.g. emoji); force utf-8.
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (ValueError, OSError):
        pass

FIELD = "author"


def repo_root(path: Path | None = None) -> Path:
    """Resolve repository root: parent of scripts/ (or explicit --root)."""
    root = (path or Path(__file__).resolve().parent.parent)
    return root


# directories that never hold repo skills: dependency/virtualenv trees and
# VCS internals. Without this the scanner also picks up skills bundled inside
# installed packages (e.g. node_modules/hyperframes/dist/skills/).
SKIP_DIRS = {"node_modules", "venv", ".venv", "site-packages"}


def find_skill_files(root: Path) -> list[Path]:
    """Find all SKILL.md files under root, skipping hidden and vendored dirs."""
    files: list[Path] = []
    for p in root.rglob("SKILL.md"):
        parts = p.relative_to(root).parts[:-1]
        # skip anything under a hidden directory (e.g. .git) or a vendored tree
        if any(part.startswith(".") or part in SKIP_DIRS for part in parts):
            continue
        files.append(p)
    return sorted(files)


def read_author(skill_md: Path) -> str | None:
    """Extract the author field from frontmatter; None if absent or malformed."""
    try:
        text = skill_md.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None
    # normalize line endings so CRLF files parse identically
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return None
    for line in lines[1:]:
        if line.strip() == "---":
            break  # end of frontmatter
        stripped = line.strip()
        if stripped.startswith(FIELD + ":"):
            value = stripped[len(FIELD) + 1:].strip().strip("'\"")
            return value or None
    return None


def normalize(name: str | None) -> str:
    """Normalize author name: lowercase, strip leading '@'."""
    if name is None:
        return ""
    return name.lstrip("@").strip().lower()


def scan(root: Path) -> list[tuple[Path, str | None]]:
    """Return [(skill_md_path, author_or_None), ...] for all skills."""
    return [(f, read_author(f)) for f in find_skill_files(root)]


def cmd_check(entries, args) -> int:
    missing = [(p, a) for p, a in entries if a is None]
    if args.json:
        print(json.dumps({"ok": not missing,
                          "total": len(entries),
                          "missing": [str(p) for p, _ in missing]},
                         indent=2, ensure_ascii=False))
    else:
        if missing:
            print(f"❌ {len(missing)} skill(s) missing author:\n")
            for p, _ in missing:
                print(f"   {p}")
            print(f"\nTotal skills: {len(entries)} | with author: "
                  f"{len(entries) - len(missing)} | missing: {len(missing)}")
        else:
            print(f"All {len(entries)} skills have author attribution.")
    return 1 if missing else 0


def cmd_stats(entries, args) -> int:
    # group by normalized name, but display the author exactly as written in
    # the skill files (first occurrence wins) - do NOT add a "@" ourselves.
    display: dict[str, str] = {}
    counts = Counter()
    for _, a in entries:
        if a is None:
            continue
        norm = normalize(a)
        counts[norm] += 1
        if norm not in display:
            display[norm] = a
    if args.json:
        print(json.dumps({"total": len(entries),
                          "authors": {display[k]: v for k, v in counts.most_common()}},
                         indent=2, ensure_ascii=False))
        return 0
    print(f"Total skills: {len(entries)}\n")
    print("Author            Count")
    print("-" * 30)
    for name, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        print(f"{display[name]:<18} {n:>3}")
    missing = sum(1 for _, a in entries if a is None)
    if missing:
        print(f"{'(no author)':<18} {missing:>3}")
    return 0


def cmd_list(entries, args) -> int:
    target = normalize(args.author) if args.author else None
    rows = []
    for p, a in entries:
        if args.no_author and a is not None:
            continue
        if target and normalize(a) != target:
            continue
        rows.append((p, a))
    if args.json:
        print(json.dumps([{"path": str(p), "author": a} for p, a in rows],
                         indent=2, ensure_ascii=False))
        return 0
    if not rows:
        print("(no matches)")
        return 0
    print(f"{'Author':<18} Skill")
    print("-" * 70)
    for p, a in rows:
        label = a if a else "(no author)"
        print(f"{label:<18} {p}")
    print(f"\n{len(rows)} skill(s)")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check / query / count author attribution of skills.")
    parser.add_argument("command", nargs="?", default="check",
                        choices=["check", "stats", "list"],
                        help="check (default), stats, or list")
    parser.add_argument("--author", metavar="NAME",
                        help='filter by author, e.g. "@mattpocock" (or "mattpocock")')
    parser.add_argument("--no-author", action="store_true",
                        help="list only skills missing an author")
    parser.add_argument("--root", type=Path, default=None,
                        help="repository root to scan (default: parent of scripts/)")
    parser.add_argument("--json", action="store_true",
                        help="machine-readable JSON output")
    args = parser.parse_args()

    root = repo_root(args.root)
    entries = scan(root)
    if not entries:
        print(f"No SKILL.md found under {root}", file=sys.stderr)
        return 1

    if args.command == "check":
        return cmd_check(entries, args)
    if args.command == "stats":
        return cmd_stats(entries, args)
    return cmd_list(entries, args)


if __name__ == "__main__":
    sys.exit(main())
