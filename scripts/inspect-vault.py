#!/usr/bin/env python3
"""Inspecciona vault.secrets y vault.decrypted_secrets."""
import psycopg2

DB_HOST = "aws-0-sa-east-1.pooler.supabase.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres.bkxtploibraiovgrjtwn"
DB_PASSWORD = "Wafla0523129500"

conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
    user=DB_USER, password=DB_PASSWORD,
    connect_timeout=20, options="-c search_path=public,auth,vault",
)
cur = conn.cursor()

# Listar columnas
print("=== vault.secrets columns ===")
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='vault' AND table_name='secrets'
    ORDER BY ordinal_position;
""")
for r in cur.fetchall():
    print(f"  {r[0]:<20} {r[1]}")

print("\n=== vault.decrypted_secrets columns ===")
cur.execute("""
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema='vault' AND table_name='decrypted_secrets'
    ORDER BY ordinal_position;
""")
for r in cur.fetchall():
    print(f"  {r[0]:<20} {r[1]}")

# Listar todos los secrets (sin mostrar el valor)
print("\n=== secrets (id, name, description) ===")
try:
    cur.execute("SELECT id, name, description FROM vault.secrets ORDER BY name;")
    for r in cur.fetchall():
        print(f"  - id={r[0]} name={r[1]} desc={r[2]}")
except Exception as e:
    print(f"  Error: {e}")

cur.close(); conn.close()
