#!/usr/bin/env python3
"""
Enable hybrid mode on the demofull menu (polleria-full) for testing.
Sets theme_hybrid_style=true and theme_hybrid_config with mixed styles per category.
"""
import psycopg2
import json

conn = psycopg2.connect(
    host='aws-0-sa-east-1.pooler.supabase.com', port=5432,
    dbname='postgres', user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500', sslmode='require', connect_timeout=15,
)
conn.autocommit = True
cur = conn.cursor()

# Get categories for polleria-full menu
cur.execute("""
SELECT id, name, sort_order FROM categories
WHERE menu_id = (SELECT id FROM menus WHERE slug = 'polleria-full')
ORDER BY sort_order
""")
cats = cur.fetchall()
print(f"Categories for polleria-full: {len(cats)}")
for c in cats:
    print(f"  {c[2]}: {c[1]}")

# Build hybrid config: alternate styles
# 0: carousel, 1: list, 2: classic, 3: carousel, 4: list
config = {}
styles = ['carousel', 'list', 'classic', 'carousel', 'list']
for i, c in enumerate(cats):
    config[str(i)] = styles[i % len(styles)]

config_json = json.dumps(config)
print(f"\nHybrid config: {config_json}")

# Update menu
cur.execute("""
UPDATE menus
SET theme_hybrid_style = TRUE,
    theme_hybrid_config = %s,
    theme_carta_style = FALSE,
    theme_carta_list_style = FALSE
WHERE slug = 'polleria-full'
""", (config_json,))

print(f"\n✅ Updated polleria-full menu with hybrid mode:")
print(f"   cat-0 (Pollos a la Brasa): carousel")
print(f"   cat-1 (Pollo Broaster): list")
print(f"   cat-2 (Guarniciones): classic")
print(f"   cat-3 (Combos): carousel")
print(f"   cat-4 (Bebidas): list")

# Verify
cur.execute("SELECT theme_hybrid_style, theme_hybrid_config FROM menus WHERE slug = 'polleria-full'")
row = cur.fetchone()
print(f"\nVerified: hybrid_style={row[0]}, config={row[1]}")

cur.close()
conn.close()
