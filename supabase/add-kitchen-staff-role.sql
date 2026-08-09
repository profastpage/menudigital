-- =====================================================================
-- Cocina staff (cocineros) — Add `role` column to waiters table
-- ---------------------------------------------------------------------
-- Permite que el mismo modelo `waiters` se use tanto para MOZOS como
-- para COCINEROS, filtrando por la columna `role`.
--
-- Valores:
--   'mozo'     (default) — mesero, atiende mesas y envía comandas
--   'cocinero'          — cocina, recibe comandas y las prepara
--
-- Esta migración ya fue aplicada a producción vía script Python
-- (scripts/apply-menu-images-bucket.py).
-- =====================================================================

-- 1. Agregar columna `role` (idempotente)
alter table waiters
  add column if not exists role text not null default 'mozo'
  check (role in ('mozo', 'cocinero'));

-- 2. Índice para filtrar por owner + role
create index if not exists waiters_owner_role_idx
  on waiters(owner_id, role);

-- 3. Verificación
select role, count(*)
from waiters
group by role
order by role;
