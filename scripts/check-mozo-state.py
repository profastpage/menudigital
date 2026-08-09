#!/usr/bin/env python3
"""
Verifica el estado actual del MOZO panel en Supabase:
- waiters table schema
- si existen qr_tokens
- si la funcion mozo_public_lookup existe
- si la policy waiters_public_lookup_by_token existe
- si hay mozos activos con qr_token
"""
import psycopg2
import sys

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"

def main():
    print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
            user=DB_USER, password=DB_PASSWORD,
            connect_timeout=20, options="-c search_path=public",
        )
        conn.autocommit = True
        cur = conn.cursor()
        print("✅ Connected\n")
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(1)

    # 1. Waiters table columns
    print("=== waiters table columns ===")
    cur.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name='waiters'
        ORDER BY ordinal_position;
    """)
    for r in cur.fetchall():
        print(f"  {r[0]:<25} {r[1]}")

    # 2. Function mozo_public_lookup?
    print("\n=== Function mozo_public_lookup ===")
    cur.execute("""
        SELECT proname, prosecdef
        FROM pg_proc
        WHERE proname = 'mozo_public_lookup';
    """)
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"  ✅ EXISTS — security_definer={r[1]}")
    else:
        print("  ❌ DOES NOT EXIST — migration not applied")

    # 3. Policy waiters_public_lookup_by_token?
    print("\n=== Policy waiters_public_lookup_by_token ===")
    cur.execute("""
        SELECT polname, polroles::text[], pg_get_expr(polqual, polrelid)
        FROM pg_policy
        WHERE polname = 'waiters_public_lookup_by_token';
    """)
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"  ✅ EXISTS — roles={r[1]} qual={r[2]}")
    else:
        print("  ❌ DOES NOT EXIST — migration not applied")

    # 4. Mozos con qr_token
    print("\n=== Mozos con qr_token (sample 5) ===")
    cur.execute("""
        SELECT id, full_name, is_active, owner_id,
               length(coalesce(qr_token,'')) AS token_len,
               (password IS NOT NULL AND password <> '') AS has_password,
               (pin IS NOT NULL AND pin <> '') AS has_pin
        FROM waiters
        WHERE qr_token IS NOT NULL
        LIMIT 5;
    """)
    rows = cur.fetchall()
    if not rows:
        print("  ❌ NO HAY MOZOS CON QR_TOKEN")
    else:
        for r in rows:
            print(f"  - {r[1][:30]:<30} active={r[2]} token_len={r[4]} pwd={r[5]} pin={r[6]}")

    # 5. Total counts
    print("\n=== Totales ===")
    cur.execute("""
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE qr_token IS NOT NULL) AS with_token,
               COUNT(*) FILTER (WHERE is_active) AS active
        FROM waiters;
    """)
    r = cur.fetchone()
    print(f"  total waiters: {r[0]}")
    print(f"  with qr_token: {r[1]}")
    print(f"  active: {r[2]}")

    cur.close(); conn.close()

if __name__ == "__main__":
    main()
