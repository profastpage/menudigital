-- ============================================================
-- FIX CRÍTICO: RLS para categories y dishes publicados (acceso público)
--
-- Bug: Las cartas públicas /r/[slug] cargan el menú pero NO las
-- categorías ni los platos. Las políticas solo permiten SELECT own/admin.
--
-- Fix: Agregar policies que permitan SELECT anónimo de categories/dishes
-- cuya relación al menú es is_published = true.
-- ============================================================

-- ─── Categories: SELECT público si el menu está publicado ───
DROP POLICY IF EXISTS "categories_select_published" ON public.categories;
CREATE POLICY "categories_select_published" ON public.categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.menus
      WHERE menus.id = categories.menu_id
      AND menus.is_published = true
    )
  );
COMMENT ON POLICY "categories_select_published" ON public.categories IS
  'Permite acceso público anónimo a categorías de menús publicados';

-- ─── Dishes: SELECT público si el menu (vía category) está publicado ───
DROP POLICY IF EXISTS "dishes_select_published" ON public.dishes;
CREATE POLICY "dishes_select_published" ON public.dishes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.categories
      JOIN public.menus ON menus.id = categories.menu_id
      WHERE categories.id = dishes.category_id
      AND menus.is_published = true
    )
  );
COMMENT ON POLICY "dishes_select_published" ON public.dishes IS
  'Permite acceso público anónimo a platos de menús publicados';

-- ─── Verificación ───
DO $$
DECLARE
  c_pol BOOLEAN;
  d_pol BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE nspname='public' AND relname='categories' AND polname='categories_select_published') INTO c_pol;
  SELECT EXISTS(SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE nspname='public' AND relname='dishes' AND polname='dishes_select_published') INTO d_pol;

  IF c_pol AND d_pol THEN
    RAISE NOTICE '✅ Policies creadas: categories_select_published y dishes_select_published';
  ELSE
    RAISE EXCEPTION '❌ Faltan policies: c=%, d=%', c_pol, d_pol;
  END IF;
END $$;
