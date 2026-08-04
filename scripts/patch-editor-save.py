#!/usr/bin/env python3
"""Add hybrid_style + sticky_top_bar to all 3 save() blocks in editor-client.tsx"""
import re

FILE = '/home/z/my-project/src/app/dashboard/[menuId]/editor-client.tsx'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# The pattern: theme_carta_scroll_speed: theme.carta_scroll_speed,
# followed by (either // Redes sociales OR another theme field)
# We want to add 3 new lines after theme_carta_scroll_speed in all 3 places

OLD = "          theme_carta_scroll_speed: theme.carta_scroll_speed,\n"
NEW = (
    "          theme_carta_scroll_speed: theme.carta_scroll_speed,\n"
    "          theme_hybrid_style: theme.hybrid_style,\n"
    "          theme_hybrid_config: JSON.stringify(theme.hybrid_config || {}),\n"
    "          theme_sticky_top_bar: theme.sticky_top_bar,\n"
)
OLD2 = "        theme_carta_scroll_speed: theme.carta_scroll_speed,\n"
NEW2 = (
    "        theme_carta_scroll_speed: theme.carta_scroll_speed,\n"
    "        theme_hybrid_style: theme.hybrid_style,\n"
    "        theme_hybrid_config: JSON.stringify(theme.hybrid_config || {}),\n"
    "        theme_sticky_top_bar: theme.sticky_top_bar,\n"
)

count1 = content.count(OLD)
count2 = content.count(OLD2)
print(f"Found {count1} occurrences of 10-space variant")
print(f"Found {count2} occurrences of 8-space variant")

content = content.replace(OLD, NEW)
content = content.replace(OLD2, NEW2)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done. All 3 save blocks updated with hybrid + sticky fields.")
