#!/usr/bin/env python3
"""Apply pending SQL migrations to Supabase production."""
import psycopg2
import os

CONN = dict(
    host='aws-0-sa-east-1.pooler.supabase.com',
    port=5432,
    dbname='postgres',
    user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500',
    sslmode='require',
    connect_timeout=15,
)

SQL_FILES = [
    '/home/z/my-project/supabase/add-waiter-password-and-admin-notifications.sql',
    # Comandas migration — buscar archivo
]

# Find comandas migration
import glob
comandas_files = glob.glob('/home/z/my-project/supabase/*comand*')
print("Comandas files found:", comandas_files)

# Also check mozos-mesas-migration which likely has comandas
SQL_FILES.append('/home/z/my-project/supabase/mozos-mesas-migration.sql')

def apply_sql_file(cur, path):
    name = os.path.basename(path)
    print(f"\n── Aplicando {name} ──")
    if not os.path.exists(path):
        print(f"❌ NO EXISTE: {path}")
        return False
    with open(path, 'r') as f:
        sql = f.read()
    # Split on semicolons but respect $$ blocks
    # Use simple execute for whole file (psycopg2 handles it)
    try:
        cur.execute(sql)
        print(f"✅ {name}: aplicado ({len(sql)} bytes)")
        return True
    except Exception as e:
        print(f"❌ {name}: ERROR - {e}")
        return False

def main():
    conn = psycopg2.connect(**CONN)
    conn.autocommit = True  # So each statement commits independently
    cur = conn.cursor()
    print("✅ Conexión OK (autocommit ON)")

    for f in SQL_FILES:
        apply_sql_file(cur, f)

    # Verificación final
    print("\n── Verificación final ──")
    cur.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema='public' AND table_type='BASE TABLE'
        ORDER BY table_name;
    """)
    tables = [r[0] for r in cur.fetchall()]
    print(f"Total tablas: {len(tables)}")
    for t in ['admin_notifications', 'comandas', 'comanda_items', 'waiters']:
        if t in tables:
            print(f"  ✅ {t}")
        else:
            print(f"  ❌ {t}")

    # Verificar columna password en waiters
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='waiters' AND column_name='password'
    """)
    if cur.fetchone():
        print("  ✅ waiters.password existe")
    else:
        print("  ❌ waiters.password NO existe")

    # Verificar columnas en comandas
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='comandas' ORDER BY ordinal_position
    """)
    cols = [r[0] for r in cur.fetchall()]
    print(f"  comandas columnas: {cols}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
