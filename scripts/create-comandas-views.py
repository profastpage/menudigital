#!/usr/bin/env python3
import psycopg2
conn = psycopg2.connect(
    host='aws-0-sa-east-1.pooler.supabase.com', port=5432,
    dbname='postgres', user='postgres.bkxtploibraiovgrjtwn',
    password='Wafla0523129500', sslmode='require', connect_timeout=15,
)
conn.autocommit = True
cur = conn.cursor()

# orders tiene: id, owner_id, branch_id, table_id, waiter_id, order_number,
#               status, order_type, customer_name, customer_phone, party_size,
#               notes, subtotal, tax, tip, total, currency, sent_at, ready_at,
#               delivered_at, invoiced_at, cancelled_at, cancel_reason,
#               created_at, updated_at
#
# order_items tiene: id, order_id, menu_item_id, menu_item_name, menu_item_price,
#                    quantity, notes, status, prepared_by, prepared_at, created_at, updated_at

cur.execute("DROP VIEW IF EXISTS comandas CASCADE;")
cur.execute("DROP VIEW IF EXISTS comanda_items CASCADE;")

# Vista comandas — expone orders con alias que el código TS espera
cur.execute("""
    CREATE VIEW comandas AS
    SELECT
      o.id,
      o.owner_id,
      o.branch_id,
      o.table_id,
      o.waiter_id,
      o.order_number,
      o.status,
      o.order_type,
      o.customer_name,
      o.customer_phone,
      o.party_size,
      o.notes,
      o.subtotal,
      o.tax,
      o.tip,
      o.total,
      o.currency,
      o.sent_at,
      o.ready_at,
      o.delivered_at,
      o.invoiced_at,
      o.cancelled_at,
      o.cancel_reason,
      o.created_at,
      o.updated_at,
      t.number AS mesa_numero,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
    FROM orders o
    LEFT JOIN tables t ON t.id = o.table_id
""")
print("✅ Vista comandas creada")

# Vista comanda_items — expone order_items con alias name/qty/price
cur.execute("""
    CREATE VIEW comanda_items AS
    SELECT
      oi.id,
      oi.order_id,
      oi.menu_item_id AS dish_id,
      oi.menu_item_name AS name,
      oi.quantity AS qty,
      oi.menu_item_price AS price,
      oi.notes,
      oi.status,
      oi.prepared_by,
      oi.prepared_at,
      oi.created_at,
      oi.updated_at,
      o.owner_id
    FROM order_items oi
    LEFT JOIN orders o ON o.id = oi.order_id
""")
print("✅ Vista comanda_items creada")

# security_invoker para que RLS de orders/order_items aplique
try:
    cur.execute("ALTER VIEW comandas SET (security_invoker = true);")
    cur.execute("ALTER VIEW comanda_items SET (security_invoker = true);")
    print("✅ security_invoker=true en ambas vistas")
except Exception as e:
    print(f"⚠️ security_invoker no soportado: {e}")
    conn.rollback()

# Verificar
print("\n── Verificación ──")
cur.execute("SELECT COUNT(*) FROM comandas")
print(f"  comandas: {cur.fetchone()[0]} filas")
cur.execute("SELECT COUNT(*) FROM comanda_items")
print(f"  comanda_items: {cur.fetchone()[0]} filas")

# Sample row
cur.execute("SELECT id, owner_id, status, total, mesa_numero, items_count FROM comandas LIMIT 3")
print("\n  Sample comandas:")
for r in cur.fetchall():
    print(f"    {r}")

cur.execute("SELECT name, qty, price, owner_id FROM comanda_items LIMIT 3")
print("\n  Sample comanda_items:")
for r in cur.fetchall():
    print(f"    {r}")

cur.close()
conn.close()
