-- ============================================================
-- Migración: Vistas `comandas` y `comanda_items`
-- Fecha: 2026-07-29
--
-- El código TypeScript referencia `.from('comandas')` y `.from('comanda_items')`
-- pero las tablas físicas son `orders` y `order_items`. Esta migración crea
-- vistas compatibles para no romper el código existente.
--
-- Las vistas exponen alias que el código espera:
--   comandas: id, owner_id, status, total, created_at, mesa_numero, items_count
--   comanda_items: name, qty, price, owner_id
--
-- security_invoker=true para que RLS de orders/order_items aplique a las vistas.
-- ============================================================

DROP VIEW IF EXISTS comandas CASCADE;
DROP VIEW IF EXISTS comanda_items CASCADE;

-- Vista comandas — expone orders con alias esperados por el código TS
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
LEFT JOIN tables t ON t.id = o.table_id;

-- Vista comanda_items — expone order_items con alias name/qty/price
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
LEFT JOIN orders o ON o.id = oi.order_id;

-- security_invoker: las vistas se ejecutan con los permisos del invocador,
-- por lo que RLS de orders/order_items se aplica correctamente.
ALTER VIEW comandas SET (security_invoker = true);
ALTER VIEW comanda_items SET (security_invoker = true);

COMMENT ON VIEW comandas IS
  'Vista compatibilidad que expone orders con alias esperados por código TS (mesa_numero, items_count)';
COMMENT ON VIEW comanda_items IS
  'Vista compatibilidad que expone order_items con alias esperados por código TS (name, qty, price)';
