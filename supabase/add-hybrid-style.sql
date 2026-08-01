-- ============================================================
-- Migración: Estilo Híbrido + Sticky Bottom Bar + Search Overlay
-- ============================================================
-- Cambios:
--   1. theme_hybrid_style     (boolean, default false)
--      Activa modo híbrido: cada categoría puede tener su propio estilo
--      (carrusel, lista rappi, o clásico)
--   2. theme_hybrid_config    (text, nullable)
--      JSON con la configuración per-categoría:
--      {"0":"carousel","1":"list","2":"classic","3":"carousel"}
--      Keys = category sort_order (como string), values = estilo
--   3. theme_sticky_top_bar   (boolean, default true)
--      Barra inferior sticky delgada con botón "Subir al inicio"
--      Visible en desktop (en mobile el bottom-nav cumple la misma función)
--
-- Idempotente: usa IF NOT EXISTS / DO blocks. Se puede ejecutar
-- múltiples veces sin error.
-- ============================================================

-- ─── 1. Nuevas columnas en menus ─────────────────────────────
DO $$
BEGIN
  -- theme_hybrid_style: activa modo híbrido (per-category style selection)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menus' AND column_name = 'theme_hybrid_style'
  ) THEN
    ALTER TABLE menus ADD COLUMN theme_hybrid_style BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  -- theme_hybrid_config: JSON con la config per-categoría
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menus' AND column_name = 'theme_hybrid_config'
  ) THEN
    ALTER TABLE menus ADD COLUMN theme_hybrid_config TEXT;
  END IF;

  -- theme_sticky_top_bar: barra inferior sticky con botón "subir"
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menus' AND column_name = 'theme_sticky_top_bar'
  ) THEN
    ALTER TABLE menus ADD COLUMN theme_sticky_top_bar BOOLEAN NOT NULL DEFAULT TRUE;
  END IF;
END $$;

-- ─── 2. Comentarios informativos ─────────────────────────────
COMMENT ON COLUMN menus.theme_hybrid_style IS 'Activa modo híbrido: cada categoría puede tener su propio estilo (carousel, list, classic)';
COMMENT ON COLUMN menus.theme_hybrid_config IS 'JSON con configuración per-categoría: {"0":"carousel","1":"list","2":"classic"}. Keys = sort_order de categoría';
COMMENT ON COLUMN menus.theme_sticky_top_bar IS 'Barra inferior sticky delgada con botón "Subir al inicio". Default true. Visible en desktop';

-- ─── 3. Verificación final ───────────────────────────────────
DO $$
DECLARE
  hybrid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO hybrid_count
  FROM information_schema.columns
  WHERE table_name = 'menus' AND column_name IN (
    'theme_hybrid_style',
    'theme_hybrid_config',
    'theme_sticky_top_bar'
  );

  RAISE NOTICE 'Migración completada: % columnas híbridas agregadas', hybrid_count;
  RAISE NOTICE '✅ Listo. El modo híbrido + sticky top bar están disponibles en el editor.';
END $$;
