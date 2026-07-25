-- ============================================================
-- SUPER ADMIN — Funciones avanzadas y migraciones
-- Ejecutar en Supabase SQL Editor (idempotente)
-- ============================================================

-- 1) Columna para activar/desactivar usuarios (banned)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- 2) Función RPC: admin_list_all_users
--    Devuelve lista completa con conteo de menús, vistas, etc.
--    Solo super_admin puede ejecutarla.
CREATE OR REPLACE FUNCTION public.admin_list_all_users(page_offset INTEGER DEFAULT 0, page_limit INTEGER DEFAULT 50, search TEXT DEFAULT '')
RETURNS JSON AS $$
DECLARE
  requesting_user RECORD;
  result_data JSON;
  total_count INTEGER;
BEGIN
  -- Verificar que el solicitante es super admin
  SELECT is_super_admin INTO requesting_user FROM profiles WHERE id = auth.uid();
  IF requesting_user.is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere super admin';
  END IF;

  -- Contar total
  IF search IS NULL OR search = '' THEN
    SELECT COUNT(*) INTO total_count FROM profiles;
  ELSE
    SELECT COUNT(*) INTO total_count FROM profiles
      WHERE email ILIKE '%' || search || '%' OR full_name ILIKE '%' || search || '%';
  END IF;

  -- Obtener usuarios con métricas
  IF search IS NULL OR search = '' THEN
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json) INTO result_data
    FROM (
      SELECT
        p.id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.plan,
        p.is_super_admin,
        p.is_active,
        p.banned_at,
        p.banned_reason,
        p.mp_status,
        p.mp_preapproval_id,
        p.current_period_end,
        p.bg_removals_used,
        p.bg_removals_reset_at,
        p.created_at,
        p.updated_at,
        COALESCE(m.stats_menus, 0) AS menus_count,
        COALESCE(m.stats_views, 0) AS views_total,
        COALESCE(m.stats_published, 0) AS published_menus,
        COALESCE(d.stats_dishes, 0) AS dishes_count
      FROM profiles p
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS stats_menus,
          COALESCE(SUM(views_count), 0) AS stats_views,
          COUNT(*) FILTER (WHERE is_published) AS stats_published
        FROM menus WHERE user_id = p.id
      ) m ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS stats_dishes
        FROM dishes d
        JOIN categories c ON c.id = d.category_id
        JOIN menus mn ON mn.id = c.menu_id
        WHERE mn.user_id = p.id
      ) d ON true
      ORDER BY p.created_at DESC
      LIMIT page_limit OFFSET page_offset
    ) t;
  ELSE
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json) INTO result_data
    FROM (
      SELECT
        p.id, p.email, p.full_name, p.avatar_url, p.plan,
        p.is_super_admin, p.is_active, p.banned_at, p.banned_reason,
        p.mp_status, p.mp_preapproval_id, p.current_period_end,
        p.bg_removals_used, p.bg_removals_reset_at,
        p.created_at, p.updated_at,
        COALESCE(m.stats_menus, 0) AS menus_count,
        COALESCE(m.stats_views, 0) AS views_total,
        COALESCE(m.stats_published, 0) AS published_menus,
        COALESCE(d.stats_dishes, 0) AS dishes_count
      FROM profiles p
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS stats_menus,
          COALESCE(SUM(views_count), 0) AS stats_views,
          COUNT(*) FILTER (WHERE is_published) AS stats_published
        FROM menus WHERE user_id = p.id
      ) m ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS stats_dishes
        FROM dishes d
        JOIN categories c ON c.id = d.category_id
        JOIN menus mn ON mn.id = c.menu_id
        WHERE mn.user_id = p.id
      ) d ON true
      WHERE p.email ILIKE '%' || search || '%' OR p.full_name ILIKE '%' || search || '%'
      ORDER BY p.created_at DESC
      LIMIT page_limit OFFSET page_offset
    ) t;
  END IF;

  RETURN json_build_object(
    'users', result_data,
    'total', total_count,
    'page_offset', page_offset,
    'page_limit', page_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Función RPC: admin_toggle_user_active
--    Activa/desactiva un usuario (ban/unban)
CREATE OR REPLACE FUNCTION public.admin_toggle_user_active(target_user_id UUID, reason TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  requesting_user RECORD;
  target_user RECORD;
  new_state BOOLEAN;
BEGIN
  SELECT is_super_admin INTO requesting_user FROM profiles WHERE id = auth.uid();
  IF requesting_user.is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere super admin';
  END IF;

  -- No permitir banearse a uno mismo
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes desactivarte a ti mismo';
  END IF;

  SELECT is_active, is_super_admin INTO target_user FROM profiles WHERE id = target_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- No banear a otros super admins
  IF target_user.is_super_admin THEN
    RAISE EXCEPTION 'No puedes desactivar a otro super admin';
  END IF;

  new_state := NOT target_user.is_active;

  UPDATE profiles
    SET
      is_active = new_state,
      banned_at = CASE WHEN new_state = false THEN NOW() ELSE NULL END,
      banned_reason = CASE WHEN new_state = false THEN reason ELSE NULL END,
      updated_at = NOW()
    WHERE id = target_user_id;

  RETURN json_build_object(
    'success', true,
    'is_active', new_state,
    'user_id', target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Función RPC: admin_get_user_detail
--    Devuelve TODO el detalle de un usuario: perfil, menús, categorías, platos, dominios
CREATE OR REPLACE FUNCTION public.admin_get_user_detail(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  requesting_user RECORD;
  profile_data JSON;
  menus_data JSON;
  domains_data JSON;
  recent_views JSON;
BEGIN
  SELECT is_super_admin INTO requesting_user FROM profiles WHERE id = auth.uid();
  IF requesting_user.is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere super admin';
  END IF;

  -- Perfil
  SELECT row_to_json(p) INTO profile_data FROM profiles p WHERE id = target_user_id;
  IF profile_data IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Menús con categorías y platos
  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json) INTO menus_data
  FROM (
    SELECT
      mn.id, mn.name, mn.slug, mn.slogan, mn.description, mn.whatsapp,
      mn.logo_url, mn.color, mn.currency, mn.branding_text,
      mn.is_published, mn.views_count, mn.created_at, mn.updated_at,
      COALESCE(cats.categories, '[]'::json) AS categories
    FROM menus mn
    LEFT JOIN LATERAL (
      SELECT COALESCE(json_agg(row_to_json(c) ORDER BY c.sort_order), '[]'::json) AS categories
      FROM (
        SELECT
          cat.id, cat.name, cat.sort_order,
          COALESCE(dsh.dishes, '[]'::json) AS dishes
        FROM categories cat
        LEFT JOIN LATERAL (
          SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.sort_order), '[]'::json) AS dishes
          FROM (
            SELECT id, name, description, price, image_url, sort_order
            FROM dishes WHERE category_id = cat.id
          ) d
        ) dsh ON true
        WHERE cat.menu_id = mn.id
      ) c
    ) cats ON true
    WHERE mn.user_id = target_user_id
  ) t;

  -- Dominios
  SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.created_at DESC), '[]'::json) INTO domains_data
  FROM custom_domains d WHERE user_id = target_user_id;

  -- Vistas recientes (últimas 50)
  SELECT COALESCE(json_agg(row_to_json(v) ORDER BY v.created_at DESC), '[]'::json) INTO recent_views
  FROM (
    SELECT mv.id, mv.menu_id, mv.ip, mv.user_agent, mv.created_at, m.name AS menu_name
    FROM menu_views mv
    JOIN menus m ON m.id = mv.menu_id
    WHERE m.user_id = target_user_id
    LIMIT 50
  ) v;

  RETURN json_build_object(
    'profile', profile_data,
    'menus', menus_data,
    'domains', domains_data,
    'recent_views', recent_views
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Función RPC: admin_global_stats
--    Estadísticas globales para el dashboard de super admin
CREATE OR REPLACE FUNCTION public.admin_global_stats()
RETURNS JSON AS $$
DECLARE
  requesting_user RECORD;
  stats JSON;
BEGIN
  SELECT is_super_admin INTO requesting_user FROM profiles WHERE id = auth.uid();
  IF requesting_user.is_super_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere super admin';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users', (SELECT COUNT(*) FROM profiles WHERE is_active = true),
    'banned_users', (SELECT COUNT(*) FROM profiles WHERE is_active = false),
    'pro_users', (SELECT COUNT(*) FROM profiles WHERE plan = 'pro'),
    'free_users', (SELECT COUNT(*) FROM profiles WHERE plan = 'free'),
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
    'revenue_estimate_pen', (SELECT COUNT(*) FROM profiles WHERE plan = 'pro') * 35,
    'revenue_estimate_usd', (SELECT COUNT(*) FROM profiles WHERE plan = 'pro') * 9,
    'top_menus_by_views', COALESCE((
      SELECT json_agg(row_to_json(t) ORDER BY t.views_count DESC LIMIT 10)
      FROM (
        SELECT mn.id, mn.name, mn.slug, mn.views_count,
               p.email AS owner_email, p.full_name AS owner_name
        FROM menus mn
        JOIN profiles p ON p.id = mn.user_id
        ORDER BY mn.views_count DESC
        LIMIT 10
      ) t
    ), '[]'::json)
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Política RLS para is_active — los usuarios desactivados no pueden loguearse
--    (se maneja a nivel de aplicación con check en middleware/api)
-- Nota: auth.users no tiene RLS, pero profiles sí.

-- 7) Marcar a profastpage@gmail.com y expertperutravel@gmail.com como super admin
UPDATE profiles SET is_super_admin = true, is_active = true
  WHERE email IN ('profastpage@gmail.com', 'expertperutravel@gmail.com');

-- ============================================================
-- FIN — Funciones creadas:
--   admin_list_all_users(offset, limit, search) → JSON con métricas
--   admin_toggle_user_active(user_id, reason)   → ban/unban
--   admin_get_user_detail(user_id)              → perfil + menús + dominios + vistas
--   admin_global_stats()                        → métricas globales + top menús
-- ============================================================
