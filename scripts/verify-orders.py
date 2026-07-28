import psycopg2
conn = psycopg2.connect(
    host='aws-0-sa-east-1.pooler.supabase.com', port=5432,
    dbname='postgres', user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500', sslmode='require', connect_timeout=15,
)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM orders")
print(f"orders: {cur.fetchone()[0]} filas")
cur.execute("SELECT COUNT(*) FROM order_items")
print(f"order_items: {cur.fetchone()[0]} filas")
cur.close()
conn.close()
