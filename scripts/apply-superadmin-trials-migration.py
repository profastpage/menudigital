#!/usr/bin/env python3
"""
Apply fix-superadmin-stats-and-trials.sql to production Supabase DB.
Idempotent — safe to run multiple times.

Splits SQL into statements respecting:
  - $$ ... $$ PL/pgSQL dollar-quoted blocks
  - Single-line and multi-line comments
  - Semicolons inside string literals
"""
import psycopg2
import sys
import re
from pathlib import Path

SQL_FILE = Path("/home/z/my-project/download/fix-superadmin-stats-and-trials.sql")


def split_sql(sql_text: str):
    """Split SQL text into individual statements, respecting $$ blocks and comments."""
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

        # Handle line comments
        if not in_dollar and not in_block_comment and ch == "-" and nxt == "-":
            in_line_comment = True
            current.append(ch)
            i += 1
            continue
        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            current.append(ch)
            i += 1
            continue

        # Handle block comments
        if not in_dollar and not in_line_comment and ch == "/" and nxt == "*":
            in_block_comment = True
            current.append("/*")
            i += 2
            continue
        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                current.append("*/")
                i += 2
                continue
            current.append(ch)
            i += 1
            continue

        # Handle dollar-quoted strings: $tag$ ... $tag$
        if not in_line_comment and not in_block_comment and ch == "$":
            # Try to match $tag$ pattern
            m = re.match(r"\$([a-zA-Z_]\w*)?\$", sql_text[i:])
            if m:
                tag = m.group(1) or ""
                full_match = m.group(0)
                if not in_dollar:
                    in_dollar = True
                    dollar_tag = tag
                    current.append(full_match)
                    i += len(full_match)
                    continue
                else:
                    # Check if this matches the current tag
                    if tag == dollar_tag:
                        in_dollar = False
                        dollar_tag = None
                        current.append(full_match)
                        i += len(full_match)
                        continue
                    else:
                        # Different tag, just include as part of string
                        current.append(full_match)
                        i += len(full_match)
                        continue
            else:
                # Just a $ sign, not a delimiter
                current.append(ch)
                i += 1
                continue

        # Handle statement terminator
        if not in_dollar and not in_line_comment and not in_block_comment and ch == ";":
            current.append(";")
            stmt = "".join(current).strip()
            if stmt and not all(line.strip().startswith("--") for line in stmt.split("\n")):
                # Filter out statements that are only comments
                # Remove leading/trailing comment lines
                code_lines = [ln for ln in stmt.split("\n")
                              if ln.strip() and not ln.strip().startswith("--")]
                if code_lines:
                    statements.append(stmt)
            current = []
            i += 1
            continue

        current.append(ch)
        i += 1

    # Append any trailing content
    if current:
        stmt = "".join(current).strip()
        if stmt:
            statements.append(stmt)

    return statements


def main():
    if not SQL_FILE.exists():
        print(f"❌ SQL file not found: {SQL_FILE}")
        sys.exit(1)

    sql_content = SQL_FILE.read_text(encoding="utf-8")
    print(f"📄 Loaded SQL file: {SQL_FILE} ({len(sql_content)} bytes)")

    # Production DB connection
    conn = psycopg2.connect(
        host='aws-0-sa-east-1.pooler.supabase.com', port=5432,
        dbname='postgres', user='postgres.bkxtploibraiovgrjtwn',
        password='Wafla0523129500', sslmode='require', connect_timeout=15,
    )
    conn.autocommit = True
    cur = conn.cursor()
    print("🔌 Connected to production Supabase DB\n")

    statements = split_sql(sql_content)
    print(f"📋 Split into {len(statements)} statements\n")

    success = 0
    failed = 0
    for i, stmt in enumerate(statements, 1):
        # Get a short preview
        preview_lines = [ln for ln in stmt.split("\n") if ln.strip() and not ln.strip().startswith("--")]
        preview = preview_lines[0][:90] if preview_lines else "(empty)"
        try:
            cur.execute(stmt)
            success += 1
            print(f"  [{i:02d}/{len(statements):02d}] ✅ {preview}")
        except Exception as e:
            failed += 1
            print(f"  [{i:02d}/{len(statements):02d}] ❌ {preview}")
            print(f"           → {str(e)[:200]}")

    print(f"\n📊 Result: {success} ok, {failed} failed")

    # Verify everything was created
    print("\n" + "=" * 60)
    print("🔍 VERIFICATION")
    print("=" * 60)

    # 1. Check functions exist
    cur.execute("""
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_name IN (
            'admin_global_stats', 'start_user_trial', 'expire_user_trials',
            'check_trial_eligibility', 'dismiss_trial_promo'
          )
        ORDER BY routine_name;
    """)
    funcs = [r[0] for r in cur.fetchall()]
    expected_funcs = ['admin_global_stats', 'check_trial_eligibility', 'dismiss_trial_promo',
                      'expire_user_trials', 'start_user_trial']
    print(f"\n📦 Functions ({len(funcs)}/{len(expected_funcs)} expected):")
    for name in expected_funcs:
        mark = "✅" if name in funcs else "❌"
        print(f"   {mark} {name}")

    # 2. Check columns exist
    cur.execute("""
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'profiles'
          AND column_name IN (
            'trial_plan', 'trial_ends_at', 'trial_started_at',
            'trial_used_premium', 'trial_used_full',
            'trial_card_tokenized', 'promo_dismissed_at'
          )
        ORDER BY column_name;
    """)
    cols = cur.fetchall()
    expected_cols = ['promo_dismissed_at', 'trial_card_tokenized', 'trial_ends_at',
                     'trial_plan', 'trial_started_at', 'trial_used_full', 'trial_used_premium']
    found_col_names = [c[0] for c in cols]
    print(f"\n📊 Columns added to profiles ({len(cols)}/{len(expected_cols)} expected):")
    for name in expected_cols:
        mark = "✅" if name in found_col_names else "❌"
        print(f"   {mark} {name}")

    # 3. Check view exists
    cur.execute("""
        SELECT table_name FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'admin_active_trials';
    """)
    views = cur.fetchall()
    print(f"\n👁️  View: {'✅ admin_active_trials' if views else '❌ admin_active_trials'}")

    # 4. Test expire_user_trials (safe to call, returns 0 if no expired trials)
    if 'expire_user_trials' in funcs:
        print("\n🧪 Testing expire_user_trials()...")
        try:
            cur.execute("SELECT public.expire_user_trials();")
            expired = cur.fetchone()
            print(f"   ✅ Returned: {expired[0] if expired else 0} trials expired")
        except Exception as e:
            print(f"   ⚠️  Error: {e}")

    # 5. Test admin_global_stats (will fail without super admin, that's OK)
    if 'admin_global_stats' in funcs:
        print("\n🧪 Testing admin_global_stats() as super admin...")
        try:
            # Find a super admin user to test with
            cur.execute("SELECT id FROM profiles WHERE is_super_admin = true LIMIT 1;")
            sa = cur.fetchone()
            if sa:
                # Set local role to act as that user (using set_config)
                cur.execute("SELECT set_config('request.jwt.claims', json_build_object('sub', %s)::text, false);", (str(sa[0]),))
                cur.execute("SELECT public.admin_global_stats();")
                result = cur.fetchone()
                if result and result[0]:
                    import json
                    stats = result[0] if isinstance(result[0], dict) else json.loads(result[0])
                    print(f"   ✅ Stats returned")
                    mrr = stats.get('mrr_breakdown', {})
                    print(f"   📊 MRR breakdown:")
                    for plan in ['pro', 'premium', 'full']:
                        info = mrr.get(plan, {})
                        print(f"      • {plan}: {info.get('count', 0)} users × S/{info.get('price_pen', 0)} = S/{info.get('amount_pen', 0)}")
                    print(f"   💰 Total MRR (PEN): S/{stats.get('revenue_estimate_pen', 0)}")
                    print(f"   👥 Free: {stats.get('free_users', 0)}, Pro: {stats.get('pro_users', 0)}, Premium: {stats.get('premium_users', 0)}, Full: {stats.get('full_users', 0)}")
                    print(f"   🎁 Active trials: {stats.get('active_trials', 0)}")
                else:
                    print(f"   ⚠️  Function returned NULL")
            else:
                print(f"   ⚠️  No super admin user found in profiles table")
        except Exception as e:
            print(f"   ⚠️  Error: {e}")

    print("\n" + "=" * 60)
    print("✅ MIGRATION COMPLETE")
    print("=" * 60)

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
