#!/usr/bin/env python3
"""Verify the tables actually used by code exist in production."""
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

REQUIRED_TABLES = [
    'profiles', 'menus', 'categories', 'dishes', 'menu_views',
    'orders', 'order_items', 'order_status_history', 'waiters',
    'branches', 'tables', 'inventory_items', 'inventory_movements',
    'product_recipes', 'voucher_prints', 'whatsapp_clicks',
    'admin_notifications', 'comandas', 'comanda_items',
    'menu_theme_presets', 'custom_domains',
]

REQUIRED_COLS = {
    'profiles': ['id', 'email', 'plan', 'is_super_admin', 'bg_removals_used', 'bg_removals_reset_at',
                 'onboarding_completed_at', 'phone', 'business_name', 'business_type',
                 'mp_status', 'mp_preapproval_id', 'current_period_end'],
    'waiters': ['id', 'qr_token', 'password'],
    'menus': ['id', 'slug', 'is_published'],
}

def main():
    conn = psycopg2.connect(**CONN)
    cur = conn.cursor()
    print("✅ CONEXIÓN OK\n")

    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_type='BASE TABLE'
        ORDER BY table_name;
    """)
    existing = {r[0] for r in cur.fetchall()}
    print(f"📋 Tablas en DB: {len(existing)}")
    print(f"📋 Tablas requeridas por código: {len(REQUIRED_TABLES)}")

    missing = [t for t in REQUIRED_TABLES if t not in existing]
    if missing:
        print(f"❌ FALTAN: {missing}")
    else:
        print("✅ TODAS las tablas requeridas existen\n")

    print("📋 Columnas críticas:")
    for table, cols in REQUIRED_COLS.items():
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema='public' AND table_name=%s
        """, (table,))
        existing_cols = {r[0] for r in cur.fetchall()}
        missing_cols = [c for c in cols if c not in existing_cols]
        if missing_cols:
            print(f"❌ {table}: FALTAN {missing_cols}")
        else:
            print(f"✅ {table}: todas las columnas OK")

    # Admin notifications count
    print("\n📋 admin_notifications:")
    try:
        cur.execute("SELECT COUNT(*) FROM admin_notifications")
        n = cur.fetchone()[0]
        print(f"   {n} filas")
    except Exception as e:
        print(f"   ERROR: {e}")
        conn.rollback()

    # Waiters con password
    print("\n📋 waiters con password:")
    try:
        cur.execute("SELECT COUNT(*) FROM waiters WHERE password IS NOT NULL")
        n = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM waiters")
        total = cur.fetchone()[0]
        print(f"   {n}/{total} waiters tienen password")
    except Exception as e:
        print(f"   ERROR: {e}")
        conn.rollback()

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
