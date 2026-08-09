#!/usr/bin/env python3
"""Lista todos los schemas y busca el JWT secret en cualquier parte."""
import psycopg2

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"

conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
    user=DB_USER, password=DB_PASSWORD,
    connect_timeout=20,
)
cur = conn.cursor()

# Listar schemas
print("=== Schemas ===")
cur.execute("""
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'pg_toast', 'information_schema')
    ORDER BY schema_name;
""")
schemas = [r[0] for r in cur.fetchall()]
for s in schemas:
    print(f"  - {s}")

# Buscar tablas que contengan 'jwt' o 'signing' o 'config'
print("\n=== Tablas con jwt/signing/config ===")
cur.execute("""
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name ILIKE '%jwt%'
       OR table_name ILIKE '%signing%'
       OR table_name ILIKE '%config%'
       OR table_name ILIKE '%setting%'
    ORDER BY table_schema, table_name;
""")
for r in cur.fetchall():
    print(f"  - {r[0]}.{r[1]}")

# Probar auth.instances (tiene config de Supabase)
print("\n=== auth.instances ===")
try:
    cur.execute("SELECT * FROM auth.instances LIMIT 1;")
    cols = [d[0] for d in cur.description]
    print(f"  Columns: {cols}")
    row = cur.fetchone()
    if row:
        for c, v in zip(cols, row):
            if isinstance(v, str) and len(v) > 80:
                v = v[:80] + "..."
            print(f"  {c}: {v}")
except Exception as e:
    print(f"  Error: {e}")

# Probar auth.audit_log_entries (no useful)
# Buscar current_setting('app.settings.jwt_secret')
print("\n=== Test current_setting('app.settings.jwt_secret') ===")
try:
    cur.execute("SELECT current_setting('app.settings.jwt_secret', true);")
    r = cur.fetchone()
    print(f"  jwt_secret setting: {r[0] if r and r[0] else '(not set)'}")
except Exception as e:
    print(f"  Error: {e}")

# Show all app.settings
print("\n=== All app.settings* ===")
try:
    cur.execute("""
        SELECT name, setting FROM pg_settings
        WHERE name LIKE 'app.settings%' OR name LIKE '%jwt%' OR name LIKE '%secret%';
    """)
    for r in cur.fetchall():
        v = r[1]
        if isinstance(v, str) and len(v) > 80:
            v = v[:80] + "..."
        print(f"  {r[0]}: {v}")
except Exception as e:
    print(f"  Error: {e}")

cur.close(); conn.close()
