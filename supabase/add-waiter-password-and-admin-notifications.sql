-- ============================================================
-- Migración: Password para waiters + Tabla admin_notifications
-- Fecha: 2026-07-29
--
-- 1) Agrega columna `password` a `waiters` (TEXT, nullable)
--    - Si es NULL → el panel del mozo es público (solo con QR token)
--    - Si tiene valor → el panel pide la contraseña antes de mostrar datos
--    - Se guarda en texto plano (es una contraseña de mozo, no de usuario auth)
--      para que el admin pueda verla/ocoparla. El acceso al panel está protegido
--      por el token QR (64 chars hex random) que solo el admin puede compartir.
--
-- 2) Crea tabla `admin_notifications` para registrar eventos que el super admin
--    debe ver (nuevas suscripciones, pagos, etc.) con soporte de "leído".
-- ============================================================

-- ─── 1. Columna password en waiters ────────────────────────
ALTER TABLE waiters
  ADD COLUMN IF NOT EXISTS password TEXT;

-- Comentario para documentación
COMMENT ON COLUMN waiters.password IS
  'Contraseña opcional del mozo. Si es NULL, el panel es público vía QR token. Si tiene valor, el panel pide la contraseña al abrir.';

-- ─── 2. Tabla admin_notifications ──────────────────────────
CREATE TABLE IF NOT EXISTS admin_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Tipo de evento: 'new_subscription' | 'payment_received' | 'cancellation' | 'system'
  type          TEXT NOT NULL,
  -- Título corto: "Nueva suscripción PRO"
  title         TEXT NOT NULL,
  -- Mensaje extendido: "usuario@x.com acaba de pagar S/35.00"
  message       TEXT NOT NULL,
  -- Datos adicionales en JSON: { plan, amount, currency, user_email, user_id, ... }
  metadata      JSONB DEFAULT '{}'::jsonb,
  -- Nivel de severidad: 'info' | 'success' | 'warning' | 'error'
  level         TEXT NOT NULL DEFAULT 'info',
  -- Cuándo se leyó (NULL = no leída)
  read_at       TIMESTAMPTZ,
  -- Para qué super admin es (NULL = para todos los super admins)
  target_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Usuario relacionado (cliente que pagó, etc.)
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notif_unread
  ON admin_notifications(read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notif_admin
  ON admin_notifications(target_admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notif_type
  ON admin_notifications(type, created_at DESC);

COMMENT ON TABLE admin_notifications IS
  'Notificaciones para el panel de super admin: nuevas suscripciones, pagos, cancelaciones, etc.';

-- ─── 3. RLS para admin_notifications ───────────────────────
-- Solo super admins pueden leer; solo service_role (webhooks server-side) puede insertar.
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- DROP policies existentes si las hubiera (idempotente)
DROP POLICY IF EXISTS "admin_notifications_select_superadmin" ON admin_notifications;
DROP POLICY IF EXISTS "admin_notifications_update_superadmin" ON admin_notifications;
DROP POLICY IF EXISTS "admin_notifications_insert_service_role" ON admin_notifications;

-- SELECT: solo super admins pueden ver notificaciones
CREATE POLICY "admin_notifications_select_superadmin"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.is_super_admin = true
    )
  );

-- UPDATE: solo super admins pueden marcar como leídas
CREATE POLICY "admin_notifications_update_superadmin"
  ON admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.is_super_admin = true
    )
  );

-- INSERT: permitido desde service_role (webhook server-side con service key)
-- y también desde authenticated si es super admin (por si se quiere testing desde UI)
CREATE POLICY "admin_notifications_insert_service_role"
  ON admin_notifications
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.is_super_admin = true
    )
  );

-- ─── 4. RLS para waiters.password ──────────────────────────
-- La política existente de waiters ya cubre SELECT para el owner.
-- Solo necesitamos asegurar que el owner puede UPDATE password.
-- (Las policies existentes ya permiten update al owner_id, no hace falta tocar.)
