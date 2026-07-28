#!/usr/bin/env python3
"""
Aplica las 2 migraciones pendientes a Supabase producción:
1. supabase/audit-rls-fix.sql         — FORCE RLS en 16 tablas + storage + helper
2. supabase/add-onboarding-fields.sql  — columnas onboarding en profiles
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
    "supabase/audit-rls-fix.sql",
    "supabase/add-onboarding-fields.sql",
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

    print("OK connected.\n")

    for path in MIGRATIONS:
        full = base / path
        print(f"=== Applying {path} ===")
        if not full.exists():
            print(f"  MISSING FILE: {full}")
            continue
        sql = full.read_text(encoding="utf-8")
        try:
            cur.execute(sql)
            print(f"  OK ({len(sql)} bytes applied)\n")
        except Exception as e:
            print(f"  ERROR: {e}\n")
            # Continue with next migration — each is idempotent

    # Verify RLS state
    print("=== Verifying RLS state ===")
    cur.execute("""
        SELECT relname, relrowsecurity
        FROM pg_class
        WHERE relname IN (
          'menus','categories','menu_items','menu_item_options','menu_item_option_items',
          'branches','tables','waiters','orders','order_items','order_status_history',
          'inventory_items','inventory_movements','product_recipes','voucher_prints',
          'profiles','subscriptions','custom_domains'
        )
        AND relkind='r'
        ORDER BY relname;
    """)
    rows = cur.fetchall()
    enabled = 0
    disabled = 0
    for name, rls in rows:
        flag = "OK" if rls else "MISSING"
        print(f"  {flag:8} {name}: relrowsecurity={rls}")
        if rls:
            enabled += 1
        else:
            disabled += 1
    print(f"\n  Summary: {enabled} tables with RLS, {disabled} without")

    # Verify onboarding fields
    print("\n=== Verifying onboarding columns on profiles ===")
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='profiles'
          AND column_name IN ('onboarding_completed_at','phone','business_name','business_type')
        ORDER BY column_name;
    """)
    rows = cur.fetchall()
    for col, dtype in rows:
        print(f"  OK {col} :: {dtype}")
    if len(rows) < 4:
        print(f"  WARNING: only {len(rows)}/4 columns present")

    cur.close()
    conn.close()
    print("\nDONE.")

if __name__ == "__main__":
    main()
