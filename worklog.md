---
Task ID: theme-fix-batch
Agent: main (Super Z)
Task: Fix 3 theme customization bugs (layout 1col/2col, image size, secondary color) + heart/price collision. Research Cloudinary vs ImageKit vs Cloudflare Images.

Work Log:
- Analyzed 2 user screenshots via VLM (z-ai vision)
- Inspected menu-html-builder.ts (2145 lines), editor-client.tsx (2213 lines), supabase/schema-idempotent.sql
- Found 4 confirmed bugs:
  1. `theme_color_secondary` CSS var `--secondary` defined but NEVER used in any CSS rule (no `background: var(--secondary)` anywhere) — picking a color had zero effect
  2. `theme_image_size` only checked `!== 'none'` — small/medium/large/hero all rendered identically (same 16:10 aspect ratio)
  3. `theme_layout === 'single'` was FORCED to 2 columns on desktop via `@media(min-width:880px){.section.single-layout .dish-grid{grid-template-columns:repeat(2,1fr)}}` — contradicted user choice
  4. `.dish-fav-btn` (heart) at `top:8px;right:8px` collided with `.carta-card-price-overlay` at `top:8px;right:8px` (same exact position!) in carousel layout
- Confirmed Supabase schema is fine: columns `theme_color_secondary`, `theme_image_size`, `theme_layout` all exist with proper CHECK constraints — bug was 100% in CSS generation, not DB
- Applied 4 fixes to `src/app/dashboard/[menuId]/menu-html-builder.ts`:
  • Layout: removed `@media(min-width:880px){.section.single-layout ...grid-template-columns:repeat(2,1fr)}` rule. `single` now stays 1 col on all viewports. `double` stays 2 col tablet+. `grid` stays 1/2/3 responsive.
  • Image size: added `aspectRatio` variable computed from `imageSize` (small=16/9, medium=16/10, large=4/3, hero=1/1). Applied to BOTH `.dish-img-wrap` AND `.carta-card-img-wrap` so size affects carousel too.
  • Secondary color: applied `var(--secondary)` to (a) `body::after` decorative orb (was hardcoded to `var(--gold)`) and (b) `.section-title::before` accent bar gradient (was `linear-gradient(180deg,var(--accent),var(--gold))`, now `linear-gradient(180deg,var(--accent),var(--secondary))`)
  • Heart button: moved from `top:8px;right:8px` → `top:8px;left:8px`. Added rule to hide `.carta-card-featured` badge when `.dish-fav-btn` is present (since they both want top-left).
- Also hardened `hexToRgbStr()` in `src/lib/menu-utils.ts` to handle undefined/null/invalid hex inputs (was crashing on missing secondary color)
- Generated 6 test HTML variants via scripts/test-theme-fixes.ts and screenshotted them with Playwright (1280x900 desktop viewport)
- Verified all 4 fixes via direct DOM measurement (scripts/measure-aspects.ts + scripts/measure-layout.ts):
  • v1 single: gridTemplateColumns="600px" → 1 col ✓
  • v2 double: gridTemplateColumns="523px 523px" → 2 cols ✓
  • v3 hero: carta-card-img-wrap 198x198, ratio 1.00 → square ✓
  • v4 small: carta-card-img-wrap 198x111, ratio 1.78 → 16:9 wide ✓
- Cross-verified with VLM (z-ai vision):
  • v5 carta carousel: heart TOP-LEFT, price TOP-RIGHT → NO COLLISION ✓
  • v6 rappi list: heart TOP-LEFT of small image, + btn BOTTOM-RIGHT → NO COLLISION ✓
  • Red secondary color visible in bottom-left orb ✓
- Researched Cloudinary vs ImageKit vs Cloudflare Images via web-search subagent (11 parallel queries, current 2025/2026 pricing)

Stage Summary:
- 4 theme customization bugs FIXED and VLM-verified in `src/app/dashboard/[menuId]/menu-html-builder.ts`
- 1 hardening fix in `src/lib/menu-utils.ts` (hexToRgbStr null-safety)
- No database changes needed (Supabase schema was already correct)
- CDN recommendation: ImageKit.io Pro ($89/mo) — 6-12× cheaper than Cloudinary for the same output, ~3× cheaper than Cloudflare for variant-heavy workloads, free unlimited transformations, AWS CloudFront-based, drop-in Next.js loader, can use existing Supabase Storage bucket as origin (zero migration friction). Full report at /home/z/research/image-cdn-comparison.md
- Test scripts persisted at /home/z/my-project/scripts/test-theme-fixes.ts, screenshot-themes.ts, measure-aspects.ts, measure-layout.ts, debug-render.ts
- 6 test HTML files + screenshots saved at /home/z/my-project/upload/test-theme-v{1..6}-*.html/.png
