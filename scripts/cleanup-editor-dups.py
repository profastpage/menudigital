#!/usr/bin/env python3
"""Clean up duplicate hybrid/sticky fields in editor-client.tsx"""
import re

FILE = '/home/z/my-project/src/app/dashboard/[menuId]/editor-client.tsx'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: 3 lines (theme_hybrid_style, theme_hybrid_config, theme_sticky_top_bar)
# followed by another identical 3 lines (with possibly different indent)
# Keep only the version that matches the surrounding indent (10-space)

# Remove 8-space variants that come AFTER 10-space variants (duplicates)
# i.e. lines like:
#   <10sp>theme_carta_scroll_speed: theme.carta_scroll_speed,
#   <8sp>theme_hybrid_style: ...
#   <8sp>theme_hybrid_config: ...
#   <8sp>theme_sticky_top_bar: ...
#   <10sp>theme_hybrid_style: ...    <- keep
#   <10sp>theme_hybrid_config: ...   <- keep
#   <10sp>theme_sticky_top_bar: ...  <- keep

# Simpler: detect sequences of theme_hybrid_style appearing twice within 8 lines, remove the 8-space version
pattern = re.compile(
    r'(\s+)theme_carta_scroll_speed: theme\.carta_scroll_speed,\n'
    r'(\s+)theme_hybrid_style: theme\.hybrid_style,\n'
    r'(\s+)theme_hybrid_config: JSON\.stringify\(theme\.hybrid_config \|\| \{\}\),\n'
    r'(\s+)theme_sticky_top_bar: theme\.sticky_top_bar,\n'
    r'(\s+)theme_hybrid_style: theme\.hybrid_style,\n'
    r'(\s+)theme_hybrid_config: JSON\.stringify\(theme\.hybrid_config \|\| \{\}\),\n'
    r'(\s+)theme_sticky_top_bar: theme\.sticky_top_bar,\n'
)

def replacer(m):
    # Get indent from the first line (theme_carta_scroll_speed)
    indent = m.group(1)
    return (
        f'{indent}theme_carta_scroll_speed: theme.carta_scroll_speed,\n'
        f'{indent}theme_hybrid_style: theme.hybrid_style,\n'
        f'{indent}theme_hybrid_config: JSON.stringify(theme.hybrid_config || {{}}),\n'
        f'{indent}theme_sticky_top_bar: theme.sticky_top_bar,\n'
    )

new_content, count = pattern.subn(replacer, content)
print(f"Removed {count} duplicate(s)")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done.")
