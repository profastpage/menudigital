// Test mobile-first del home con carrusel demo + WhatsApp button position
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`PAGEERROR: ${err.message}`));
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (!url.includes('sentry') && !url.includes('posthog')) {
      consoleErrors.push(`REQFAIL: ${url} - ${req.failure()?.errorText}`);
    }
  });

  console.log('📱 Navegando a / (mobile)...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Screenshot 1: Hero completo con carrusel
  await page.screenshot({ path: '/home/z/my-project/download/test-hero-carousel-mobile.png', fullPage: false });
  console.log('  ✓ Screenshot: test-hero-carousel-mobile.png');

  // Verificar que el iframe del primer demo cargó
  const iframeCount = await page.locator('iframe[title^="Demo"]').count();
  console.log(`  ✓ Iframes demo encontrados: ${iframeCount}`);

  // Verificar botón WhatsApp flotante: posición y visibilidad
  const whatsappBtn = page.locator('button[aria-label="Contactar soporte por WhatsApp"]');
  if (await whatsappBtn.count() > 0) {
    const box = await whatsappBtn.boundingBox();
    const viewport = page.viewportSize();
    console.log(`  ✓ Botón WhatsApp visible: x=${Math.round(box.x)}, y=${Math.round(box.y)}, w=${box.width}, h=${box.height}`);
    console.log(`  ✓ Viewport: ${viewport.width}x${viewport.height}`);
    console.log(`  ✓ Distancia desde abajo: ${viewport.height - (box.y + box.height)}px`);
    if (box.y + box.height > viewport.height - 100) {
      console.log('  ✓ WhatsApp está en la esquina inferior real');
    } else {
      console.log('  ⚠️ WhatsApp NO está pegado al borde inferior');
    }
  } else {
    console.log('  ⚠️ Botón WhatsApp NO encontrado');
  }

  // Scroll y esperar auto-rotación
  console.log('🔄 Esperando auto-rotación del carrusel (8s)...');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: '/home/z/my-project/download/test-hero-carousel-rotated.png', fullPage: false });
  console.log('  ✓ Screenshot: test-hero-carousel-rotated.png');

  // Click en el segundo dot (force: true porque la animacion flotante del phone hace el elemento "inestable")
  const dots = page.locator('button[aria-label^="Ver demo de"]');
  if (await dots.count() >= 2) {
    await dots.nth(1).click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/z/my-project/download/test-hero-carousel-pizzeria.png', fullPage: false });
    console.log('  ✓ Screenshot tras click en 2do demo (pizzería)');
  }

  // Scroll a features para ver resto del home
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/z/my-project/download/test-hero-features.png', fullPage: false });

  // Volver arriba y tomar full page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/z/my-project/download/test-home-full-mobile.png', fullPage: true });
  console.log('  ✓ Screenshot full page mobile');

  // Desktop view también
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopCtx.newPage();
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await desktopPage.waitForTimeout(3000);
  await desktopPage.screenshot({ path: '/home/z/my-project/download/test-home-desktop.png', fullPage: false });
  console.log('  ✓ Screenshot desktop');

  await desktopPage.screenshot({ path: '/home/z/my-project/download/test-home-full-desktop.png', fullPage: true });
  console.log('  ✓ Screenshot full page desktop');

  // Reportar errores de consola
  console.log('\n📋 ERRORES DE CONSOLA:');
  if (consoleErrors.length === 0) {
    console.log('  ✅ Sin errores');
  } else {
    consoleErrors.slice(0, 15).forEach((e) => console.log(`  ❌ ${e}`));
  }

  console.log('\n⚠️ WARNINGS:');
  if (consoleWarnings.length === 0) console.log('  ✅ Sin warnings');
  else consoleWarnings.slice(0, 5).forEach((w) => console.log(`  ⚠️ ${w}`));

  await browser.close();
  console.log('\n✅ Test completo');
})().catch((e) => { console.error('TEST FAIL:', e); process.exit(1); });
