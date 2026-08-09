#!/usr/bin/env python3
"""
Fix demo-menus HTML files:
1. Add thin styled scrollbar CSS for body/html (the iframe scrollbar in PC view)
2. Replace broken Unsplash image URLs (404) with known-good ones already in the files
"""

import re
from pathlib import Path

DEMOS_DIR = Path("/home/z/my-project/public/demo-menus")

# Thin scrollbar CSS — replaces the body scroll appearance inside iframes on PC
# We add:
#   - html { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.18) transparent; }
#   - ::-webkit-scrollbar { width:6px; height:6px; }
#   - ::-webkit-scrollbar-track { background: transparent; }
#   - ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius:8px; }
#   - ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.32); }
SCROLLBAR_CSS = (
    "html{scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.18) transparent;}"
    "::-webkit-scrollbar{width:6px;height:6px;}"
    "::-webkit-scrollbar-track{background:transparent;}"
    "::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:8px;}"
    "::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.32);}"
)

# Broken Unsplash IDs → working replacement URLs (verified, already used in same files)
# These are all 404s reported by the browser. We replace with similar food photos that work.
IMAGE_REPLACEMENTS = {
    # Salchipapa / Aros de cebolla (broken)
    "photo-1639024471283-03518883578d": "photo-1573080496219-bb080dd4f877",  # papas rústicas (works)
    # Combo Familiar (pollo, broken)
    "photo-1582539691259-d65e85d3f7c8": "photo-1598103442097-8b74394b95c6",  # pollo entero (works)
    # Nigiri de Uni (sushi, broken)
    "photo-1583623025817-d180a2221e0a": "photo-1579584425555-c3ce17fd4351",  # omakase chef (works)
    # ¼ Pollo (broken)
    "photo-1604908554007-3f4b3c8b1b0e": "photo-1626082927389-6cd097cdc6ec",  # ½ pollo (works)
    # Sake (broken)
    "photo-1566448559972-3c5dbd3b0f2e": "photo-1551024709-8f23befc6f87",  # yuzu sour / limonada (works)
    # Inca Kola (broken)
    "photo-1623183784733-9d3d2c0e8b8e": "photo-1437418747212-8d9709afab22",  # limonada frappé (works)
}


def fix_file(path: Path) -> dict:
    content = path.read_text(encoding="utf-8")
    original = content
    changes = []

    # ─── 1. Add thin scrollbar CSS ───
    # Find existing `html{scroll-behavior:smooth;}` and append our scrollbar styles.
    # The minified CSS uses this exact token. If already patched, skip.
    if "scrollbar-width:thin" not in content:
        # Replace `html{scroll-behavior:smooth;}` with the scrollbar-enabled version + webkit pseudo rules
        old_html_rule = "html{scroll-behavior:smooth;}"
        if old_html_rule in content:
            content = content.replace(old_html_rule, SCROLLBAR_CSS, 1)
            changes.append("scrollbar CSS added")
        else:
            # Fallback: insert right after the first <style> opening tag content
            # Find `*{margin:0;padding:0;...}` and insert before it
            match = re.search(r"\*\{margin:0;padding:0;box-sizing:border-box;", content)
            if match:
                insert_pos = match.start()
                content = content[:insert_pos] + SCROLLBAR_CSS + content[insert_pos:]
                changes.append("scrollbar CSS inserted (fallback)")

    # ─── 2. Replace broken Unsplash image IDs ───
    for broken_id, good_id in IMAGE_REPLACEMENTS.items():
        if broken_id in content:
            count = content.count(broken_id)
            content = content.replace(broken_id, good_id)
            changes.append(f"replaced {broken_id} → {good_id} ({count}x)")

    if content != original:
        path.write_text(content, encoding="utf-8")
        return {"file": path.name, "changed": True, "changes": changes}
    return {"file": path.name, "changed": False, "changes": []}


def main():
    print("=" * 60)
    print("Fixing demo-menus HTML files: scrollbar + broken images")
    print("=" * 60)

    html_files = sorted(DEMOS_DIR.glob("*.html"))
    print(f"\nFound {len(html_files)} HTML files\n")

    results = []
    for f in html_files:
        result = fix_file(f)
        results.append(result)
        status = "✓ patched" if result["changed"] else "— no changes"
        print(f"  {status}: {result['file']}")
        for ch in result["changes"]:
            print(f"      • {ch}")

    print("\n" + "=" * 60)
    patched = sum(1 for r in results if r["changed"])
    print(f"Done. Patched {patched}/{len(results)} files.")
    print("=" * 60)


if __name__ == "__main__":
    main()
