#!/usr/bin/env python3
"""
Aplica fix CRÍTICO de RLS para categories y dishes.
Bug: /r/[slug] muestra menú vacío (sin categorías/platos) — RLS bloquea SELECT anónimo.
"""
import psycopg2
import sys
from pathlib import Path

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"

def main():
    base = Path(__file__).resolve().parent.parent
    sql_path = base / "supabase" / "fix-categories-dishes-rls.sql"
    sql = sql_path.read_text(encoding="utf-8")

    print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
            user=DB_USER, password=DB_PASSWORD,
            connect_timeout=20, options="-c search_path=public,auth,storage",
        )
        conn.autocommit = True
        cur = conn.cursor()
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(1)

    print(f"\n=== Applying fix-categories-dishes-rls.sql ({len(sql)} bytes) ===")
    try:
        cur.execute(sql)
        print("  OK")
    except Exception as e:
        print(f"  ERROR: {e}")
        sys.exit(1)

    # Verificar policies
    print("\n=== Verification ===")
    cur.execute("""
      SELECT relname, polname
      FROM pg_policy
      JOIN pg_class ON pg_class.oid = pg_policy.polrelid
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE nspname='public' AND relname IN ('categories','dishes') AND polcmd='r'
      ORDER BY relname, polname;
    """)
    rows = cur.fetchall()
    print(f"  Policies found ({len(rows)}):")
    for r in rows:
        print(f"    - {r[0]}.{r[1]}")

    # Count actual categories/dishes in chifa menu
    print("\n=== Data check on 'chifa' menu ===")
    cur.execute("""
      SELECT m.name, COUNT(DISTINCT c.id) as cat_count,
             COUNT(DISTINCT d.id) as dish_count
      FROM menus m
      LEFT JOIN categories c ON c.menu_id = m.id
      LEFT JOIN dishes d ON d.category_id = c.id
      WHERE m.slug = 'chifa'
      GROUP BY m.name;
    """)
    row = cur.fetchone()
    if row:
        print(f"  Menu: {row[0]}")
        print(f"  Categories: {row[1]}")
        print(f"  Dishes: {row[2]}")

    cur.close()
    conn.close()
    print("\n✅ DONE")

if __name__ == "__main__":
    main()
