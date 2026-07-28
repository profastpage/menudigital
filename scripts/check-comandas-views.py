import psycopg2
conn = psycopg2.connect(
    host='aws-0-sa-east-1.pooler.supabase.com', port=5432,
    dbname='postgres', user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500', sslmode='require', connect_timeout=15,
)
cur = conn.cursor()
# Check if comandas is a view
cur.execute("""
    SELECT table_name, table_type FROM information_schema.tables
    WHERE table_schema='public' AND table_name IN ('comandas','comanda_items','orders','order_items')
""")
for r in cur.fetchall():
    print(f"  {r[0]}: {r[1]}")

# Try selecting from comandas
try:
    cur.execute("SELECT COUNT(*) FROM comandas")
    print(f"\ncomandas count: {cur.fetchone()[0]}")
except Exception as e:
    print(f"\ncomandas ERROR: {e}")
    conn.rollback()

try:
    cur.execute("SELECT COUNT(*) FROM comanda_items")
    print(f"comanda_items count: {cur.fetchone()[0]}")
except Exception as e:
    print(f"comanda_items ERROR: {e}")
    conn.rollback()

cur.close()
conn.close()
