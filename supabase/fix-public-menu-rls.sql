-- ============================================================
-- FIX CRÍTICO: Agregar policy para SELECT público de menús publicados
--
-- Bug: Después de audit-rls-fix.sql (FORCE RLS), las cartas públicas
-- en /r/[slug] devuelven "Menú no encontrado" porque RLS bloquea
-- SELECT anónimo. Solo menus_select_own y menus_select_admin existen.
--
-- Solución: Agregar menus_select_published que permite SELECT
-- sin auth solo cuando is_published = true.
-- ============================================================

DROP POLICY IF EXISTS "menus_select_published" ON public.menus;

CREATE POLICY "menus_select_published" ON public.menus
  FOR SELECT
  USING (is_published = true);

COMMENT ON POLICY "menus_select_published" ON public.menus IS
  'Permite acceso público anónimo a menús publicados (para /r/[slug] y /qr/[slug])';

-- Verificación
DO $$
DECLARE
  has_policy BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_policy
    JOIN pg_class ON pg_class.oid = pg_policy.polrelid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE nspname='public' AND relname='menus' AND polname='menus_select_published'
  ) INTO has_policy;

  IF has_policy THEN
    RAISE NOTICE '✅ Policy menus_select_published creada correctamente';
  ELSE
    RAISE EXCEPTION '❌ Policy menus_select_published NO fue creada';
  END IF;
END $$;
