-- ============================================================
-- Tabla whatsapp_clicks — tracking REAL de clics en botón WhatsApp
-- del menú público (reemplaza la estimación del 25% en analytics).
--
-- Esquema idéntico a menu_views para mantener consistencia.
-- RLS permite INSERT anónimo (cualquiera puede trackear desde el menú público)
-- pero SELECT solo el dueño del menú o super-admin.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  ip TEXT,
  user_agent TEXT,
  source TEXT,  -- 'cart' (enviar pedido) | 'social' (ícono social) | 'direct'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_clicks FORCE ROW LEVEL SECURITY;

-- Índices para consultas eficientes por menú + rango de fecha
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_menu_id ON public.whatsapp_clicks(menu_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_created_at ON public.whatsapp_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_menu_created ON public.whatsapp_clicks(menu_id, created_at);

-- DROP policies existentes (idempotente)
DROP POLICY IF EXISTS "whatsapp_clicks_insert_any" ON public.whatsapp_clicks;
DROP POLICY IF EXISTS "whatsapp_clicks_select_own" ON public.whatsapp_clicks;
DROP POLICY IF EXISTS "whatsapp_clicks_select_admin" ON public.whatsapp_clicks;

-- INSERT anónimo — el cliente público no tiene sesión
CREATE POLICY "whatsapp_clicks_insert_any" ON public.whatsapp_clicks
  FOR INSERT WITH CHECK (true);

-- SELECT solo para el dueño del menú
CREATE POLICY "whatsapp_clicks_select_own" ON public.whatsapp_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = whatsapp_clicks.menu_id
      AND menus.user_id = auth.uid()
    )
  );

-- SELECT para super-admin
CREATE POLICY "whatsapp_clicks_select_admin" ON public.whatsapp_clicks
  FOR SELECT USING (public.is_self_super_admin());

COMMENT ON TABLE public.whatsapp_clicks IS 'Tracking real de clics en botón WhatsApp del menú público (reemplaza estimación 25%)';
COMMENT ON COLUMN public.whatsapp_clicks.source IS 'cart = botón Enviar Pedido, social = ícono WhatsApp en redes, direct = otros';
