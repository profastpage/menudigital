---
Task ID: bg-removal-supabase-sync
Agent: main (Super Z)
Task: Implementar "Quitar fondo con un clic" (Pro 30/mes) + configurar flujo Supabase CLI + script para sincronizar env vars Supabase → Vercel via API.

Work Log:
- Actualizado `src/lib/plans.ts`: bgRemovalCredits 5 → 30, features actualizado
- Actualizado `src/lib/menu-utils.ts`: agregado `bg_removals_used` y `bg_removals_reset_at` a ProfileData
- Actualizado `supabase/schema.sql`: agregadas columnas + 2 funciones RPC (increment_bg_removals, get_bg_removals_quota)
- Creado `supabase/migrations/20250101000000_init.sql`: schema completo para `supabase db push`
- Creado `supabase/migrations/20250102000000_bg_removals.sql`: migración idempotente para DBs existentes
- Creado `supabase/config.toml`: config del CLI
- Creado `src/app/api/upload/route.ts`: sube imágenes a Supabase Storage con sharp (WebP, resize 1200px, alpha preservado)
- Creado `src/app/api/bg-removal/quota/route.ts`: GET devuelve cuota mensual {used, limit, remaining, hasFeature}
- Creado `src/app/api/bg-removal/use/route.ts`: POST incrementa contador (verifica Pro + remaining > 0)
- Creado `src/lib/bg-removal.ts`: pipeline client-side
  - Carga dinámica de `@imgly/background-removal` (WASM ~50MB, cacheado en IndexedDB)
  - autoCropAndCenter(): canvas → detecta bbox de píxeles no transparentes → recorta + 10% padding → centra en lienzo cuadrado
  - processImageWithBgRemoval(): fetch original → removeBackground → autoCrop → uploadProcessed
- Actualizado `src/app/dashboard/[menuId]/image-uploader.tsx`:
  - Botón "Quitar fondo" (solo Pro + con imagen cargada)
  - Badge de créditos restantes "X/30 restantes este mes"
  - Overlay de progreso con stages (loading-model, processing, cropping, uploading)
  - Upsell para Free: enlace a /dashboard/billing
- Creado `scripts/sync-vercel-env.js`:
  - Usa Supabase Management API para obtener anon + service_role keys
  - Usa Vercel REST API para crear env vars en production + preview + development
  - Idempotente: si la var existe, la elimina y recrea
- Creado `scripts/supabase-migrate.sh`: wrapper de `supabase link` + `supabase db push`
- Actualizado `SETUP.md`: documentación de flujo CLI + script sync + troubleshooting bg-removal
- Actualizado `.env.example`: variables opcionales para sync script
- Instalado `@imgly/background-removal@1.7.0` (browser, 50MB WASM desde CDN)

Stage Summary:
- "Quitar fondo con un clic" implementado 100% client-side (sin costo server)
- Auto-crop + center automático: bbox transparente + 10% padding + lienzo cuadrado
- Contador 30/mes con reset automático a los 30 días (función SQL `increment_bg_removals`)
- Validación: auth + plan Pro + remaining > 0 antes de procesar
- Supabase CLI workflow listo: `./scripts/supabase-migrate.sh` con SUPABASE_ACCESS_TOKEN
- Script de sync Supabase → Vercel listo: `node scripts/sync-vercel-env.js` con tokens de ambas plataformas
- Pendiente: push a GitHub profastpage/menudigital

---
Task ID: mobile-first-themes-fastnav
Agent: main (Super Z)
Task: 6 mejoras UX/features pedidas por el usuario: modal superadmin mobile-first, botón "Volver a inicio" en login/register, dashboard 100% responsivo, temas personalizables Pro, navegación ultra rápida entre subpáginas, persistencia real DB.

Work Log:
- Creado `supabase/themes-presets-and-persistence.sql`:
  * Tabla `menu_theme_presets` con 8 temas pre-diseñados (Elegante, Moderno, Picante, Fresco, Premium Gold, Grid, Parrilla, Libre)
  * RLS: público lectura, super-admin escritura
  * Índices en menus(slug,published), categories(menu_id,sort), dishes(category_id,sort), menu_views(menu_id,created_at)
  * Triggers `touch_updated_at()` en menus, categories, dishes
  * RPC `apply_theme_preset(p_menu_id, p_preset_id)` SECURITY DEFINER valida ownership y plan
- Creado `src/app/api/menus/[menuId]/preset/route.ts`: endpoint POST Pro-only aplica preset vía RPC
- Modificado `src/app/dashboard/dashboard-client.tsx`:
  * Reemplazado todos los `<a href>` por `<Link prefetch>` para navegación instantánea
  * Añadido "Volver al inicio" en sidebar desktop
  * Bottom nav mobile también usa Link con prefetch
- Modificado `src/app/superadmin/superadmin-client.tsx`:
  * Header responsive (text-sm mobile, text-base desktop, badges compactos)
  * Tabs con scroll horizontal mobile, sin scrollbar
  * Modal de detalle: bottom-sheet mobile (rounded-t-3xl), centered desktop
  * Modal: 2x2 stats grid mobile, 4 cols desktop
  * Modal: avatar+nombre stacked en mobile, row en desktop
  * Modal: botones de acción con texto abreviado (Ban en vez de "Desactivar (ban)")
  * Modal: footer sticky bottom con botón Cerrar
  * Stats cards: grid-cols-2 mobile, grid-cols-4 desktop
  * Top menus list: compacto mobile, full desktop
  * Domains tab: tarjetas mobile + tabla desktop
- Modificado `src/app/dashboard/[menuId]/editor-client.tsx`:
  * Top bar responsive (px-3 mobile, px-6 desktop)
  * Botones compactos (h-9, text-xs mobile)
  * Card padding responsive (p-4 mobile, p-6 desktop)
  * Platos: stacked layout mobile, grid sm+
  * Preview pane: hidden mobile + FAB bottom-right abre bottom sheet con iframe
  * Apariencia: galería de 8 presets Pro con preview visual (gradient + color bar)
  * Apariencia: bloque "Personalización manual" con divider después de presets
- Modificado `src/app/globals.css`:
  * xs breakpoint (400px+)
  * .scrollbar-none utility
  * .h-screen-mobile / .min-h-screen-mobile (100dvh para iOS Safari)
  * Better tap targets en mobile (min 36px)
- Creado `src/app/dashboard/[menuId]/loading.tsx`: skeleton instantáneo para editor
- Creado `src/app/dashboard/billing/loading.tsx`: skeleton con sidebar fijo
- Creado `src/app/dashboard/analytics/loading.tsx`: skeleton con 4 stat cards + chart
- Creado `src/app/dashboard/domains/loading.tsx`: skeleton con lista
- Creado `src/app/dashboard/generador/loading.tsx`: skeleton con form grande
- Modificado `src/lib/menu-utils.ts`: añadido `theme_preset_id` a MenuData

Stage Summary:
- Build OK (24 páginas generadas)
- Commit `43770d8` pushed a origin/main
- SQL entregado en `supabase/themes-presets-and-persistence.sql` y `download/themes-presets-and-persistence.sql` para copiar a Supabase SQL Editor
- Pendiente usuario: ejecutar SQL en Supabase SQL Editor

---
Task ID: redeploy-after-sql-upload
Agent: main (Super Z)
Task: Usuario confirmó que ya subió el SQL a Supabase. Solicitó hacer redeploy.

Work Log:
- Verificado git status: working tree limpio, 1 commit local ahead de origin/main
- Commit pendiente: c79a219 (worklog update)
- Commit previo ya pushed: 43770d8 feat(ux): mobile-first responsive + theme presets + fast nav
- Push exitoso: `git push origin main` → origin/main ahora en c79a219
- Vercel auto-deploy disparado por webhook de GitHub push

Stage Summary:
- Código con mobile-first responsive, temas personalizables Pro, navegación rápida y fixes de admin ya está en GitHub
- Vercel desplegará automáticamente en 1-2 minutos en https://menudigital-pro.vercel.app/
- Usuario debe ejecutar SQL en Supabase SQL Editor para tablas nuevas (menu_themes, etc.)

---
Task ID: redesign-superadmin-dashboard-shell
Agent: main (Super Z)
Task: Usuario reportó "no mejoraste el ux del super admin y panel clientes". Análisis VLM del screenshot confirmó: superadmin usa expandable cards (cramped, misaligned) y subpages del dashboard (billing/domains/analytics/generador) tienen headers desktop-only sin sidebar/drawer/bottom-nav mobile.

Work Log:
- Creado `src/components/dashboard/dashboard-shell.tsx`: shared layout con sidebar (lg+), drawer mobile (overlay), bottom-nav mobile (5 tabs), user block + logout. Acepta user/plan/isSuperAdmin/children.
- Rediseñado `superadmin-client.tsx`:
  * Desktop: tabla real con 7 columnas (Usuario, Plan, Menús, Vistas, Estado, Registro, Acciones)
  * Acciones desktop: icon-only buttons (eye/crown/cog/ban/trash) con tooltips, hover backgrounds
  * Mobile: cards con avatar, badges, stats grid 3-cols (Menús/Vistas/Platos), action grid 2-cols
  * Eliminado el patrón expand-on-click (origen del UX problemático)
  * Agregado botón "Volver a inicio" en header
- Refactorizado `dashboard-client.tsx`: usa DashboardShell, mejoradas cards de menú (hover shadow, link como botón completo)
- Refactorizado `billing-client.tsx`: usa DashboardShell, todo mobile-first (text-xs sm:text-base, grid-cols-2 sm:grid-cols-4, padding responsive)
- Refactorizado `domains-client.tsx`: usa DashboardShell, form responsive grid, DNS info con flex-wrap, break-all en dominios largos
- Refactorizado `analytics-client.tsx`: usa DashboardShell, KPIs grid responsive, bars progress con truncate en nombres
- Refactorizado `generador-client.tsx`: usa DashboardShell, toolbar sticky, iframe con height responsive
- Actualizados page.tsx de billing/domains/analytics/generador para pasar props user/plan/isSuperAdmin/profilePlan
- Verificado `npx tsc --noEmit`: 0 errores en src/
- Verificado `npx next build`: 24/24 static pages generadas exitosamente
- Commit `2792362` pusheado a origin/main — Vercel deploy activado

Stage Summary:
- DashboardShell único reutilizable en TODAS las páginas del dashboard (consistencia total)
- SuperAdmin desktop ahora usa tabla profesional (alineación perfecta, scannable)
- SuperAdmin mobile usa cards con grid de stats (claramente jerárquico)
- Todas las subpáginas son mobile-first responsive (xs/sm/md/lg breakpoints en todos los textos, paddings, grids)
- Bottom nav móvil muestra 4 tabs + Inicio en todas las subpáginas (mismo patrón que /dashboard)
