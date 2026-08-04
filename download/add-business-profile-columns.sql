-- ============================================================
-- PERFIL DE CLIENTE + MARCA DEMO + DATOS DE SUSCRIPCIÓN
-- ============================================================
-- Agrega columnas faltantes para:
--   - Datos del negocio (razón social, RUC, dirección, teléfono, etc.)
--   - Logo del negocio + foto de perfil
--   - Redes sociales
--   - Horario de atención
--   - Marcar cuentas demo (is_demo_account)
--   - Fechas de suscripción (subscription_started_at, subscription_ended_at)
--
-- Idempotente — seguro ejecutar múltiples veces.
-- ============================================================

-- ============================================================
-- PARTE 1: Marcar cuentas demo
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo_account BOOLEAN DEFAULT false;

-- ============================================================
-- PARTE 2: Datos del negocio
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
-- Nombre comercial del negocio (ej: "Pollería Don Tito")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_legal_name TEXT;
-- Razón social (ej: "Inversiones Don Tito SAC")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_tax_id TEXT;
-- RUC / DNI / RFC / NIT según país
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_whatsapp TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_country TEXT DEFAULT 'Perú';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_description TEXT;
-- Descripción breve del negocio (ej: "Pollería al carbón desde 1998")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_website TEXT;

-- ============================================================
-- PARTE 3: Logo del negocio + foto de perfil
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================================
-- PARTE 4: Redes sociales
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_tiktok TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_youtube TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_x TEXT;
-- Twitter/X handle

-- ============================================================
-- PARTE 5: Horario de atención (JSON)
-- ============================================================
-- Ej: {"mon": {"open": "09:00", "close": "22:00"}, "tue": {...}, ...}
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_timezone TEXT DEFAULT 'America/Lima';

-- ============================================================
-- PARTE 6: Fechas de suscripción (más precisas que current_period_end)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
-- Fecha del primer pago exitoso
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ended_at TIMESTAMPTZ;
-- Fecha de cancelación (cuando el usuario decide no renovar)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(10, 2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_currency TEXT DEFAULT 'PEN';

-- ============================================================
-- PARTE 7: Datos de facturación
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_email TEXT;
-- Email donde recibir facturas (puede ser diferente al email de login)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- ============================================================
-- PARTE 8: Marcar cuentas demo existentes
-- ============================================================
UPDATE profiles
  SET is_demo_account = true
  WHERE email IN (
    'demo@menudigital.pro',
    'demopro@menudigital.pro',
    'demopremium@menudigital.pro',
    'demofull@menudigital.pro'
  );

-- ============================================================
-- PARTE 9: Función — actualizar perfil de negocio
-- ============================================================
-- Permite al usuario actualizar sus datos de negocio desde /dashboard/account
CREATE OR REPLACE FUNCTION public.update_business_profile(
  p_business_name TEXT,
  p_business_legal_name TEXT DEFAULT NULL,
  p_business_tax_id TEXT DEFAULT NULL,
  p_business_phone TEXT DEFAULT NULL,
  p_business_whatsapp TEXT DEFAULT NULL,
  p_business_address TEXT DEFAULT NULL,
  p_business_city TEXT DEFAULT NULL,
  p_business_country TEXT DEFAULT NULL,
  p_business_postal_code TEXT DEFAULT NULL,
  p_business_description TEXT DEFAULT NULL,
  p_business_website TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_social_facebook TEXT DEFAULT NULL,
  p_social_instagram TEXT DEFAULT NULL,
  p_social_tiktok TEXT DEFAULT NULL,
  p_social_youtube TEXT DEFAULT NULL,
  p_social_x TEXT DEFAULT NULL,
  p_business_hours JSONB DEFAULT NULL,
  p_billing_email TEXT DEFAULT NULL,
  p_billing_address TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_updated RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE profiles
    SET
      business_name = COALESCE(p_business_name, business_name),
      business_legal_name = COALESCE(p_business_legal_name, business_legal_name),
      business_tax_id = COALESCE(p_business_tax_id, business_tax_id),
      business_phone = COALESCE(p_business_phone, business_phone),
      business_whatsapp = COALESCE(p_business_whatsapp, business_whatsapp),
      business_address = COALESCE(p_business_address, business_address),
      business_city = COALESCE(p_business_city, business_city),
      business_country = COALESCE(p_business_country, business_country),
      business_postal_code = COALESCE(p_business_postal_code, business_postal_code),
      business_description = COALESCE(p_business_description, business_description),
      business_website = COALESCE(p_business_website, business_website),
      logo_url = COALESCE(p_logo_url, logo_url),
      photo_url = COALESCE(p_photo_url, photo_url),
      full_name = COALESCE(p_full_name, full_name),
      social_facebook = COALESCE(p_social_facebook, social_facebook),
      social_instagram = COALESCE(p_social_instagram, social_instagram),
      social_tiktok = COALESCE(p_social_tiktok, social_tiktok),
      social_youtube = COALESCE(p_social_youtube, social_youtube),
      social_x = COALESCE(p_social_x, social_x),
      business_hours = COALESCE(p_business_hours, business_hours),
      billing_email = COALESCE(p_billing_email, billing_email),
      billing_address = COALESCE(p_billing_address, billing_address),
      updated_at = NOW()
    WHERE id = v_user_id
    RETURNING
      business_name, full_name, logo_url, photo_url, business_tax_id, business_phone
    INTO v_updated;

  RETURN json_build_object(
    'success', true,
    'updated', row_to_json(v_updated)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PARTE 10: Función — obtener perfil completo del usuario
-- ============================================================
-- Incluye días restantes de suscripción calculados dinámicamente
CREATE OR REPLACE FUNCTION public.get_my_full_profile()
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_days_remaining INTEGER;
  v_trial_days_remaining INTEGER;
  v_is_trial BOOLEAN;
BEGIN
  SELECT * INTO v_user FROM profiles WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Días restantes de suscripción
  v_days_remaining := CASE
    WHEN v_user.current_period_end IS NOT NULL
      AND v_user.current_period_end > NOW()
    THEN CEIL(EXTRACT(EPOCH FROM (v_user.current_period_end - NOW())) / 86400)
    ELSE 0
  END;

  -- Días restantes de trial
  v_trial_days_remaining := CASE
    WHEN v_user.trial_ends_at IS NOT NULL
      AND v_user.trial_ends_at > NOW()
    THEN CEIL(EXTRACT(EPOCH FROM (v_user.trial_ends_at - NOW())) / 86400)
    ELSE 0
  END;

  v_is_trial := v_user.trial_ends_at IS NOT NULL
    AND v_user.trial_ends_at > NOW()
    AND v_user.mp_status IS DISTINCT FROM 'authorized';

  RETURN json_build_object(
    'id', v_user.id,
    'email', v_user.email,
    'full_name', v_user.full_name,
    'avatar_url', v_user.avatar_url,
    'photo_url', v_user.photo_url,
    'logo_url', v_user.logo_url,
    'plan', v_user.plan,
    'mp_status', v_user.mp_status,
    'mp_preapproval_id', v_user.mp_preapproval_id,
    'current_period_end', v_user.current_period_end,
    'days_remaining', v_days_remaining,
    'subscription_started_at', v_user.subscription_started_at,
    'subscription_ended_at', v_user.subscription_ended_at,
    'subscription_cancelled_at', v_user.subscription_cancelled_at,
    'last_payment_at', v_user.last_payment_at,
    'last_payment_amount', v_user.last_payment_amount,
    'last_payment_currency', v_user.last_payment_currency,
    'is_trial', v_is_trial,
    'trial_plan', v_user.trial_plan,
    'trial_ends_at', v_user.trial_ends_at,
    'trial_days_remaining', v_trial_days_remaining,
    'trial_used_premium', v_user.trial_used_premium,
    'trial_used_full', v_user.trial_used_full,
    'is_demo_account', v_user.is_demo_account,
    'is_active', v_user.is_active,
    'is_super_admin', v_user.is_super_admin,
    'created_at', v_user.created_at,
    'business_name', v_user.business_name,
    'business_legal_name', v_user.business_legal_name,
    'business_tax_id', v_user.business_tax_id,
    'business_phone', v_user.business_phone,
    'business_whatsapp', v_user.business_whatsapp,
    'business_address', v_user.business_address,
    'business_city', v_user.business_city,
    'business_country', v_user.business_country,
    'business_postal_code', v_user.business_postal_code,
    'business_description', v_user.business_description,
    'business_website', v_user.business_website,
    'business_hours', v_user.business_hours,
    'business_timezone', v_user.business_timezone,
    'social_facebook', v_user.social_facebook,
    'social_instagram', v_user.social_instagram,
    'social_tiktok', v_user.social_tiktok,
    'social_youtube', v_user.social_youtube,
    'social_x', v_user.social_x,
    'billing_email', v_user.billing_email,
    'billing_address', v_user.billing_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIN — Resumen de cambios
-- ============================================================
-- 23 columnas nuevas en profiles
-- 2 funciones RPC: update_business_profile, get_my_full_profile
-- 4 cuentas existentes marcadas como demo
-- ============================================================
