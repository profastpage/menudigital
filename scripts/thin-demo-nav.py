#!/usr/bin/env python3
"""
Hace más delgada la barra de navegación de categorías (.nav) en los 6 HTMLs demo.

Cambios:
  .nav          padding: 14px 0  → 8px 0      (antes ~50px, ahora ~30px)
  .nav-inner    gap: 8px         → 6px
                 padding: 0 20px → 0 14px
  .nav-item     padding: 8px 18px → 5px 13px
                 font-size: 13.5px → 12px
                 border-radius: 24px → 18px

Idempotente: si los nuevos valores ya están, no los vuelve a tocar.
"""
import re
from pathlib import Path

DEMOS_DIR = Path("/home/z/my-project/public/demo-menus")

# (regex_pattern, replacement) — matchean el CSS minificado exacto
REPLACEMENTS = [
    # .nav padding 14px 0 → 8px 0
    (
        r'\.nav\{position:sticky;top:0;background:rgba\(7,7,11,0\.78\);backdrop-filter:blur\(20px\) saturate\(180%\);-webkit-backdrop-filter:blur\(20px\) saturate\(180%\);border-bottom:1px solid var\(--border\);z-index:100;padding:14px 0;overflow-x:auto;scrollbar-width:none;\}',
        '.nav{position:sticky;top:0;background:rgba(7,7,11,0.85);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid var(--border);z-index:100;padding:8px 0;overflow-x:auto;scrollbar-width:none;}',
    ),
    # .nav-inner gap 8px → 6px, padding 0 20px → 0 14px
    (
        r'\.nav-inner\{display:flex;gap:8px;padding:0 20px;min-width:max-content;\}',
        '.nav-inner{display:flex;gap:6px;padding:0 14px;min-width:max-content;}',
    ),
    # .nav-item padding 8px 18px → 5px 13px, font-size 13.5 → 12, radius 24 → 18
    (
        r'\.nav-item\{white-space:nowrap;padding:8px 18px;background:var\(--glass\);border:1px solid var\(--border\);border-radius:24px;color:var\(--text-soft\);font-size:13\.5px;font-weight:500;cursor:pointer;transition:all 0\.25s cubic-bezier\(0\.4,0,0\.2,1\);\}',
        '.nav-item{white-space:nowrap;padding:5px 13px;background:var(--glass);border:1px solid var(--border);border-radius:18px;color:var(--text-soft);font-size:12px;font-weight:500;cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);}',
    ),
    # .nav-item:hover transform:translateY(-1px) → translateY(0) (less visual jump on a thin bar)
    (
        r'\.nav-item:hover\{background:var\(--glass-strong\);color:var\(--text\);transform:translateY\(-1px\);\}',
        '.nav-item:hover{background:var(--glass-strong);color:var(--text);transform:translateY(0);}',
    ),
    # .nav-item.active box-shadow (smaller for thinner bar)
    (
        r'\.nav-item\.active\{background:linear-gradient\(135deg,var\(--accent\),rgba\(var\(--accent-rgb\),0\.85\)\);color:#fff;border-color:transparent;box-shadow:0 4px 16px rgba\(var\(--accent-rgb\),0\.4\);\}',
        '.nav-item.active{background:linear-gradient(135deg,var(--accent),rgba(var(--accent-rgb),0.85));color:#fff;border-color:transparent;box-shadow:0 2px 10px rgba(var(--accent-rgb),0.35);}',
    ),
]

def process_file(path: Path) -> tuple[int, list[str]]:
    """Returns (number_of_replacements_made, list_of_descriptions)."""
    text = path.read_text(encoding="utf-8")
    changes = []
    new_text = text
    total = 0
    for pattern, replacement in REPLACEMENTS:
        new_text, n = re.subn(pattern, replacement, new_text)
        if n > 0:
            total += n
            changes.append(f"  +{n} × {pattern[:60]}...")
    if total > 0:
        path.write_text(new_text, encoding="utf-8")
    return total, changes

def main():
    print("=== Thinning .nav in demo HTML files ===\n")
    grand_total = 0
    for html in sorted(DEMOS_DIR.glob("*.html")):
        total, changes = process_file(html)
        if total > 0:
            print(f"✅ {html.name}: {total} replacement(s)")
            for c in changes:
                print(c)
            grand_total += total
        else:
            print(f"⏭  {html.name}: no changes (already thinned or pattern not found)")
    print(f"\nTotal: {grand_total} replacement(s) across {len(list(DEMOS_DIR.glob('*.html')))} files")

if __name__ == "__main__":
    main()
