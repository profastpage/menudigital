#!/usr/bin/env python3
"""
Obtiene 3 tokens reales de mozos activos para probar /mozo/[token].
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
    connect_timeout=20, options="-c search_path=public",
)
cur = conn.cursor()
cur.execute("""
    SELECT w.qr_token, w.full_name, w.is_active,
           p.plan, p.email
    FROM waiters w
    JOIN profiles p ON p.id = w.owner_id
    WHERE w.is_active = TRUE
      AND w.qr_token IS NOT NULL
      AND p.plan IN ('premium', 'full')
    LIMIT 5;
""")
rows = cur.fetchall()
print(f"Found {len(rows)} premium/full active mozos:")
for r in rows:
    print(f"  - token={r[0][:12]}...{r[0][-6:]} name={r[1]} plan={r[3]} owner={r[4]}")
    print(f"    URL: http://localhost:3000/mozo/{r[0]}")
cur.close(); conn.close()
