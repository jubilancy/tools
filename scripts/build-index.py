#!/usr/bin/env python3
"""
Scans the repo for .html files, cross-references data/tools.json for
category assignments, and regenerates index.html.

- Files listed in tools.json under a category render in that category,
  in the order given.
- Files found on disk but NOT in tools.json (and not in the "ignore"
  list) get bucketed into an auto "Uncategorized / New" section AND
  logged to stdout so the workflow run shows a clear notice.
- Files listed in tools.json that are no longer found on disk are
  skipped silently (removed tool), also logged.

- The generated page includes a live search box (title / filename /
  category match, "/" to focus, Esc to clear, Enter opens first hit,
  ?q= deep links). Its HTML/CSS/JS live in the SEARCH_* constants below.

Run from the repo root: python scripts/build-index.py
"""

import json
import os
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = REPO_ROOT / "data" / "tools.json"
INDEX_PATH = REPO_ROOT / "index.html"

# directories to never walk into
SKIP_DIRS = {".git", ".github", "node_modules", "scripts", "data", ".vscode"}


def humanize_filename(filename: str) -> str:
    """Fallback title for files not in the manifest."""
    name = Path(filename).stem
    name = re.sub(r"[-_]+", " ", name)
    # title-case but preserve existing acronym-y caps if already present
    words = name.split(" ")
    out = []
    for w in words:
        if w.isupper() and len(w) > 1:
            out.append(w)
        else:
            out.append(w.capitalize())
    return " ".join(out).strip()


def find_html_files() -> set:
    found = set()
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for fname in filenames:
            if fname.lower().endswith(".html"):
                rel = os.path.relpath(os.path.join(dirpath, fname), REPO_ROOT)
                rel = rel.replace(os.sep, "/")
                found.add(rel)
    return found


def load_manifest() -> dict:
    if not MANIFEST_PATH.exists():
        return {"categories": [], "ignore": []}
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def escape_html(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def build_grid_html(tools: list) -> str:
    lines = ['        <div class="tool-grid">']
    for t in tools:
        href = escape_html(t["file"])
        title = escape_html(t["title"])
        lines.append(f'            <a href="{href}">{title}</a>')
    lines.append("        </div>")
    return "\n".join(lines)


def build_section_html(emoji: str, name: str, tools: list) -> str:
    header = f'        <span class="section-title">{emoji} {escape_html(name)}</span>'
    grid = build_grid_html(tools)
    return header + "\n" + grid


# ---------------------------------------------------------------------------
# Search UI. These are plain (non-f) strings interpolated into the page
# template below, so braces here do NOT need doubling.
# ---------------------------------------------------------------------------

SEARCH_CSS = """
        .search-box {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin: 1.5rem 0 0;
        }
        .search-label {
            font-size: 0.85rem;
            font-weight: bold;
            text-transform: uppercase;
            color: var(--puny);
            letter-spacing: 0.05em;
        }
        #tool-search {
            border-radius: 4px;
            font-size: 0.95rem;
        }
        #tool-search:focus {
            outline: none;
            border-color: var(--accent);
        }
        .search-hidden {
            display: none !important;
        }
"""

SEARCH_HTML = """        <div class="search-box">
            <label class="search-label" for="tool-search">Search</label>
            <input type="text" id="tool-search" placeholder="type to filter tools..." autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
            <div class="puny" id="search-count" aria-live="polite"></div>
        </div>
        <p class="puny search-hidden" id="search-empty"></p>
"""

SEARCH_JS = """
        (function () {
            const input = document.getElementById('tool-search');
            const countEl = document.getElementById('search-count');
            const emptyEl = document.getElementById('search-empty');
            if (!input || !countEl || !emptyEl) return;

            const HIDE = 'search-hidden';

            const norm = (s) => s.normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
            const safeDecode = (s) => { try { return decodeURIComponent(s); } catch (e) { return s; } };

            // Build an index once: each category, and each tool link inside it.
            const groups = Array.from(document.querySelectorAll('main .section-title'))
                .map((title) => {
                    const grid = title.nextElementSibling;
                    if (!grid || !grid.classList.contains('tool-grid')) return null;
                    const items = Array.from(grid.querySelectorAll('a')).map((a) => {
                        const file = safeDecode(a.getAttribute('href') || '')
                            .replace(/\\.html$/i, '')
                            .replace(/[-_]+/g, ' ');
                        return { el: a, text: norm(a.textContent + ' ' + file) };
                    });
                    return { title, grid, items, label: norm(title.textContent) };
                })
                .filter(Boolean);

            const total = groups.reduce((n, g) => n + g.items.length, 0);

            function apply(raw) {
                const terms = norm(raw).split(/\\s+/).filter(Boolean);
                let shown = 0;

                groups.forEach((g) => {
                    let groupShown = 0;
                    g.items.forEach((item) => {
                        // every term must hit the tool's title/filename OR its category name
                        const ok = terms.every((t) => item.text.includes(t) || g.label.includes(t));
                        item.el.classList.toggle(HIDE, !ok);
                        if (ok) groupShown++;
                    });
                    g.title.classList.toggle(HIDE, groupShown === 0);
                    g.grid.classList.toggle(HIDE, groupShown === 0);
                    shown += groupShown;
                });

                if (!terms.length) {
                    countEl.textContent = total + ' tools \\u2022 press / to search, esc to clear';
                    emptyEl.classList.add(HIDE);
                } else {
                    countEl.textContent = 'showing ' + shown + ' of ' + total;
                    if (shown === 0) {
                        emptyEl.textContent = 'no tools match \\u201c' + raw.trim() + '\\u201d. try fewer or shorter words.';
                        emptyEl.classList.remove(HIDE);
                    } else {
                        emptyEl.classList.add(HIDE);
                    }
                }

                // keep the query shareable / restorable via ?q=
                try {
                    const url = new URL(window.location.href);
                    if (raw.trim()) url.searchParams.set('q', raw.trim());
                    else url.searchParams.delete('q');
                    history.replaceState(null, '', url);
                } catch (e) { /* non-critical */ }
            }

            const firstVisible = () => document.querySelector('.tool-grid a:not(.' + HIDE + ')');

            input.addEventListener('input', () => apply(input.value));

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (input.value) { input.value = ''; apply(''); }
                    else input.blur();
                } else if (e.key === 'Enter' && input.value.trim()) {
                    const hit = firstVisible();
                    if (hit) hit.click();
                } else if (e.key === 'ArrowDown') {
                    const hit = input.value.trim() && firstVisible();
                    if (hit) { e.preventDefault(); hit.focus(); }
                }
            });

            // "/" jumps to the search box from anywhere (unless already typing somewhere)
            document.addEventListener('keydown', (e) => {
                if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
                const t = e.target;
                if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
                e.preventDefault();
                input.focus();
                input.select();
            });

            // restore ?q= on load
            const initial = new URLSearchParams(window.location.search).get('q');
            if (initial) input.value = initial;
            apply(input.value);
        })();
"""


def main():
    manifest = load_manifest()
    ignore_set = set(manifest.get("ignore", []))
    categories = manifest.get("categories", [])

    on_disk = find_html_files()
    manifest_files = set()
    for cat in categories:
        for t in cat["tools"]:
            manifest_files.add(t["file"])

    # files on disk, not ignored, not yet in manifest
    uncategorized = sorted(on_disk - manifest_files - ignore_set)

    # files in manifest but missing from disk (stale entries)
    stale = sorted(manifest_files - on_disk)

    if uncategorized:
        print(f"::warning::{len(uncategorized)} tool(s) found without a category in data/tools.json:")
        for f in uncategorized:
            print(f"  - {f}")
        print("Add these to data/tools.json to file them under a real category.")
    if stale:
        print(f"::notice::{len(stale)} manifest entr(y/ies) point to files no longer on disk (skipped):")
        for f in stale:
            print(f"  - {f}")

    sections_html = []
    for cat in categories:
        live_tools = [t for t in cat["tools"] if t["file"] in on_disk]
        if not live_tools:
            continue
        sections_html.append(build_section_html(cat.get("emoji", ""), cat["name"], live_tools))

    if uncategorized:
        auto_tools = [{"file": f, "title": humanize_filename(f)} for f in uncategorized]
        sections_html.append(build_section_html("🆕", "Uncategorized / New", auto_tools))

    body_sections = "\n\n".join(sections_html)

    total_tools = sum(len(cat["tools"]) for cat in categories if cat["tools"]) + len(uncategorized)
    # recompute accurately from what actually rendered
    total_tools = sum(
        len([t for t in cat["tools"] if t["file"] in on_disk]) for cat in categories
    ) + len(uncategorized)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>toolbox | tools.eliana.lol</title>
    <link rel="stylesheet" href="global.css">
    <link rel="icon" type="image/x-icon" href="favicon.svg">
    <style>
        body {{
            font-size: 1.05rem;
        }}
        .tool-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 1rem;
        }}
        .tool-grid a {{
            border: 1px solid var(--puny);
            padding: 10px 12px;
            font-size: 1rem;
            border-bottom: 1px solid var(--puny);
            display: block;
        }}
        .tool-grid a:hover {{
            border-color: var(--text);
            background: var(--hover);
        }}
        .section-title {{
            margin-top: 2rem;
            font-size: 1.05rem;
        }}
        h1 {{
            font-size: 1.5rem;
        }}
{SEARCH_CSS}    </style>
</head>
<body>
    <nav>
        <div class="left">
            <a href="index.html">home</a> |
            <a href="extra.html">extra</a> |
            <a href="credits.html">credits</a> |
            <a href="changelog.html">logs</a>
        </div>
        <div class="right">
            <button id="theme-toggle">[theme]</button> |
            <a href="https://eliana.lol">site</a>
        </div>
    </nav>

    <main>
        <h1>Toolbox</h1>
        <p class="puny">A collection of single-purpose utilities for the small web. {total_tools} tools and counting.</p>

        <div class="changelog-marquee">
            <strong>DIRECTORY:</strong> Auto-generated on every push — categories are managed in <code>data/tools.json</code>.
        </div>

{SEARCH_HTML}
{body_sections}
    </main>

    <footer style="margin-top: 4rem; text-align: center;" class="puny">
        © 2026 eliana.lol • built with intent
    </footer>

    <script>
        const html = document.documentElement;
        const toggle = document.getElementById('theme-toggle');
        const saved = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        html.setAttribute('data-theme', saved);
        if (toggle) toggle.innerText = saved === 'dark' ? '[light]' : '[dark]';
        if (toggle) {{
            toggle.onclick = () => {{
                const now = html.getAttribute('data-theme');
                const next = now === 'dark' ? 'light' : 'dark';
                html.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
                toggle.innerText = next === 'dark' ? '[light]' : '[dark]';
            }};
        }}
    </script>

    <script>{SEARCH_JS}    </script>
</body>
</html>
"""

    INDEX_PATH.write_text(html, encoding="utf-8")
    print(f"Wrote {INDEX_PATH} ({total_tools} tools across {len(sections_html)} sections)")


if __name__ == "__main__":
    sys.exit(main())
