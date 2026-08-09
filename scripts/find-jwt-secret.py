#!/usr/bin/env python3
"""
Lista tablas en auth schema y busca donde puede estar el JWT secret.
"""
import psycopg2

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"

conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
    user=DB_USER, password=DB_PASSWORD,
    connect_timeout=20, options="-c search_path=public,auth",
)
cur = conn.cursor()

# Listar tablas en auth schema
print("=== Tablas en auth schema ===")
cur.execute("""
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema='auth'
    ORDER BY table_name;
""")
for r in cur.fetchall():
    print(f"  - {r[0]}")

# Buscar tablas con 'key' o 'secret' o 'jwt' en cualquier schema
print("\n=== Tablas con key/secret/jwt en el nombre ===")
cur.execute("""
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name ILIKE '%key%'
       OR table_name ILIKE '%secret%'
       OR table_name ILIKE '%jwt%'
       OR table_name ILIKE '%vault%'
    ORDER BY table_schema, table_name;
""")
for r in cur.fetchall():
    print(f"  - {r[0]}.{r[1]}")

# Verificar vault.decrypted_secrets
print("\n=== vault.decrypted_secrets (sample) ===")
try:
    cur.execute("SELECT key FROM vault.decrypted_secrets LIMIT 20;")
    for r in cur.fetchall():
        print(f"  - {r[0]}")
except Exception as e:
    print(f"  Error: {e}")

cur.close(); conn.close()
