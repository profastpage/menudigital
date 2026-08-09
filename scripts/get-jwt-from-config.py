#!/usr/bin/env python3
"""Lee raw_base_config de auth.instances — ahi esta el JWT secret."""
import psycopg2
import re

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

cur.execute("SELECT raw_base_config FROM auth.instances LIMIT 1;")
row = cur.fetchone()
if not row:
    print("No auth.instances rows")
    exit(1)

config = row[0]
# Buscar JWT secret
match = re.search(r'JWT_SECRET\s*=\s*"([^"]+)"', config)
if match:
    jwt_secret = match.group(1)
    print(f"JWT_SECRET encontrado (len={len(jwt_secret)})")
    print(f"  first 20: {jwt_secret[:20]}...")
    print(f"  last 10: ...{jwt_secret[-10:]}")
else:
    # Print todas las lines con JWT
    for line in config.split('\n'):
        if 'JWT' in line.upper() or 'SECRET' in line.upper():
            print(f"  {line}")

# Buscar otras configs útiles
print("\n=== Otros settings relevantes ===")
for line in config.split('\n'):
    line = line.strip()
    if line.startswith('#') or not line:
        continue
    if any(k in line.upper() for k in ['API', 'URL', 'SITE', 'EXTERNAL']):
        print(f"  {line}")

cur.close(); conn.close()
