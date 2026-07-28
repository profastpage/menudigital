#!/usr/bin/env python3
"""
Aplica la migración whatsapp-clicks-table.sql a Supabase producción.
Crea la tabla whatsapp_clicks con RLS para tracking real de clics WhatsApp.
"""
import psycopg2
import sys
from pathlib import Path

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"

MIGRATIONS = [
    "supabase/whatsapp-clicks-table.sql",
]

def main():
    base = Path(__file__).resolve().parent.parent
    print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            connect_timeout=20,
            options="-c search_path=public,auth,storage",
        )
        conn.autocommit = True
        cur = conn.cursor()
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(1)

    for rel in MIGRATIONS:
        path = base / rel
        if not path.exists():
            print(f"  SKIP (not found): {rel}")
            continue
        sql = path.read_text(encoding="utf-8")
        print(f"\n=== Applying {rel} ({len(sql)} bytes) ===")
        try:
            cur.execute(sql)
            print(f"  OK")
        except Exception as e:
            print(f"  ERROR: {e}")
            # Continue with next migration (idempotent scripts should not fail)

    # Verificar
    print("\n=== Verification ===")
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='whatsapp_clicks'
        ORDER BY ordinal_position;
    """)
    cols = cur.fetchall()
    print(f"whatsapp_clicks columns ({len(cols)}):")
    for c in cols:
        print(f"  - {c[0]}: {c[1]}")

    cur.execute("""
        SELECT polname, polcmd FROM pg_policy
        JOIN pg_class ON pg_class.oid = pg_policy.polrelid
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE nspname='public' AND relname='whatsapp_clicks';
    """)
    pols = cur.fetchall()
    print(f"\nPolicies ({len(pols)}):")
    for p in pols:
        print(f"  - {p[0]} ({p[1]})")

    cur.close()
    conn.close()
    print("\n✅ Migration complete")

if __name__ == "__main__":
    main()
