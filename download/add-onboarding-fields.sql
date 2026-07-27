-- ============================================================
-- Onboarding: añade columnas para tracking del onboarding
-- ============================================================
-- Campos:
--   onboarding_completed_at: NULL hasta que el usuario completa el wizard
--   phone: teléfono de contacto del negocio
--   business_name: nombre comercial del negocio (no el del menú)
--   business_type: rubro (polleria, chifa, pizzeria, burgers, cevicheria, etc.)
--
-- Idempotente.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Índice para identificar rápido usuarios sin onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_pending
  ON public.profiles (id) WHERE onboarding_completed_at IS NULL;
