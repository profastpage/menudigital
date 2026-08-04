#!/usr/bin/env python3
"""
Apply add-hybrid-style.sql migration to production Supabase DB.
Adds theme_hybrid_style, theme_hybrid_config, theme_sticky_top_bar columns to menus table.
Idempotent — safe to run multiple times.
"""
import psycopg2
import sys

# Production DB connection (same as create-comandas-views.py)
conn = psycopg2.connect(
    host='aws-0-sa-east-1.pooler.supabase.com', port=5432,
    dbname='postgres', user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500', sslmode='require', connect_timeout=15,
)
conn.autocommit = True
cur = conn.cursor()

print("🔌 Connected to production Supabase DB")

# 1. theme_hybrid_style
cur.execute("""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menus' AND column_name = 'theme_hybrid_style'
  ) THEN
    ALTER TABLE menus ADD COLUMN theme_hybrid_style BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;
""")
print("✅ theme_hybrid_style column ready")

# 2. theme_hybrid_config
cur.execute("""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menus' AND column_name = 'theme_hybrid_config'
  ) THEN
    ALTER TABLE menus ADD COLUMN theme_hybrid_config TEXT;
  END IF;
END $$;
""")
print("✅ theme_hybrid_config column ready")

# 3. theme_sticky_top_bar
cur.execute("""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menus' AND column_name = 'theme_sticky_top_bar'
  ) THEN
    ALTER TABLE menus ADD COLUMN theme_sticky_top_bar BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;
""")
print("✅ theme_sticky_top_bar column ready")

# Comments
cur.execute("COMMENT ON COLUMN menus.theme_hybrid_style IS 'Activa modo híbrido: cada categoría puede tener su propio estilo (carousel, list, classic)';")
cur.execute("COMMENT ON COLUMN menus.theme_hybrid_config IS 'JSON con configuración per-categoría: {\"0\":\"carousel\",\"1\":\"list\",\"2\":\"classic\"}. Keys = sort_order de categoría';")
cur.execute("COMMENT ON COLUMN menus.theme_sticky_top_bar IS 'Barra inferior sticky delgada con botón Subir al inicio. Default true. Visible en desktop';")

# Verify
cur.execute("""
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'menus' AND column_name IN (
  'theme_hybrid_style', 'theme_hybrid_config', 'theme_sticky_top_bar'
)
ORDER BY column_name;
""")
rows = cur.fetchall()
print(f"\n📊 Verification — {len(rows)} columns present:")
for r in rows:
    print(f"  - {r[0]}: {r[1]}, nullable={r[2]}, default={r[3]}")

# Count menus
cur.execute("SELECT COUNT(*) FROM menus;")
total = cur.fetchone()[0]
print(f"\n📋 Total menus in DB: {total}")
print("✅ Migration complete. All existing menus now have access to hybrid mode + sticky bar.")

cur.close()
conn.close()
