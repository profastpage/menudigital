-- ============================================================
-- MenuPro — Migración: Flujo híbrido carta digital ↔ comanda interna
-- ============================================================
-- Permite que clientes finales (visitando /r/[slug]) envíen pedidos
-- que se convierten automáticamente en comandas internas (Premium/Full),
-- con auto-asignación de mozo libre y notificaciones push.
--
-- Es 100% idempotente: puede ejecutarse múltiples veces sin error.
-- ============================================================

-- ============================================================
-- 1. Columna waiters.max_tables (cantidad de mesas que atiende, 1-10)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waiters' AND column_name = 'max_tables'
  ) THEN
    ALTER TABLE waiters ADD COLUMN max_tables INT NOT NULL DEFAULT 4
      CHECK (max_tables BETWEEN 1 AND 20);
    RAISE NOTICE '✅ Columna waiters.max_tables agregada';
  END IF;
END $$;

-- ============================================================
-- 2. Tabla puente waiter_tables (asignación específica mozo↔mesa)
-- ============================================================
CREATE TABLE IF NOT EXISTS waiter_tables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waiter_id   UUID NOT NULL REFERENCES waiters(id) ON DELETE CASCADE,
  table_id    UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(waiter_id, table_id)
);
CREATE INDEX IF NOT EXISTS idx_waiter_tables_waiter ON waiter_tables(waiter_id);
CREATE INDEX IF NOT EXISTS idx_waiter_tables_table ON waiter_tables(table_id);

-- Habilitar RLS
ALTER TABLE waiter_tables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_can_manage_waiter_tables" ON waiter_tables;
CREATE POLICY "owner_can_manage_waiter_tables" ON waiter_tables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM waiters w
      WHERE w.id = waiter_tables.waiter_id
        AND w.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 3. Tabla notifications (push notifications cocina↔mozo)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  waiter_id    UUID REFERENCES waiters(id) ON DELETE CASCADE,
  order_id     UUID REFERENCES orders(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('new_order','order_assigned','order_ready','order_preparing','order_delivered','order_cancelled','test')),
  title        TEXT NOT NULL,
  body         TEXT,
  sound        BOOLEAN NOT NULL DEFAULT true,
  vibrate      BOOLEAN NOT NULL DEFAULT true,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_owner ON notifications(owner_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_waiter ON notifications(waiter_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_order ON notifications(order_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_can_read_notif" ON notifications;
CREATE POLICY "owner_can_read_notif" ON notifications FOR SELECT USING (owner_id = auth.uid());
DROP POLICY IF EXISTS "owner_can_update_notif" ON notifications;
CREATE POLICY "owner_can_update_notif" ON notifications FOR UPDATE USING (owner_id = auth.uid());

-- ============================================================
-- 4. Función RPC: auto_assign_waiter(p_owner UUID)
--    Retorna el UUID del primer mozo libre (sin orders abiertas),
--    o NULL si no hay mozos disponibles.
-- ============================================================
CREATE OR REPLACE FUNCTION auto_assign_waiter(p_owner UUID)
RETURNS UUID AS $$
DECLARE
  v_waiter_id UUID;
BEGIN
  -- Un mozo está "libre" si:
  --   - Es activo
  --   - role = 'mozo'
  --   - No tiene orders en status 'borrador','enviada','en_preparacion','lista'
  --     (es decir, no tiene pedidos pendientes de entregar)
  SELECT w.id INTO v_waiter_id
  FROM waiters w
  WHERE w.owner_id = p_owner
    AND w.is_active = true
    AND w.role = 'mozo'
    AND NOT EXISTS (
      SELECT 1 FROM orders o
      WHERE o.waiter_id = w.id
        AND o.owner_id = p_owner
        AND o.status IN ('borrador','enviada','en_preparacion','lista')
    )
  ORDER BY
    -- Mozo con menos pedidos hoy primero (balanceo de carga)
    (SELECT COUNT(*) FROM orders o
     WHERE o.waiter_id = w.id
       AND o.owner_id = p_owner
       AND o.created_at >= date_trunc('day', now())) ASC,
    w.created_at ASC
  LIMIT 1;

  RETURN v_waiter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Función RPC: get_next_order_number(p_owner UUID) — idempotente
--    (Ya existe en producción, pero la creamos si no está)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_next_order_number'
  ) THEN
    CREATE FUNCTION get_next_order_number(p_owner UUID) RETURNS TEXT AS $_$
      DECLARE
        v_count INT;
        v_num TEXT;
      BEGIN
        SELECT COUNT(*) INTO v_count FROM orders WHERE owner_id = p_owner;
        v_num := '#' || lpad((v_count + 1)::TEXT, 4, '0');
        RETURN v_num;
      END;
    $_$ LANGUAGE plpgsql SECURITY DEFINER;
    RAISE NOTICE '✅ Función get_next_order_number creada';
  END IF;
END $$;

-- ============================================================
-- 6. Función RPC: create_order_from_public_menu(p_payload JSONB)
--    Crea una comanda desde la carta pública. No requiere auth session.
--    USA service_role para bypass RLS (es invocada desde API route server-side).
--
--    Payload: {
--      menu_id, customer_name?, customer_phone?, customer_table?,
--      notes?, items: [{ menu_item_id, menu_item_name, menu_item_price, quantity, notes? }]
--    }
--
--    Retorna: { order_id, order_number, waiter_id?, status }
-- ============================================================
CREATE OR REPLACE FUNCTION create_order_from_public_menu(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
  v_menu RECORD;
  v_owner UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_waiter_id UUID;
  v_subtotal NUMERIC(10,2) := 0;
  v_item JSONB;
  v_items JSONB;
  v_count INT;
BEGIN
  -- 1. Buscar el menu y obtener el owner
  SELECT id, user_id, currency INTO v_menu
  FROM menus WHERE id = p_payload->>'menu_id';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'menu_not_found');
  END IF;

  v_owner := v_menu.user_id;

  -- 2. Generar número de orden
  SELECT COUNT(*) INTO v_count FROM orders WHERE owner_id = v_owner;
  v_order_number := '#' || lpad((v_count + 1)::TEXT, 4, '0');

  -- 3. Auto-asignar mozo libre
  v_waiter_id := auto_assign_waiter(v_owner);

  -- 4. Calcular subtotal
  v_items := p_payload->'items';
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_subtotal := v_subtotal + ((v_item->>'menu_item_price')::NUMERIC) * ((v_item->>'quantity')::INT);
  END LOOP;

  -- 5. Crear order con status 'enviada' (lista para que cocina la tome)
  INSERT INTO orders (
    owner_id, order_number, status, order_type,
    customer_name, customer_phone, notes,
    subtotal, total, currency,
    waiter_id, sent_at
  ) VALUES (
    v_owner,
    v_order_number,
    'enviada',
    COALESCE(p_payload->>'order_type', 'para_llevar')::order_type,
    p_payload->>'customer_name',
    p_payload->>'customer_phone',
    p_payload->>'notes',
    v_subtotal,
    v_subtotal,
    COALESCE(v_menu.currency, 'S/'),
    v_waiter_id,
    now()
  ) RETURNING id INTO v_order_id;

  -- 6. Insertar items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    INSERT INTO order_items (
      order_id, menu_item_id, menu_item_name, menu_item_price, quantity, notes, status
    ) VALUES (
      v_order_id,
      NULLIF(v_item->>'menu_item_id', '')::UUID,
      v_item->>'menu_item_name',
      (v_item->>'menu_item_price')::NUMERIC,
      (v_item->>'quantity')::INT,
      v_item->>'notes',
      'pendiente'
    );
  END LOOP;

  -- 7. Registrar en historial
  INSERT INTO order_status_history (order_id, to_status, changed_by, notes)
  VALUES (v_order_id, 'enviada', 'system', 'Pedido desde carta digital');

  -- 8. Crear notificación push para cocina (new_order)
  INSERT INTO notifications (owner_id, order_id, type, title, body, sound, vibrate)
  VALUES (
    v_owner,
    v_order_id,
    'new_order',
    'Nuevo pedido #' || v_order_number,
    'Pedido recibido desde la carta digital',
    true,
    false
  );

  -- 9. Si se asignó un mozo, notificar al mozo
  IF v_waiter_id IS NOT NULL THEN
    INSERT INTO notifications (owner_id, waiter_id, order_id, type, title, body, sound, vibrate)
    VALUES (
      v_owner,
      v_waiter_id,
      v_order_id,
      'order_assigned',
      'Pedido #' || v_order_number || ' asignado',
      'Se te asignó un nuevo pedido desde la carta digital',
      true,
      true
    );
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'waiter_id', v_waiter_id,
    'status', 'enviada',
    'subtotal', v_subtotal
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. Function RPC: notify_order_status_change(p_order_id UUID, p_status TEXT, p_by_waiter_id UUID)
--    Crea notificación push cuando cocina cambia el status.
--    Si p_status = 'lista' → notifica al mozo asignado con sonido+vibración.
-- ============================================================
CREATE OR REPLACE FUNCTION notify_order_status_change(p_order_id UUID, p_status TEXT, p_by_waiter_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_owner UUID;
  v_waiter_id UUID;
  v_order_number TEXT;
  v_title TEXT;
  v_body TEXT;
  v_notif_type TEXT;
BEGIN
  SELECT owner_id, waiter_id, order_number INTO v_owner, v_waiter_id, v_order_number
  FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_notif_type := CASE p_status
    WHEN 'en_preparacion' THEN 'order_preparing'
    WHEN 'lista' THEN 'order_ready'
    WHEN 'entregada' THEN 'order_delivered'
    WHEN 'cancelada' THEN 'order_cancelled'
    ELSE NULL
  END;
  IF v_notif_type IS NULL THEN RETURN; END IF;

  v_title := CASE p_status
    WHEN 'en_preparacion' THEN 'Pedido #' || v_order_number || ' en preparación'
    WHEN 'lista' THEN '🛎️ Pedido #' || v_order_number || ' LISTO'
    WHEN 'entregada' THEN 'Pedido #' || v_order_number || ' entregado'
    WHEN 'cancelada' THEN 'Pedido #' || v_order_number || ' cancelado'
  END;
  v_body := CASE p_status
    WHEN 'en_preparacion' THEN 'Cocina está preparando tu pedido'
    WHEN 'lista' THEN 'El pedido está listo para entregar al cliente'
    WHEN 'entregada' THEN 'Pedido entregado al cliente'
    WHEN 'cancelada' THEN 'El pedido fue cancelado'
  END;

  -- Notificar al mozo asignado (si hay y no es el mismo que cambió el status)
  IF v_waiter_id IS NOT NULL AND v_waiter_id IS DISTINCT FROM p_by_waiter_id THEN
    INSERT INTO notifications (owner_id, waiter_id, order_id, type, title, body, sound, vibrate)
    VALUES (v_owner, v_waiter_id, p_order_id, v_notif_type, v_title, v_body, true, true);
  END IF;

  -- Notificar al owner también
  INSERT INTO notifications (owner_id, order_id, type, title, body, sound, vibrate)
  VALUES (v_owner, p_order_id, v_notif_type, v_title, v_body, p_status = 'lista', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. Trigger: cuando cocina actualiza orders.status, llamar notify_order_status_change
--    PostgreSQL triggers no aceptan argumentos en EXECUTE FUNCTION,
--    así que usamos una función wrapper RETURNS TRIGGER.
-- ============================================================
CREATE OR REPLACE FUNCTION trg_fn_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM notify_order_status_change(NEW.id, NEW.status, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_order_status_change ON orders;
CREATE TRIGGER trg_order_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trg_fn_order_status_change();

-- ============================================================
-- 9. Política RLS para que la función create_order_from_public_menu
--    pueda escribir (se ejecuta como SECURITY DEFINER, no necesita RLS).
--    Pero necesitamos permitir INSERT anónimo en notifications si el
--    cliente crea la notificación directamente (no es nuestro caso,
--    lo hace la función RPC). OK.
-- ============================================================

-- ============================================================
-- 10. Verificación final
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migración hybrid-flow aplicada correctamente';
  RAISE NOTICE '   - waiters.max_tables: %',
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='waiters' AND column_name='max_tables');
  RAISE NOTICE '   - waiter_tables: %',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='waiter_tables');
  RAISE NOTICE '   - notifications: %',
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='notifications');
  RAISE NOTICE '   - auto_assign_waiter(): %',
    EXISTS(SELECT 1 FROM pg_proc WHERE proname='auto_assign_waiter');
  RAISE NOTICE '   - create_order_from_public_menu(): %',
    EXISTS(SELECT 1 FROM pg_proc WHERE proname='create_order_from_public_menu');
  RAISE NOTICE '   - notify_order_status_change(): %',
    EXISTS(SELECT 1 FROM pg_proc WHERE proname='notify_order_status_change');
END $$;
