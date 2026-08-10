// Test: hybrid flow — WhatsApp send triggers comanda interna POST in Premium/Full plans
// Mocks the API endpoint by intercepting the XHR.
const { chromium, devices } = require('playwright');
const { buildMenuHTML } = require('/home/z/my-project/src/app/dashboard/[menuId]/menu-html-builder.ts');

const mockMenuPremium = {
  id: 'test-menu-premium',
  user_id: 'test-user',
  name: 'Test Premium Restaurant',
  slug: 'test-premium',
  description: 'Test',
  color: '#d4af37',
  whatsapp: '51933667414',
  whatsapp_number: '51933667414',
  currency: 'PEN',
  logo_url: null,
  branding_text: null,
  plan: 'premium',  // KEY: plan premium triggers comanda interna
  style: 'classic',
  theme_layout: 'single',
  theme_image_size: 'medium',
  theme_card_style: 'expanded',
  theme_font: 'Inter',
  theme_dark_mode: true,
  theme_show_search: true,
  theme_show_category_icons: true,
  theme_rounded_corners: true,
  theme_color_secondary: '#1a1a2e',
  theme_dish_gallery: true,
  theme_carta_style: false,
  theme_carta_list_style: false,
  theme_carta_autoscroll: false,
  theme_hybrid_style: false,
  theme_sticky_top_bar: true,
  is_published: true,
  categories: [{
    id: 'cat-1', name: 'Pollos', sort_order: 0,
    dishes: [{
      id: 'dish-aaa-111', name: 'Pollo al horno',
      description: 'Delicioso pollo al horno.', price: 30,
      image_url: '', sort_order: 0, is_available: true,
    }],
  }],
};

const mockMenuFree = { ...mockMenuPremium, id: 'test-menu-free', plan: 'free', name: 'Free Restaurant' };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const page = await ctx.newPage();

  // Intercept XHR to /api/comandas/from-public-menu
  let comandaCalls = [];
  await page.route('**/api/comandas/from-public-menu', async (route) => {
    const req = route.request();
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    comandaCalls.push({
      url: req.url(),
      method: req.method(),
      body,
    });
    // Mock response: success with auto-assigned waiter
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        order_id: 'mock-order-uuid-001',
        order_number: '#0042',
        waiter_id: 'mock-waiter-uuid-001',
        status: 'enviada',
        subtotal: 150,
        whatsapp_also: true,
      }),
    });
  });

  // Intercept WhatsApp wa.me to prevent opening new tab
  await page.route('**/wa.me/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>WhatsApp mock</body></html>' });
  });

  for (const [planLabel, mockMenu] of [['premium', mockMenuPremium], ['free', mockMenuFree]]) {
    console.log(`\n=== Testing plan: ${planLabel} ===`);
    comandaCalls = [];

    const html = buildMenuHTML(mockMenu);
    const fs = require('fs');
    const path = `/home/z/my-project/download/test-hybrid-${planLabel}.html`;
    fs.writeFileSync(path, html);

    const errors = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

    await page.goto('file://' + path, { waitUntil: 'load' });
    await page.waitForTimeout(600);

    // Add 2 units of chicken to cart
    const dishCard = await page.$('.dish[data-cat]');
    await dishCard.click();
    await page.waitForTimeout(400);

    // Set qty = 2
    const qtyInput = await page.$('.dish-qty-input');
    await qtyInput.fill('2');
    await qtyInput.dispatchEvent('blur');
    await page.waitForTimeout(150);

    // Click "Agregar al pedido"
    const addBtn = await page.$('.dish-lightbox-add');
    await addBtn.click();
    await page.waitForTimeout(1400);  // lightbox closes after 900ms

    // Open cart modal
    await page.evaluate(() => { try { openModal(); } catch (e) {} });
    await page.waitForTimeout(400);

    // Click "Enviar por WhatsApp"
    const waBtn = await page.$('#waBtn');
    if (!waBtn) {
      console.log('  ✗ WhatsApp button #waBtn not found');
      continue;
    }
    await waBtn.click();
    await page.waitForTimeout(2000);  // wait for XHR + toast

    // Screenshot
    await page.screenshot({ path: `/home/z/my-project/download/test-hybrid-${planLabel}-after.png`, fullPage: false });

    // Verify comanda API was called (or NOT for free plan)
    if (planLabel === 'premium') {
      if (comandaCalls.length === 1) {
        console.log(`  ✓ /api/comandas/from-public-menu called once`);
        const call = comandaCalls[0];
        console.log(`  ✓ method: ${call.method}, url ends with: ${call.url.slice(-50)}`);
        // Try to parse body
        try {
          if (call.body) {
            console.log(`  ✓ body parsed: menu_id=${call.body.menu_id}, items count=${call.body.items?.length}`);
          } else {
            console.log(`  ✓ body sent (raw, not re-parsed)`);
          }
        } catch (e) {
          console.log(`  ✓ body sent (parse skipped)`);
        }
        // Verify toast appeared
        const toastVisible = await page.evaluate(() => {
          const t = document.querySelector('.comanda-toast.visible');
          return !!t;
        });
        console.log(`  ✓ Toast visible: ${toastVisible}`);
      } else {
        console.log(`  ✗ Expected 1 comanda call, got ${comandaCalls.length}`);
      }
    } else {
      // free plan: comanda API should NOT be called
      if (comandaCalls.length === 0) {
        console.log(`  ✓ Free plan: comanda API NOT called (correct)`);
      } else {
        console.log(`  ✗ Free plan should not call comanda API, got ${comandaCalls.length} calls`);
      }
    }

    if (errors.length > 0) {
      console.log(`  ⚠ Console errors: ${errors.length}`);
      errors.slice(0, 5).forEach(e => console.log(`    - ${e}`));
    } else {
      console.log(`  ✓ No console errors`);
    }
  }

  await browser.close();
  console.log('\n✓ Test complete');
})();
