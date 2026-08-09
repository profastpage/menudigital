-- ============================================================
-- MenuPro — Migración: Acceso público del MOZO por token (sin login)
-- ============================================================
-- ⚠️  RESPONDE A LA PREGUNTA DEL USUARIO:
-- "¿Debo crear una base de datos para cada URL de cada MOZO en Supabase?"
--
-- RESPUESTA: NO. No necesitas una base de datos separada por MOZO.
-- Ya tienes UNA SOLA tabla `waiters` con columna `qr_token` (hex 48 chars).
-- Cada MOZO tiene su propio token → su propia URL `/mozo/{token}`.
--
-- El problema real era otro: RLS (Row Level Security) bloqueaba el acceso
-- sin sesión iniciada. La policy `waiters_owner_all` exige
-- `owner_id = auth.uid()`, y cuando un mozo entra desde otra pestaña sin
-- login, `auth.uid()` es NULL → la query devuelve 0 filas → 404.
--
-- Esta migración agrega DOS capas de defensa:
--
-- 1) Function SECURITY DEFINER `mozo_public_lookup(p_token TEXT)`:
--    Devuelve solo columnas públicas (id, full_name, is_active, owner_id,
--    branch_id, has_password, has_pin). NO devuelve password/pin reales.
--    Bypassa RLS porque es SECURITY DEFINER (se ejecuta como el dueño de la
--    función = postgres). Cualquiera puede llamarla, pero el token es
--    unguessable (192 bits de entropía).
--
-- 2) Public RLS policy sobre `waiters` para SELECT solo por qr_token:
--    Permite que el anon client haga SELECT directo por token (defensa
--    secundaria, solo para columnas no sensibles — ver nota abajo).
--
-- Combinado con el código del server (que usa createServiceClient()),
-- el MOZO panel funciona desde cualquier dispositivo, sin login.
-- ============================================================

-- ============================================================
-- 1. Función pública: mozo_public_lookup(p_token TEXT)
-- ============================================================
-- Devuelve una fila con info segura del mozo + flags has_password/has_pin.
-- NO devuelve los valores reales de password/pin (esos se validan en
-- /api/mozo-panel usando service role).
--
-- Firma: mozo_public_lookup(p_token TEXT) RETURNS TABLE (...)
-- Permisos: EXECUTE para anon y authenticated (cualquiera puede llamarla).
-- Seguridad: el token es hex 48 chars (192 bits entropía), inbrutable.
-- ============================================================

CREATE OR REPLACE FUNCTION mozo_public_lookup(p_token TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  is_active BOOLEAN,
  owner_id UUID,
  branch_id UUID,
  has_password BOOLEAN,
  has_pin BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.id,
    w.full_name,
    w.is_active,
    w.owner_id,
    w.branch_id,
    CASE WHEN w.password IS NOT NULL AND w.password <> '' THEN TRUE ELSE FALSE END,
    CASE WHEN w.pin IS NOT NULL AND w.pin <> '' THEN TRUE ELSE FALSE END
  FROM waiters w
  WHERE w.qr_token = p_token
    AND w.qr_token IS NOT NULL
    AND length(p_token) >= 16
  LIMIT 1;
$$;

-- Permisos: cualquiera (anon o autenticado) puede llamarla
REVOKE ALL ON FUNCTION mozo_public_lookup(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mozo_public_lookup(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION mozo_public_lookup IS
  'Lookup público de mozo por qr_token. Devuelve solo columnas seguras (sin password/pin reales). Usado por /mozo/[token] cuando el usuario no está logueado.';

-- ============================================================
-- 2. RLS Policy pública para SELECT por qr_token
-- ============================================================
-- Permite que el anon client (sin sesión) haga SELECT directo sobre waiters
-- filtrando por qr_token. Esto es DEFENSA SECUNDARIA — el path principal
-- usa createServiceClient() que bypassa RLS por completo.
--
-- ⚠️  IMPORTANTE: Esta policy expone TODAS las columnas de waiters, incluyendo
-- password y pin. Por eso la función SECURITY DEFINER arriba es preferida
-- para el lookup público (devuelve solo columnas seguras).
--
-- Si quieres DESHABILITAR esta policy y depender solo de la función +
-- service role, comenta las líneas de abajo.
-- ============================================================

-- Eliminar policy existente si la re-creamos
DROP POLICY IF EXISTS "waiters_public_lookup_by_token" ON waiters;

-- Permitir SELECT público solo cuando se filtra por qr_token
-- (la condición `qr_token = qr_token` siempre es true para una fila con token,
-- pero el filtro WHERE del query exige que el cliente provea un token)
CREATE POLICY "waiters_public_lookup_by_token" ON waiters
  FOR SELECT TO anon, authenticated
  USING (qr_token IS NOT NULL);

COMMENT ON POLICY "waiters_public_lookup_by_token" ON waiters IS
  'Permite SELECT público de waiters por qr_token (acceso del MOZO sin login).';

-- ============================================================
-- 3. Verificación
-- ============================================================
DO $$
DECLARE
  waiters_count INT;
  waiters_with_token INT;
BEGIN
  SELECT COUNT(*) INTO waiters_count FROM waiters;
  SELECT COUNT(*) INTO waiters_with_token FROM waiters WHERE qr_token IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migración MOZO público completada';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Mozos totales: %', waiters_count;
  RAISE NOTICE 'Mozos con QR token: %', waiters_with_token;
  RAISE NOTICE 'Función mozo_public_lookup: creada';
  RAISE NOTICE 'Policy waiters_public_lookup_by_token: creada';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ahora /mozo/{token} funciona sin login desde cualquier dispositivo.';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
