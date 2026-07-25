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

---
Task ID: menupro-social-cover-lightbox
Agent: Main agent (Super Z)
Task: Add real-time preview, auto-save, cover image behind profile, social media icons (Lucide), expandable dish lightbox carousel, fix published menu page bug

Work Log:
- Analyzed 4 user-uploaded screenshots showing the editor UI + DevTools console errors
- Identified CRITICAL bug in menu-html-builder.ts: generated JS had `sans-serif` unquoted (became undefined variable), which broke the entire published menu page (`/r/[slug]`)
- Identified second part of same bug: `setProperty("--font-main", "Inter, "Inter", sans-serif")` had unescaped inner double-quotes that broke the JS parser, killing the entire script (so renderApp() was undefined)
- Installed `swiper` package (other libs - framer-motion, lucide-react, clsx, tailwind-merge - were already in deps)
- Created `supabase/add-social-and-gallery.sql` — idempotent SQL for user to run in Supabase SQL Editor:
  * Adds 7 social_* columns to menus table (facebook, instagram, whatsapp, tiktok, twitter, youtube, web)
  * Adds theme_dish_gallery BOOLEAN column (enable/disable lightbox)
  * Verifies existing theme_* columns exist
- Updated `src/lib/menu-utils.ts` types to include new social_* and theme_dish_gallery fields
- Completely rewrote `src/app/dashboard/[menuId]/menu-html-builder.ts`:
  * Fixed the sans-serif JS bug (used JSON.stringify for proper escaping)
  * Added cover image as HERO BACKGROUND behind profile header (with dark gradient overlay for legibility)
  * Added inline SVG icons for 7 social networks (Facebook, Instagram, WhatsApp, TikTok, Twitter/X, YouTube, Web) — premium ultra-pro style with hover effects
  * Added expandable dish LIGHTBOX: clicking a dish opens a modal with large image, name, description, price, and "Add to order" button
  * Backwards compatible — lightbox can be toggled off via theme_dish_gallery
- Updated `src/app/api/menus/[id]/route.ts` PUT endpoint to accept and persist all 7 social_* fields + theme_dish_gallery
- Updated `src/app/dashboard/[menuId]/editor-client.tsx`:
  * Added socials state (7 fields)
  * Added cover image uploader (wide 3:1 aspect ratio, click/drag-drop to upload)
  * Added 7 social media input fields with Lucide icons (Facebook, Instagram, Youtube, Globe + text icons for TikTok/WA/X)
  * Added "Lightbox de platos" toggle in appearance panel
  * Updated save() function to persist social_* + theme_dish_gallery fields
  * Updated handlePublish() to include all new fields when publishing
  * Updated real-time preview useEffect to include social_* + theme_dish_gallery (so preview reflects changes instantly)
  * Added SocialInput reusable component with icon + input
- Fixed pre-existing Next.js 16 route slug conflict: renamed `/api/menus/[menuId]/preset/` to `/api/menus/[id]/preset/` (Next.js 16 with Turbopack doesn't allow different slug names at same path depth)
- Verified with Agent Browser:
  * Generated sample menu HTML with all features
  * Confirmed no console errors
  * Confirmed restaurant name, hero cover, 5 social links, 5 dishes all render
  * Confirmed lightbox opens on dish click with name + price
  * Confirmed cart works (add to cart → count + total + visible cart bar)
- Took screenshots: /home/z/my-project/download/menu-fixed-preview.png and menu-lightbox.png

Stage Summary:
- ✅ CRITICAL: Fixed "sans is not defined" JS bug that broke ALL published menus at /r/[slug]
- ✅ CRITICAL: Fixed unescaped inner quotes in setProperty call (was killing entire script)
- ✅ Cover image now displays as wide hero background behind profile (ultra pro effect)
- ✅ 7 social media icons with premium SVG (Lucide not used in published HTML because it's React-only; inline SVG works in plain HTML)
- ✅ Click on dish opens lightbox modal with large image + details
- ✅ Real-time preview already existed (400ms debounce) — now reflects socials + cover + gallery
- ✅ Auto-save already existed (3s debounce) — now saves social_* + theme_dish_gallery
- ✅ Publish button creates real online page at /r/[slug] (was already working, just needed JS bug fix)
- ✅ Data persistence: all fields saved to Supabase via PUT /api/menus/[id]
- ⚠️ USER MUST RUN: `supabase/add-social-and-gallery.sql` in Supabase SQL Editor to add the new columns. Without this, auto-save will 500.
- Artifacts:
  * SQL: /home/z/my-project/supabase/add-social-and-gallery.sql
  * Code changes: menu-html-builder.ts, editor-client.tsx, route.ts, menu-utils.ts
  * Screenshots: download/menu-fixed-preview.png, download/menu-lightbox.png

---
Task ID: superadmin-detail-lightbox-consolidate-guide
Agent: main (Super Z)
Task: (1) Fix "ver detalles" error en super admin, (2) Reescribir lightbox de plato estilo PedidosYa/Rappi mobile-first, (3) Consolidar editores a 1 solo, (4) Crear subpágina /dashboard/guia con tutorial paso a paso, (5) Verificar autoguardado perfecto, (6) Entregar SQL de add-social-and-gallery.sql + nuevo fix-admin-user-detail.sql

Work Log:
- Diagnóstico del error "ver detalles" en super admin:
  * La función admin_get_user_detail() en schema-superadmin.sql usaba `SELECT is_super_admin FROM profiles WHERE id = auth.uid()` (posible recursión RLS)
  * NO incluía los campos calculados menus_count/views_total/published_menus/dishes_count que el frontend espera en userDetail.profile
  * NO retornaba las columnas nuevas theme_*/social_*
- Creado `supabase/fix-admin-user-detail.sql` (idempotente):
  * Reescrita admin_get_user_detail() con public.is_self_super_admin() (sin recursión)
  * Calcula menus_count/views_total/published_menus/dishes_count y los mezcla en profile_data via jsonb_set
  * Retorna TODAS las columnas theme_*/social_*/theme_dish_gallery de cada menú
  * SECURITY DEFINER + SET search_path=public
- Reescrito lightbox de plato en `src/app/dashboard/[menuId]/menu-html-builder.ts` (estilo PedidosYa/Rappi):
  * CSS: overlay full-screen en mobile (align-items:flex-end → bottom-sheet), card centrada en desktop
  * CSS: handle bar de 40x4px en mobile (estilo iOS/Android nativo bottom-sheet)
  * CSS: close button flotante sobre hero con backdrop-filter blur (estilo Rappi)
  * CSS: hero image aspect-ratio 1/1 mobile, 4/3 desktop, max-height 60vh/480px
  * CSS: gradient overlay ::after en hero para legibilidad del close
  * CSS: placeholder premium cuando no hay imagen (letra 120-140px + label uppercase)
  * CSS: content padding 20px mobile, 28-32px desktop
  * CSS: category badge pequeño (uppercase, accent color, pill)
  * CSS: title 24px mobile / 28px desktop (font-weight 800)
  * CSS: price-row destacado debajo del título (26px mobile / 30px desktop, accent color)
  * CSS: description con label "Descripción" arriba (uppercase, small, opacity 0.6)
  * CSS: CTA sticky en bottom con gradient fade para que siempre sea visible
  * CSS: botón "Agregar al pedido" full-width con shadow accent y animación hover
  * CSS: estado ".added" (verde) con checkmark SVG y "Agregado" por 900ms antes de cerrar
  * JS: openDishLightbox construye HTML con catName, hero, content, price-row, desc-label, CTA
  * JS: al hacer clic en agregar: addToCart + clase "added" + innerHTML con SVG check + setTimeout 900ms
  * Animaciones: dlbFadeIn (overlay), dlbSlideUp (mobile bottom-sheet), dlbZoomIn (desktop card)
- Consolidado editores a 1 solo:
  * Eliminado "Generador rápido" de NAV_ITEMS en dashboard-shell.tsx
  * Añadido nav item "Guía" → /dashboard/guia con icono HelpCircle
  * Reemplazado /dashboard/generador/page.tsx con redirect a /dashboard?from=generador
  * Reemplazado /dashboard/generador/generador-client.tsx con stub deprecado
  * Eliminado /dashboard/generador/loading.tsx
- Creada subpágina /dashboard/guia con tutorial paso a paso:
  * `src/app/dashboard/guia/page.tsx`: server component que valida auth y carga plan
  * `src/app/dashboard/guia/guia-client.tsx`: cliente con 15 secciones acordeón
  * Secciones: crear-menú, datos-restaurante, portada-redes, categorías-platos, lightbox-platos, apariencia-tema, publicar, qr-codigo, dominio-propio, analíticas, exportar-importar, planes-facturación, super-admin, tips-pro
  * Cada sección: emoji + número + título + descripción + 1-5 pasos numerados
  * Cada paso: título, detalle, tip Pro opcional (caja amarilla), link opcional
  * Hero gradient gold + stat cards (5 min, 100% mobile, autoguardado, +40% ventas)
  * CTA final "¿Listo para publicar?" con links a /dashboard y /dashboard/billing
- Fix autoguardado en editor-client.tsx:
  * El useEffect del save timer NO incluía `theme` en deps array → cambios de tema no se autoguardaban
  * Agregado `theme` a deps: `[menu, categories, theme, socials, save]`
  * Reducido debounce de 3000ms → 1500ms (más responsivo)
- Verificado con agent-browser (iPhone 14 emulation):
  * HTML generado (43KB) sin errores JS
  * 4 platos renderizados correctamente con clases .dish.revealed
  * Click en plato con imagen → lightbox abre con .dish-lightbox.visible
  * Estructura completa: hero, handle, close, cat ("Entradas"), name ("Ceviche Clásico"), price ("S/ 28.00"), desc, CTA ("Agregar al pedido")
  * Click en plato SIN imagen → placeholder premium renderiza con .ph-letter ("A") y .ph-label ("Entradas")
  * Screenshots: download/lightbox-pedidosya-style.png + download/lightbox-no-image.png
- Build OK: 25 rutas generadas (incluye nueva /dashboard/guia)
- TypeScript: 0 errores en src/ (solo warnings en skills/ y examples/ no relacionados)

Stage Summary:
- ✅ FIX admin_get_user_detail() → SQL entregado en `supabase/fix-admin-user-detail.sql` (user debe correr en Supabase SQL Editor)
- ✅ LIGHTBOX estilo PedidosYa/Rappi mobile-first ultra pro (hero grande, title+price debajo, desc profesional, CTA sticky)
- ✅ CONSOLIDACIÓN: 1 solo editor integrado (/dashboard/[menuId]), generador standalone deprecado y redirige
- ✅ GUÍA: /dashboard/guia con 15 secciones paso a paso, emojis, tips Pro, links contextuales
- ✅ AUTOGUARDADO: fix bug (theme no estaba en deps) + debounce 1.5s (más rápido)
- ✅ SQL add-social-and-gallery.sql entregado al user para copiar a Supabase SQL Editor
- ⚠️ USER MUST RUN: `supabase/fix-admin-user-detail.sql` en Supabase SQL Editor para fixear "ver detalles"
- Artifacts:
  * SQL: /home/z/my-project/supabase/fix-admin-user-detail.sql
  * Code: menu-html-builder.ts, editor-client.tsx, dashboard-shell.tsx, generador/page.tsx, generador/generador-client.tsx
  * New page: /home/z/my-project/src/app/dashboard/guia/page.tsx + guia-client.tsx
  * Screenshots: download/lightbox-pedidosya-style.png, download/lightbox-no-image.png
  * Test: download/menu-lightbox-test.html

---
Task ID: pedidosya-redesign-logo-fix-lightmode
Agent: main (Super Z)
Task: (1) Rediseñar cards de plato estilo PedidosYa/Rappi universal, (2) Fix bug foto de perfil (logo) no se actualizaba al guardar, (3) Light mode toggle con contraste automático del accent color, (4) Mejoras UX/IX en PC y mobile.

Work Log:
- Diagnóstico del bug "foto de perfil no se actualiza":
  * El state del editor usa `menu.logo` pero el API espera `logo_url`
  * Al hacer spread `{...menu}` en save(), el campo `logo_url` quedaba `undefined`
  * El API hacía `logo_url: undefined || null = null` → siempre sobreescribía a null
- Fix en editor-client.tsx save() y handlePublish():
  * Reemplazado `{...menu}` por campos explícitos con `logo_url: menu.logo`
  * Esto asegura que el logo_url se envíe correctamente al API
- Rediseño completo de cards de plato (menu-html-builder.ts):
  * Eliminado el sistema de variantes por imageSize (small/medium/large/hero)
  * NUEVO diseño universal PedidosYa/Rappi: imagen grande arriba SIEMPRE (aspect-ratio 16/10)
  * Placeholder gradient con inicial del plato cuando no hay imagen
  * Badge de categoría flotante (top-left, blur backdrop) sobre la imagen
  * Zoom on hover (scale 1.06) con transición 0.55s
  * Info area abajo: nombre (2-line clamp), descripción (2-line clamp), precio + botón Agregar
  * Botón "Agregar" con icono + texto (no solo "+")
  * Grid responsivo: 1 col mobile, 2 cols tablet+
  * Card style variants (compact/minimal) solo afectan padding, mantienen layout
- Light mode con contraste automático:
  * Light bg cambiado de #fafafa → #fefcf7 (beige/cream cálido tipo PedidosYa)
  * Nueva CSS variable `--accent-text`: en light mode = `color-mix(in srgb, var(--accent) 78%, #000)` (accent oscurecido 22% para legibilidad)
  * En dark mode: `--accent-text = var(--accent)` (suficiente contraste)
  * dish-price usa `--accent-text` para garantizar legibilidad en ambos modos
- Toggle "Modo claro" ya existía en el editor (Pro feature)
- TypeScript: 0 errores en src/ (solo pre-existing errors en examples/skills)
- Build: 24/24 páginas generadas exitosamente
- Test script: scripts/test-pedidosya-style.ts genera HTML de prueba con 4 platos (2 con imagen, 2 sin imagen) en dark y light mode
- HTML verificado: contiene dish-img-wrap, dish-img-placeholder, dish-cat-badge, dish-info, dish-lightbox, logo-placeholder, socials, --accent-text, color-mix, #fefcf7

Stage Summary:
- ✅ FIX: Profile photo (logo) ahora se guarda correctamente (bug era field name mismatch `logo` vs `logo_url`)
- ✅ REDESIGN: Cards de plato estilo PedidosYa/Rappi universal (imagen grande arriba siempre, info abajo, badge categoría)
- ✅ LIGHT MODE: Beige/cream bg (#fefcf7) + accent-text con color-mix para contraste automático
- ✅ BUILD OK: 24 páginas, TypeScript limpio en src/
- ✅ TEST: HTML generado verificado con todos los elementos esperados
- ⚠️ No se necesita SQL nuevo (logo_url ya existe en schema.sql línea 121)
- Artifacts:
  * Code: editor-client.tsx (logo fix), menu-html-builder.ts (PedidosYa redesign + light mode)
  * Test: scripts/test-pedidosya-style.ts
  * Sample HTML: download/test-pedidosya-dark.html, download/test-pedidosya-light.html
