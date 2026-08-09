#!/usr/bin/env python3
"""
Aplica la migracion mozo-public-access.sql a Supabase PRODUCCION.
Esto hace que /mozo/[token] funcione sin login (acceso externo del MOZO).

Crea:
1) Function SECURITY DEFINER mozo_public_lookup(p_token)
2) RLS Policy waiters_public_lookup_by_token

Combinado con createServiceClient() (que bypassa RLS), /mozo/[token] funciona.
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
    sql_path = base / "supabase" / "mozo-public-access.sql"
    sql = sql_path.read_text(encoding="utf-8")

    print(f"Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME}...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
            user=DB_USER, password=DB_PASSWORD,
            connect_timeout=20, options="-c search_path=public",
        )
        conn.autocommit = True
        cur = conn.cursor()
    except Exception as e:
        print(f"FAIL: {e}")
        sys.exit(1)

    print(f"\n=== Applying mozo-public-access.sql ({len(sql)} bytes) ===")
    try:
        cur.execute(sql)
        print("  OK")
    except Exception as e:
        print(f"  ERROR: {e}")
        sys.exit(1)

    # Verificar function
    print("\n=== Verification: function ===")
    cur.execute("""
        SELECT proname, prosecdef
        FROM pg_proc
        WHERE proname = 'mozo_public_lookup';
    """)
    for r in cur.fetchall():
        print(f"  ✅ function mozo_public_lookup exists (security_definer={r[1]})")

    # Verificar policy
    print("\n=== Verification: policy ===")
    cur.execute("""
        SELECT polname, polroles::text[], pg_get_expr(polqual, polrelid)
        FROM pg_policy
        WHERE polname = 'waiters_public_lookup_by_token';
    """)
    for r in cur.fetchall():
        print(f"  ✅ policy waiters_public_lookup_by_token exists")
        print(f"     roles={r[1]} qual={r[2]}")

    # Test function with a real token
    print("\n=== Test: call mozo_public_lookup with first token ===")
    cur.execute("SELECT qr_token FROM waiters WHERE qr_token IS NOT NULL LIMIT 1;")
    row = cur.fetchone()
    if row:
        token = row[0]
        print(f"  Using token: {token[:8]}...{token[-4:]}")
        cur.execute("SELECT * FROM mozo_public_lookup(%s);", (token,))
        result = cur.fetchone()
        if result:
            print(f"  ✅ Returned: id={result[0]} name={result[1]} active={result[2]} has_password={result[5]} has_pin={result[6]}")
        else:
            print("  ❌ Function returned NULL")

    cur.close(); conn.close()
    print("\n✅ Migration complete — /mozo/{token} ahora funciona sin login")

if __name__ == "__main__":
    main()
