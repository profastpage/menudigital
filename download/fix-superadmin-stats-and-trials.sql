-- ============================================================
-- FIX: Super Admin Stats — Contabilizar TODOS los planes + MRR real
-- + Tabla de trials gratuitos (5 días Premium / 10 días Full)
-- + Función para aplicar trial automáticamente
-- + Función para expirar trials vencidos
--
-- EJECUTAR EN: Supabase SQL Editor (idempotente)
-- ============================================================

-- ============================================================
-- PARTE 1: FIX admin_global_stats — Contar TODOS los planes
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_global_stats()
RETURNS JSON AS $$
DECLARE
  requesting_user RECORD;
  stats JSON;
  top_menus JSON;
  v_pro_count INTEGER;
  v_premium_count INTEGER;
  v_full_count INTEGER;
  v_free_count INTEGER;
  v_active_trials INTEGER;
  v_mrr_pen NUMERIC;
  v_mrr_usd NUMERIC;
BEGIN
  SELECT is_super_admin INTO requesting_user FROM profiles WHERE id = auth.uid();
  IF requesting_user.is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere super admin';
  END IF;

  -- Top 10 menús más vistos
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO top_menus
  FROM (
    SELECT mn.id, mn.name, mn.slug, mn.views_count,
           p.email AS owner_email, p.full_name AS owner_name,
           p.plan AS owner_plan
    FROM menus mn
    JOIN profiles p ON p.id = mn.user_id
    ORDER BY mn.views_count DESC
    LIMIT 10
  ) t;

  -- Conteos por plan (usuarios activos con mp_status='authorized' o trial vigente)
  SELECT COUNT(*) INTO v_pro_count
    FROM profiles
    WHERE plan = 'pro'
      AND (mp_status = 'authorized' OR (trial_ends_at IS NOT NULL AND trial_ends_at > NOW()));

  SELECT COUNT(*) INTO v_premium_count
    FROM profiles
    WHERE plan = 'premium'
      AND (mp_status = 'authorized' OR (trial_ends_at IS NOT NULL AND trial_ends_at > NOW()));

  SELECT COUNT(*) INTO v_full_count
    FROM profiles
    WHERE plan = 'full'
      AND (mp_status = 'authorized' OR (trial_ends_at IS NOT NULL AND trial_ends_at > NOW()));

  SELECT COUNT(*) INTO v_free_count
    FROM profiles
    WHERE plan = 'free'
      OR plan IS NULL;

  SELECT COUNT(*) INTO v_active_trials
    FROM profiles
    WHERE trial_ends_at IS NOT NULL
      AND trial_ends_at > NOW()
      AND mp_status IS DISTINCT FROM 'authorized';

  -- MRR real: suma de (plan_amount × count) por plan
  v_mrr_pen := (v_pro_count * 35) + (v_premium_count * 99) + (v_full_count * 199);
  v_mrr_usd := (v_pro_count * 9) + (v_premium_count * 26) + (v_full_count * 52);

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users', (SELECT COUNT(*) FROM profiles WHERE is_active = true),
    'banned_users', (SELECT COUNT(*) FROM profiles WHERE is_active = false),
    'free_users', v_free_count,
    'pro_users', v_pro_count,
    'premium_users', v_premium_count,
    'full_users', v_full_count,
    'active_trials', v_active_trials,
    'super_admins', (SELECT COUNT(*) FROM profiles WHERE is_super_admin = true),
    'total_menus', (SELECT COUNT(*) FROM menus),
    'published_menus', (SELECT COUNT(*) FROM menus WHERE is_published = true),
    'total_categories', (SELECT COUNT(*) FROM categories),
    'total_dishes', (SELECT COUNT(*) FROM dishes),
    'total_views', COALESCE((SELECT SUM(views_count) FROM menus), 0),
    'total_domains', (SELECT COUNT(*) FROM custom_domains),
    'verified_domains', (SELECT COUNT(*) FROM custom_domains WHERE is_verified = true),
    'recent_signups_7d', (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days'),
    'recent_signups_30d', (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '30 days'),
    'revenue_estimate_pen', v_mrr_pen,
    'revenue_estimate_usd', v_mrr_usd,
    'mrr_breakdown', json_build_object(
      'pro', json_build_object('count', v_pro_count, 'amount_pen', v_pro_count * 35, 'price_pen', 35),
      'premium', json_build_object('count', v_premium_count, 'amount_pen', v_premium_count * 99, 'price_pen', 99),
      'full', json_build_object('count', v_full_count, 'amount_pen', v_full_count * 199, 'price_pen', 199)
    ),
    'top_menus_by_views', top_menus
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PARTE 2: Columnas para trials
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_plan TEXT;
-- trial_plan: 'premium' | 'full' | NULL  (plan que el usuario está probando)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
-- trial_ends_at: fecha de fin del trial (ISO string)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
-- trial_started_at: fecha de inicio del trial
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_used_premium BOOLEAN DEFAULT false;
-- trial_used_premium: marca si el usuario ya usó su trial de Premium (no se puede repetir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_used_full BOOLEAN DEFAULT false;
-- trial_used_full: marca si el usuario ya usó su trial de Full (no se puede repetir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_card_tokenized BOOLEAN DEFAULT false;
-- trial_card_tokenized: TRUE si el usuario ya tokenizó su tarjeta al iniciar trial
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS promo_dismissed_at TIMESTAMPTZ;
-- promo_dismissed_at: timestamp si el usuario cerró la promo (se vuelve a mostrar después de 7 días)

-- Índice para buscar trials por expirar
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at
  ON profiles (trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- ============================================================
-- PARTE 3: Función — Iniciar trial (sin tarjeta, 5/10 días)
-- ============================================================
-- Llamada desde /api/billing/trial/start
-- Requiere: el usuario NO haya usado ya un trial de ese plan
--           el usuario esté en plan free o menor
-- Crea un PreApproval "pendiente" en MercadoPago con auto_recurring
-- y back_url al dashboard. NO cobra hasta que termine el trial.
--
-- Estrategia "sin fricción" (sin tarjeta):
--   - Damos acceso Premium/Full por 5/10 días
--   - Al expirar, el plan vuelve automáticamente a free
--   - Mostramos CTA al final del trial para invitar a suscribirse
--
-- Estrategia "con fricción" (con tarjeta):
--   - Igual pero MercadoPago guarda la tarjeta al iniciar
--   - Al expirar, se cobra automáticamente
--   - El usuario puede cancelar antes del fin del trial
-- ============================================================

CREATE OR REPLACE FUNCTION public.start_user_trial(
  p_plan TEXT,           -- 'premium' | 'full'
  p_days INTEGER,        -- 5 o 10
  p_with_card BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
  requesting_user RECORD;
  v_user_id UUID;
  v_email TEXT;
  v_already_used BOOLEAN;
  v_current_plan TEXT;
  v_trial_end TIMESTAMPTZ;
BEGIN
  SELECT id, email, plan, is_active INTO requesting_user, v_email, v_current_plan, requesting_user.is_active
    FROM profiles WHERE id = auth.uid();

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF requesting_user.is_active IS FALSE THEN
    RAISE EXCEPTION 'Cuenta desactivada';
  END IF;

  -- Validar plan
  IF p_plan NOT IN ('premium', 'full') THEN
    RAISE EXCEPTION 'Plan inválido para trial';
  END IF;

  -- Validar días
  IF p_days NOT IN (5, 10) THEN
    RAISE EXCEPTION 'Días de trial inválidos (solo 5 o 10)';
  END IF;

  -- Validar que el plan solicitado coincida con la promo ofrecida
  IF p_plan = 'premium' AND p_days != 5 THEN
    RAISE EXCEPTION 'Trial Premium es de 5 días';
  END IF;
  IF p_plan = 'full' AND p_days != 10 THEN
    RAISE EXCEPTION 'Trial Full es de 10 días';
  END IF;

  -- Validar que no haya usado ya este trial
  IF p_plan = 'premium' AND requesting_user.trial_used_premium THEN
    RAISE EXCEPTION 'Ya usaste tu trial de Premium';
  END IF;
  IF p_plan = 'full' AND requesting_user.trial_used_full THEN
    RAISE EXCEPTION 'Ya usaste tu trial de Full';
  END IF;

  -- No iniciar trial si ya está en ese plan o superior
  IF v_current_plan IN ('premium', 'full') THEN
    RAISE EXCEPTION 'Ya estás en un plan igual o superior';
  END IF;

  v_trial_end := NOW() + (p_days || ' days')::INTERVAL;

  -- Aplicar trial
  UPDATE profiles
    SET
      plan = p_plan,
      trial_plan = p_plan,
      trial_started_at = NOW(),
      trial_ends_at = v_trial_end,
      trial_card_tokenized = p_with_card,
      trial_used_premium = CASE WHEN p_plan = 'premium' THEN true ELSE trial_used_premium END,
      trial_used_full = CASE WHEN p_plan = 'full' THEN true ELSE trial_used_full END,
      mp_status = 'pending',
      current_period_end = v_trial_end,
      updated_at = NOW()
    WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'plan', p_plan,
    'trial_ends_at', v_trial_end,
    'days', p_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PARTE 4: Función — Expirar trials vencidos
-- Llamar desde cron job (Vercel Cron) cada 1 hora
-- o desde el webhook cuando llegue el evento de cobro fallido
-- ============================================================

CREATE OR REPLACE FUNCTION public.expire_user_trials()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Buscar usuarios con trial vencido y volverlos a free
  UPDATE profiles
    SET
      plan = 'free',
      mp_status = CASE WHEN mp_status = 'pending' THEN NULL ELSE mp_status END,
      current_period_end = NULL,
      updated_at = NOW()
    WHERE trial_ends_at IS NOT NULL
      AND trial_ends_at < NOW()
      AND plan IN ('premium', 'full')
      AND mp_status IS DISTINCT FROM 'authorized';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PARTE 5: Vista para super admin — Trials activos
-- ============================================================

CREATE OR REPLACE VIEW public.admin_active_trials AS
SELECT
  p.id, p.email, p.full_name, p.avatar_url,
  p.plan AS trial_plan,
  p.trial_started_at,
  p.trial_ends_at,
  EXTRACT(EPOCH FROM (p.trial_ends_at - NOW())) / 86400 AS days_remaining,
  p.trial_card_tokenized,
  p.trial_used_premium,
  p.trial_used_full
FROM profiles p
WHERE p.trial_ends_at IS NOT NULL
  AND p.trial_ends_at > NOW()
  AND p.mp_status IS DISTINCT FROM 'authorized'
ORDER BY p.trial_ends_at ASC;

-- Comentario para que aparezca en el panel de Supabase
COMMENT ON VIEW public.admin_active_trials IS 'Usuarios con trial activo (Premium 5d / Full 10d)';

-- ============================================================
-- PARTE 6: Función — ¿Puede el usuario ver la promo de trial?
-- Llamada desde /api/billing/trial/eligibility
-- Reglas:
--   - Usuario en plan free o pro
--   - No haya usado el trial de ese plan antes
--   - No tenga trial activo ahora
--   - Si cerró la promo (promo_dismissed_at), esperar 7 días
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_trial_eligibility()
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_show_premium BOOLEAN;
  v_show_full BOOLEAN;
  v_dismissed_age_days NUMERIC;
BEGIN
  SELECT plan, trial_used_premium, trial_used_full, trial_ends_at, promo_dismissed_at
    INTO v_user
    FROM profiles WHERE id = auth.uid();

  IF v_user.plan IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Si ya está en plan premium o full, no mostrar trials
  IF v_user.plan IN ('premium', 'full') THEN
    RETURN json_build_object(
      'show_premium_trial', false,
      'show_full_trial', false,
      'reason', 'already_on_premium_or_full'
    );
  END IF;

  -- Si tiene trial activo, no mostrar más promos
  IF v_user.trial_ends_at IS NOT NULL AND v_user.trial_ends_at > NOW() THEN
    RETURN json_build_object(
      'show_premium_trial', false,
      'show_full_trial', false,
      'reason', 'trial_active',
      'trial_ends_at', v_user.trial_ends_at
    );
  END IF;

  -- Calcular días desde dismissed
  v_dismissed_age_days := CASE
    WHEN v_user.promo_dismissed_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (NOW() - v_user.promo_dismissed_at)) / 86400
    ELSE 999
  END;

  -- Mostrar promo si han pasado 7 días desde el último dismiss
  v_show_premium := (NOT v_user.trial_used_premium) AND v_dismissed_age_days >= 7;
  v_show_full := (NOT v_user.trial_used_full) AND v_dismissed_age_days >= 7;

  RETURN json_build_object(
    'show_premium_trial', v_show_premium,
    'show_full_trial', v_show_full,
    'premium_days', 5,
    'full_days', 10,
    'current_plan', v_user.plan,
    'dismissed_age_days', v_dismissed_age_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PARTE 7: Función — Cerrar promo (dismiss)
-- ============================================================

CREATE OR REPLACE FUNCTION public.dismiss_trial_promo()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE profiles
    SET promo_dismissed_at = NOW(),
        updated_at = NOW()
    WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'dismissed_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIN — Resumen de cambios:
--
-- 1. admin_global_stats() ahora cuenta Free + Pro + Premium + Full
--    + trials activos + MRR real (Pro×35 + Premium×99 + Full×199)
--
-- 2. Nuevas columnas en profiles:
--    trial_plan, trial_ends_at, trial_started_at,
--    trial_used_premium, trial_used_full, trial_card_tokenized,
--    promo_dismissed_at
--
-- 3. Nuevas funciones RPC:
--    start_user_trial(plan, days, with_card)
--    expire_user_trials()  ← llamar desde cron
--    check_trial_eligibility()
--    dismiss_trial_promo()
--
-- 4. Nueva vista admin_active_trials
-- ============================================================
