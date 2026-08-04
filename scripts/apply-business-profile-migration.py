#!/usr/bin/env python3
"""
Apply add-business-profile-columns.sql to production Supabase DB.
Idempotent — safe to run multiple times.
"""
import psycopg2
import sys
import re
from pathlib import Path

SQL_FILE = Path("/home/z/my-project/download/add-business-profile-columns.sql")


def split_sql(sql_text: str):
    statements = []
    current = []
    in_dollar = False
    dollar_tag = None
    in_line_comment = False
    in_block_comment = False
    i = 0
    n = len(sql_text)
    while i < n:
        ch = sql_text[i]
        nxt = sql_text[i + 1] if i + 1 < n else ""
        if not in_dollar and not in_block_comment and ch == "-" and nxt == "-":
            in_line_comment = True
            current.append(ch); i += 1; continue
        if in_line_comment:
            if ch == "\n": in_line_comment = False
            current.append(ch); i += 1; continue
        if not in_dollar and not in_line_comment and ch == "/" and nxt == "*":
            in_block_comment = True
            current.append("/*"); i += 2; continue
        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                current.append("*/"); i += 2; continue
            current.append(ch); i += 1; continue
        if not in_line_comment and not in_block_comment and ch == "$":
            m = re.match(r"\$([a-zA-Z_]\w*)?\$", sql_text[i:])
            if m:
                tag = m.group(1) or ""
                full_match = m.group(0)
                if not in_dollar:
                    in_dollar = True; dollar_tag = tag
                    current.append(full_match); i += len(full_match); continue
                else:
                    if tag == dollar_tag:
                        in_dollar = False; dollar_tag = None
                        current.append(full_match); i += len(full_match); continue
                    else:
                        current.append(full_match); i += len(full_match); continue
            else:
                current.append(ch); i += 1; continue
        if not in_dollar and not in_line_comment and not in_block_comment and ch == ";":
            current.append(";")
            stmt = "".join(current).strip()
            if stmt:
                code_lines = [ln for ln in stmt.split("\n") if ln.strip() and not ln.strip().startswith("--")]
                if code_lines: statements.append(stmt)
            current = []; i += 1; continue
        current.append(ch); i += 1
    if current:
        stmt = "".join(current).strip()
        if stmt: statements.append(stmt)
    return statements


def main():
    if not SQL_FILE.exists():
        print(f"❌ SQL file not found: {SQL_FILE}"); sys.exit(1)
    sql_content = SQL_FILE.read_text(encoding="utf-8")
    print(f"📄 Loaded SQL: {SQL_FILE} ({len(sql_content)} bytes)")
    conn = psycopg2.connect(
        host='aws-0-sa-east-1.pooler.supabase.com', port=5432,
        dbname='postgres', user='postgres.bkxtploibraiovgrjtwn',
        password='Wafla0523129500', sslmode='require', connect_timeout=15,
    )
    conn.autocommit = True
    cur = conn.cursor()
    print("🔌 Connected\n")
    statements = split_sql(sql_content)
    print(f"📋 {len(statements)} statements\n")
    success = failed = 0
    for i, stmt in enumerate(statements, 1):
        preview_lines = [ln for ln in stmt.split("\n") if ln.strip() and not ln.strip().startswith("--")]
        preview = preview_lines[0][:90] if preview_lines else "(empty)"
        try:
            cur.execute(stmt); success += 1
            print(f"  [{i:02d}/{len(statements):02d}] ✅ {preview}")
        except Exception as e:
            failed += 1
            print(f"  [{i:02d}/{len(statements):02d}] ❌ {preview}")
            print(f"           → {str(e)[:200]}")
    print(f"\n📊 Result: {success} ok, {failed} failed")

    # Verify
    print("\n" + "=" * 60)
    print("🔍 VERIFICATION")
    print("=" * 60)

    cur.execute("""
        SELECT COUNT(*) FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name IN (
          'is_demo_account', 'business_name', 'business_legal_name', 'business_tax_id',
          'business_phone', 'business_whatsapp', 'business_address', 'business_city',
          'business_country', 'business_postal_code', 'business_description', 'business_website',
          'logo_url', 'photo_url',
          'social_facebook', 'social_instagram', 'social_tiktok', 'social_youtube', 'social_x',
          'business_hours', 'business_timezone',
          'subscription_started_at', 'subscription_ended_at', 'subscription_cancelled_at',
          'last_payment_at', 'last_payment_amount', 'last_payment_currency',
          'billing_email', 'billing_address'
        );
    """)
    count = cur.fetchone()[0]
    print(f"\n📊 New columns: {count}/28 expected")

    cur.execute("""
        SELECT routine_name FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_name IN ('update_business_profile', 'get_my_full_profile')
        ORDER BY routine_name;
    """)
    funcs = [r[0] for r in cur.fetchall()]
    print(f"📦 Functions: {len(funcs)}/2 expected")
    for f in funcs: print(f"   ✅ {f}")

    cur.execute("SELECT email, is_demo_account FROM profiles WHERE is_demo_account = true ORDER BY email;")
    demos = cur.fetchall()
    print(f"\n🎭 Demo accounts marked: {len(demos)}")
    for email, _ in demos: print(f"   ✅ {email}")

    cur.close(); conn.close()
    print("\n✅ MIGRATION COMPLETE")


if __name__ == "__main__":
    main()
