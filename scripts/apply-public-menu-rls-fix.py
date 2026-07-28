#!/usr/bin/env python3
"""
Aplica fix crítico de RLS para menús públicos.
Bug: /r/[slug] devuelve "Menú no encontrado" después de audit-rls-fix.sql.
Fix: Agregar policy menus_select_published que permita SELECT anónimo de is_published=true.
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
    sql_path = base / "supabase" / "fix-public-menu-rls.sql"
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

    print(f"\n=== Applying fix-public-menu-rls.sql ({len(sql)} bytes) ===")
    try:
        cur.execute(sql)
        print("  OK")
    except Exception as e:
        print(f"  ERROR: {e}")
        sys.exit(1)

    # Verificar
    print("\n=== Verification ===")
    cur.execute("""
      SELECT polname, pg_get_expr(polqual, polrelid)
      FROM pg_policy
      JOIN pg_class ON pg_class.oid = pg_policy.polrelid
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE nspname='public' AND relname='menus' AND polcmd='r';
    """)
    print("SELECT policies on menus:")
    for r in cur.fetchall():
        print(f"  - {r[0]}: {r[1]}")

    cur.close(); conn.close()
    print("\n✅ Fix complete — public menus should work now")

if __name__ == "__main__":
    main()
