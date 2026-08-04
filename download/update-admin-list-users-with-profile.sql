-- ============================================================
-- ACTUALIZAR admin_list_all_users() para incluir campos de perfil de cliente
-- ============================================================
-- Agrega: is_demo_account, business_name, business_tax_id,
--         business_phone, business_whatsapp, logo_url, photo_url,
--         subscription_started_at, subscription_cancelled_at,
--         last_payment_at, last_payment_amount, last_payment_currency,
--         trial_ends_at, trial_plan
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_list_all_users(
  page_offset integer DEFAULT 0,
  page_limit integer DEFAULT 20,
  search text DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
  caller_admin BOOLEAN;
  total_count INT;
  users_data JSON;
BEGIN
  SELECT public.is_self_super_admin() INTO caller_admin;
  IF NOT caller_admin THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere super admin';
  END IF;

  -- Contar total
  IF search = '' THEN
    SELECT COUNT(*) INTO total_count FROM profiles;
  ELSE
    SELECT COUNT(*) INTO total_count
    FROM profiles
    WHERE email ILIKE '%' || search || '%'
       OR full_name ILIKE '%' || search || '%'
       OR COALESCE(business_name, '') ILIKE '%' || search || '%';
  END IF;

  -- Listar con stats
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json) INTO users_data
  FROM (
    SELECT
      p.id, p.email, p.full_name, p.avatar_url, p.plan,
      p.is_super_admin, p.is_active, p.banned_at, p.banned_reason,
      p.mp_status, p.mp_preapproval_id, p.current_period_end,
      p.bg_removals_used, p.bg_removals_reset_at,
      p.created_at, p.updated_at,
      -- Campos nuevos de perfil de cliente
      p.is_demo_account,
      p.business_name,
      p.business_legal_name,
      p.business_tax_id,
      p.business_phone,
      p.business_whatsapp,
      p.business_address,
      p.business_city,
      p.business_country,
      p.business_website,
      p.business_description,
      p.logo_url,
      p.photo_url,
      p.social_facebook,
      p.social_instagram,
      p.social_tiktok,
      p.social_youtube,
      p.social_x,
      p.subscription_started_at,
      p.subscription_cancelled_at,
      p.subscription_ended_at,
      p.last_payment_at,
      p.last_payment_amount,
      p.last_payment_currency,
      p.trial_ends_at,
      p.trial_plan,
      p.trial_started_at,
      p.trial_used_premium,
      p.trial_used_full,
      p.billing_email,
      p.billing_address,
      -- Stats agregadas
      COALESCE(s.menus_count, 0)       AS menus_count,
      COALESCE(s.views_total, 0)       AS views_total,
      COALESCE(s.published_menus, 0)   AS published_menus,
      COALESCE(s.dishes_count, 0)      AS dishes_count
    FROM profiles p
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)                                                AS menus_count,
        COALESCE(SUM(mn.views_count), 0)                        AS views_total,
        COUNT(*) FILTER (WHERE mn.is_published)                 AS published_menus,
        COALESCE((
          SELECT COUNT(*)
          FROM dishes d2
          JOIN categories c2 ON c2.id = d2.category_id
          JOIN menus mn2     ON mn2.id = c2.menu_id
          WHERE mn2.user_id = p.id
        ), 0)                                                   AS dishes_count
      FROM menus mn
      WHERE mn.user_id = p.id
    ) s ON true
    WHERE search = ''
       OR p.email ILIKE '%' || search || '%'
       OR p.full_name ILIKE '%' || search || '%'
       OR COALESCE(p.business_name, '') ILIKE '%' || search || '%'
  ) t
  LIMIT page_limit OFFSET page_offset;

  RETURN json_build_object(
    'users', users_data,
    'total', total_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- ============================================================
-- FIN
-- ============================================================
