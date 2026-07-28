#!/usr/bin/env python3
"""Verify all required tables/columns exist in Supabase production DB."""
import psycopg2
import sys

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
    'profiles', 'menus', 'categories', 'dishes', 'dish_options',
    'option_items', 'menu_views', 'orders', 'order_items', 'waiters',
    'waiter_tables', 'branches', 'tables', 'inventory_items',
    'recipes', 'inventory_movements', 'order_status_history',
    'vouchers', 'whatsapp_clicks', 'waiter_notifications',
    'subscriptions', 'payment_history',
]

REQUIRED_COLS = {
    'profiles': ['id', 'email', 'plan', 'is_super_admin', 'trial_ends_at',
                 'subscription_status', 'subscription_ends_at',
                 'bg_removals_used', 'bg_removals_reset_at',
                 'onboarding_completed_at', 'phone', 'business_name', 'business_type',
                 'push_subscription'],
    'menus': ['id', 'owner_id', 'slug', 'name', 'is_published'],
    'waiters': ['id', 'menu_id', 'name', 'qr_token', 'password', 'is_active'],
    'subscriptions': ['id', 'user_id', 'plan', 'status', 'mercadopago_subscription_id',
                      'mercadopago_preapproval_id', 'current_period_end'],
    'payment_history': ['id', 'user_id', 'amount', 'currency', 'status', 'plan', 'created_at'],
}

def main():
    try:
        conn = psycopg2.connect(**CONN)
        cur = conn.cursor()
        print("✅ CONEXIÓN OK a Supabase pooler (sa-east-1)")
    except Exception as e:
        print(f"❌ CONEXIÓN FALLIDA: {e}")
        sys.exit(1)

    # 1. Verificar tablas
    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    existing = {r[0] for r in cur.fetchall()}
    print(f"\n📋 Tablas en DB: {len(existing)}")
    print(f"   Requeridas: {len(REQUIRED_TABLES)}")

    missing_tables = [t for t in REQUIRED_TABLES if t not in existing]
    if missing_tables:
        print(f"❌ FALTAN TABLAS: {missing_tables}")
    else:
        print("✅ TODAS las tablas requeridas existen")

    # 2. Verificar columnas
    print("\n📋 Columnas requeridas por tabla:")
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
            print(f"✅ {table}: {len(cols)}/{len(cols)} columnas OK")

    # 3. RLS status
    print("\n📋 RLS habilitado en tablas críticas:")
    cur.execute("""
        SELECT relname, relrowsecurity
        FROM pg_class
        WHERE relname IN ('profiles','menus','categories','dishes','orders','waiters','inventory_items','whatsapp_clicks')
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')
        ORDER BY relname;
    """)
    for tbl, rls in cur.fetchall():
        status = "✅ RLS ON" if rls else "❌ RLS OFF"
        print(f"   {tbl}: {status}")

    # 4. Datos demo
    print("\n📋 Datos demo:")
    for table in ['profiles','menus','categories','dishes','waiters','orders','whatsapp_clicks','subscriptions','payment_history']:
        try:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            n = cur.fetchone()[0]
            print(f"   {table}: {n} filas")
        except Exception as e:
            print(f"   {table}: ERROR - {e}")

    # 5. Policies
    print("\n📋 RLS Policies por tabla:")
    cur.execute("""
        SELECT schemaname, tablename, COUNT(*) as n_policies
        FROM pg_policies
        WHERE schemaname='public'
        GROUP BY schemaname, tablename
        ORDER BY tablename;
    """)
    for sch, tbl, n in cur.fetchall():
        print(f"   {tbl}: {n} policies")

    cur.close()
    conn.close()
    print("\n✅ Verificación completada")

if __name__ == "__main__":
    main()
