// Test visual: barra superior oscura + barra de progreso
// Renderiza buildMenuHTML con un menú mock y toma screenshots en 3 estados de scroll:
//   1. Top (0%) — barra de progreso vacía
//   2. Middle (~50%) — barra de progreso a la mitad
//   3. Bottom (100%) — barra de progreso llena

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Import buildMenuHTML
const { buildMenuHTML } = require('../src/app/dashboard/[menuId]/menu-html-builder.ts');

const mockMenu = {
  id: 'test-menu',
  name: 'Free Restaurant',
  user_id: 'test-user',
  currency: 'PEN',
  is_published: true,
  color: '#F4C430',  // dorado de la marca (lo que NO debe estar en el fondo)
  theme_dark_mode: true,
  theme_layout: 'grid',
  theme_image_size: 'medium',
  theme_card_style: 'standard',
  theme_show_search: true,
  theme_show_cat_icons: true,
  theme_rounded: true,
  theme_show_gallery: false,
  theme_carta_style: false,
  theme_carta_list_style: false,
  theme_hybrid_style: false,
  theme_sticky_top_bar: true,
  categories: [
    { id: 'c1', name: 'Entradas', icon: '🥗', dishes: [
      { id: 'd1', name: 'Ceviche Clásico', description: 'Pescado fresco, limón, cebolla, cilantro', price: 28, image_url: '' },
      { id: 'd2', name: 'Anticuchos', description: 'Brochetas de corazón a la parrilla', price: 25, image_url: '' },
      { id: 'd3', name: 'Papa a la Huancaína', description: 'Papas cremosas con salsa picante', price: 18, image_url: '' },
    ]},
    { id: 'c2', name: 'Platos de Fondo', icon: '🍽️', dishes: [
      { id: 'd4', name: 'Pollo al horno', description: 'Pollo marinado con hierbas', price: 30, image_url: '' },
      { id: 'd5', name: 'Lomo Saltado', description: 'Tiras de res salteadas con cebolla y tomate', price: 32, image_url: '' },
      { id: 'd6', name: 'Ají de Gallina', description: 'Crema de pollo con ají amarillo', price: 26, image_url: '' },
      { id: 'd7', name: 'Seco de Cordero', description: 'Cordero braseado en cilantro', price: 35, image_url: '' },
    ]},
    { id: 'c3', name: 'Postres', icon: '🍰', dishes: [
      { id: 'd8', name: 'Suspiro Limeño', description: 'Manjar blanco con merengue', price: 15, image_url: '' },
      { id: 'd9', name: 'Arroz con Leche', description: 'Arroz cremoso con canela', price: 12, image_url: '' },
      { id: 'd10', name: 'Tres Leches', description: 'Bizcocho empapado en tres leches', price: 14, image_url: '' },
    ]},
    { id: 'c4', name: 'Bebidas', icon: '🥤', dishes: [
      { id: 'd11', name: 'Chicha Morada', description: 'Bebida tradicional de maíz morado', price: 8, image_url: '' },
      { id: 'd12', name: 'Limonada Frozen', description: 'Limón batido con hielo', price: 10, image_url: '' },
      { id: 'd13', name: 'Maracuyá Sour', description: 'Cóctel sin alcohol de maracuyá', price: 18, image_url: '' },
    ]},
  ],
};

const html = buildMenuHTML({
  ...mockMenu,
  isPreview: false,
  logoUrl: '',
  coverUrl: '',
});

// Crear HTML completo envuelto
const fullHtml = `<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Test Dark Topbar + Progress</title>
<style>html,body{margin:0;padding:0;}</style>
</head>
<body>
${html}
</body>
</html>`;

const outDir = path.join(__dirname, '..', 'download');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'test-dark-topbar.html'), fullHtml);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  await page.goto('file://' + path.join(outDir, 'test-dark-topbar.html'));
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Screenshot 1: top (0% scroll)
  await page.screenshot({ path: path.join(outDir, 'test-dark-topbar-01-top.png'), fullPage: false });
  console.log('✓ Screenshot 1: top (0% scroll)');

  // Screenshot 2: ~50% scroll
  const halfScroll = await page.evaluate(() => {
    const sh = document.documentElement.scrollHeight;
    const ch = window.innerHeight;
    return Math.floor((sh - ch) * 0.5);
  });
  await page.evaluate((y) => window.scrollTo(0, y), halfScroll);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'test-dark-topbar-02-mid.png'), fullPage: false });
  console.log('✓ Screenshot 2: middle (~50% scroll)');

  // Screenshot 3: bottom (100% scroll)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, 'test-dark-topbar-03-bottom.png'), fullPage: false });
  console.log('✓ Screenshot 3: bottom (100% scroll)');

  // Verificar colores: el fondo de la barra superior NO debe ser dorado (#F4C430)
  const topBarBg = await page.evaluate(() => {
    const el = document.getElementById('miniHeader');
    if (!el) return null;
    const bg = window.getComputedStyle(el).backgroundColor;
    const bgImage = window.getComputedStyle(el).backgroundImage;
    return { bg, bgImage };
  });
  console.log('Top bar background:', topBarBg);

  // Verificar barra de progreso: en bottom, width debe ser ~100%
  const progressWidth = await page.evaluate(() => {
    const fill = document.getElementById('miniHeaderProgressFill');
    if (!fill) return null;
    return fill.style.width;
  });
  console.log('Progress fill width at bottom:', progressWidth);

  // Capturar errores de consola
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));

  await browser.close();
  console.log('\nConsole errors:', errors.length === 0 ? 'NONE ✓' : errors.join('\n'));
})();
