#!/usr/bin/env python3
"""Prepare a GitHub Pages artifact for an ISOLATED ConsoleGames-Preview repository.

Do not deploy this artifact to the production ConsoleGames Pages site.  This
script changes ONLY files copied to _pages_preview; sources are never rewritten.
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW_REPO = "tsvalencio-IA/ConsoleGames-Preview"
OUTPUT = ROOT / "_pages_preview"
OLD_BASE = "/ConsoleGames/"
NEW_BASE = "/ConsoleGames-Preview/"
TEXT_EXTENSIONS = {
    ".html", ".htm", ".js", ".mjs", ".css", ".json", ".webmanifest",
    ".xml", ".svg", ".txt", ".md", ".webapp",
}
EXCLUDED_DIRS = {
    ".git", ".github", ".venv", "node_modules", "__pycache__",
    "_pages_preview", "test-results", ".pytest_cache",
}
EXCLUDED_ROOT = {
    ".gitignore", "README.md", "tools", "tests", "enhancements",
}
MINIMUM_ROUTES = (
    "index.html", "arcade/index.html", "games/otthi/index.html",
    "games/otthi/app.js", "games/otthi/style.css",
    "games/kart/index.html", "games/boxe/index.html",
    "games/tenis/index.html", "games/ar/index.html",
    "games/voo/index.html", "games/familia/3d/index.html",
    "games/danca/index.html",
)


def ignored(directory: str, names: list[str]) -> set[str]:
    excluded = EXCLUDED_DIRS.intersection(names)
    if Path(directory).resolve() == ROOT:
        excluded |= EXCLUDED_ROOT.intersection(names)
    return excluded


def main() -> None:
    if os.environ.get("GITHUB_REPOSITORY") != PREVIEW_REPO:
        raise SystemExit(
            "SAFETY STOP: GitHub Pages preview may only run in " + PREVIEW_REPO
            + ". The original ConsoleGames/main must not be deployed or changed."
        )
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)
    # Copy the existing console and all game assets without altering their source.
    for child in ROOT.iterdir():
        if child.name in EXCLUDED_DIRS or child.name in EXCLUDED_ROOT:
            continue
        target = OUTPUT / child.name
        if child.is_dir():
            shutil.copytree(child, target, ignore=ignored, symlinks=False)
        elif child.is_file():
            shutil.copy2(child, target)

    changed = 0
    for item in OUTPUT.rglob("*"):
        if not item.is_file() or item.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            original = item.read_text("utf-8")
        except UnicodeError:
            continue
        # Relative GitHub Pages project path; never rewrite Firebase project IDs,
        # login identities, keys or source files.
        revised = original.replace(OLD_BASE, NEW_BASE)
        if revised != original:
            item.write_text(revised, encoding="utf-8")
            changed += 1

    (OUTPUT / ".nojekyll").write_text("", encoding="utf-8")
    for route in MINIMUM_ROUTES:
        if not (OUTPUT / route).is_file():
            raise SystemExit("Missing game route in Pages artifact: " + route)

    print(f"Prepared {OUTPUT}: rewrote paths in {changed} text files.")
    print("This is an isolated Pages project path, not a production deploy.")
    print("WARNING: backend/Firebase and browser origin may still share user data.")


if __name__ == "__main__":
    main()
