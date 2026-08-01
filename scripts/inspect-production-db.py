#!/usr/bin/env python3
"""Inspect production Supabase DB schema + existing demo account data."""
import psycopg2

CONN = dict(
    host='aws-0-sa-east-1.pooler.supabase.com',
    port=5432,
    dbname='postgres',
    user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500',
    sslmode='require',
    connect_timeout=15,
)

conn = psycopg2.connect(**CONN)
cur = conn.cursor()

print("=" * 80)
print("1. ALL TABLES IN PRODUCTION DB")
print("=" * 80)
cur.execute("""
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema='public'
    ORDER BY table_name;
""")
tables = cur.fetchall()
for name, ttype in tables:
    print(f"  {name:40s} ({ttype})")

print("\n" + "=" * 80)
print("2. COLUMNS FOR EACH MAIN TABLE")
print("=" * 80)
for tbl in ['profiles', 'menus', 'categories', 'dishes', 'menu_views',
            'whatsapp_clicks', 'orders', 'order_items', 'waiters',
            'tables_restaurant', 'inventory_items', 'admin_notifications',
            'custom_domains', 'menu_themes']:
    try:
        cur.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name=%s
            ORDER BY ordinal_position;
        """, (tbl,))
        cols = cur.fetchall()
        if cols:
            print(f"\n── {tbl} ──")
            for c in cols:
                print(f"  {c[0]:30s} {c[1]:25s} null={c[2]:3s} default={c[3]}")
    except Exception as e:
        print(f"\n── {tbl} ── ERROR: {e}")

print("\n" + "=" * 80)
print("3. EXISTING DEMO ACCOUNT")
print("=" * 80)
cur.execute("SELECT id, email, plan, full_name FROM profiles WHERE email LIKE 'demo%@menudigital.pro';")
for r in cur.fetchall():
    print(f"  Profile: id={r[0]} email={r[1]} plan={r[2]} name={r[3]}")

print("\n" + "=" * 80)
print("4. MENUS OF EXISTING DEMO")
print("=" * 80)
cur.execute("""
    SELECT id, name, slug, is_published, views_count, user_id
    FROM menus
    WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE 'demo%@menudigital.pro')
    ORDER BY name;
""")
demo_menus = cur.fetchall()
for m in demo_menus:
    print(f"  Menu: {m[1]:40s} slug={m[2]:40s} published={m[3]} views={m[4]}")
    cur.execute("SELECT COUNT(*) FROM categories WHERE menu_id=%s", (m[0],))
    cat_count = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM dishes WHERE category_id IN (SELECT id FROM categories WHERE menu_id=%s)", (m[0],))
    dish_count = cur.fetchone()[0]
    print(f"         categories={cat_count}, dishes={dish_count}")

print("\n" + "=" * 80)
print("5. SAMPLE menu_themes (if exists)")
print("=" * 80)
cur.execute("SELECT menu_id, layout, dark_mode, card_style FROM menu_themes LIMIT 5;")
themes = cur.fetchall()
for t in themes:
    print(f"  theme: menu_id={t[0]} layout={t[1]} dark={t[2]} card_style={t[3]}")

print("\n" + "=" * 80)
print("6. ROW COUNTS OF KEY TABLES")
print("=" * 80)
for tbl in ['profiles', 'menus', 'categories', 'dishes', 'menu_views',
            'whatsapp_clicks', 'orders', 'order_items', 'waiters',
            'inventory_items']:
    try:
        cur.execute(f"SELECT COUNT(*) FROM {tbl};")
        cnt = cur.fetchone()[0]
        print(f"  {tbl:30s}: {cnt}")
    except Exception as e:
        conn.rollback()
        print(f"  {tbl:30s}: ERROR ({e})")

cur.close()
conn.close()
print("\n✅ Done")
