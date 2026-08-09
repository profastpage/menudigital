// Standalone test: render buildMenuHTML() with a mock menu and test the qty selector with Playwright.
// Run: node /home/z/my-project/scripts/test-qty-standalone.js
const { chromium, devices } = require('playwright');
const { buildMenuHTML } = require('/home/z/my-project/src/app/dashboard/[menuId]/menu-html-builder.ts');

const mockMenu = {
  id: 'test-menu',
  name: 'Test Restaurant',
  slug: 'test',
  description: 'Test menu for qty selector',
  color: '#d4af37',
  whatsapp_number: '51933667414',
  currency: 'PEN',
  logo_url: null,
  hero_url: null,
  branding_text: 'Creado con MenuPro',
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
  categories: [
    {
      id: 'cat-1',
      name: 'Pollos',
      sort_order: 0,
      dishes: [
        {
          id: 'dish-1',
          name: 'Pollo al horno',
          description: 'Delicioso pollo al horno con hierbas frescas.',
          price: 30,
          image_url: '',
          sort_order: 0,
          is_available: true,
        },
        {
          id: 'dish-2',
          name: 'Pollo a la brasa',
          description: 'Clásico pollo a la brasa con papas.',
          price: 35,
          image_url: '',
          sort_order: 1,
          is_available: true,
        },
      ],
    },
    {
      id: 'cat-2',
      name: 'Bebidas',
      sort_order: 1,
      dishes: [
        {
          id: 'dish-3',
          name: 'Inca Kola 1.5L',
          description: 'Bebida gaseosa 1.5 litros.',
          price: 8,
          image_url: '',
          sort_order: 0,
          is_available: true,
        },
      ],
    },
  ],
};

const html = buildMenuHTML(mockMenu);
console.log('→ Generated HTML length:', html.length);
console.log('→ Has .dish-qty-wrap:', html.includes('dish-qty-wrap'));
console.log('→ Has __getDishQty:', html.includes('__getDishQty'));
console.log('→ Has clampQty:', html.includes('clampQty'));

// Save HTML to a file
const fs = require('fs');
const path = '/home/z/my-project/download/test-menu-qty.html';
fs.writeFileSync(path, html);
console.log('→ Saved HTML to', path);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  const url = 'file://' + path;
  console.log('→ Opening', url);
  await page.goto(url, { waitUntil: 'load', timeout: 15000 });
  await page.waitForTimeout(800);

  await page.screenshot({ path: '/home/z/my-project/download/test-qty-01-menu.png', fullPage: false });
  console.log('  Saved menu screenshot');

  // Click first dish card
  const dishCard = await page.$('.dish[data-cat], .carta-card[data-cat], .rappi-item[data-cat]');
  if (!dishCard) {
    console.error('✗ No dish card found');
    await browser.close();
    process.exit(1);
  }
  await dishCard.click();
  await page.waitForTimeout(800);

  await page.screenshot({ path: '/home/z/my-project/download/test-qty-02-lightbox.png', fullPage: false });
  console.log('  Saved lightbox screenshot');

  // Verify qty selector exists
  const qtyWrap = await page.$('.dish-qty-wrap');
  console.log(`  ${qtyWrap ? '✓' : '✗'} .dish-qty-wrap ${qtyWrap ? 'found' : 'NOT found'}`);
  const qtyInput = await page.$('.dish-qty-input');
  if (qtyInput) {
    const val = await qtyInput.inputValue();
    console.log(`  ✓ .dish-qty-input value = ${val}`);
  } else {
    console.log('  ✗ .dish-qty-input NOT found');
  }
  const qtyBtns = await page.$$('.dish-qty-btn');
  console.log(`  ${qtyBtns.length === 2 ? '✓' : '✗'} .dish-qty-btn count = ${qtyBtns.length} (expect 2)`);

  // Check decBtn is disabled at qty=1
  const decDisabled = await qtyBtns[0].isDisabled();
  console.log(`  ${decDisabled ? '✓' : '✗'} dec button disabled at qty=1: ${decDisabled}`);

  // Click + three times → expect qty=4
  await qtyBtns[1].click(); await page.waitForTimeout(120);
  await qtyBtns[1].click(); await page.waitForTimeout(120);
  await qtyBtns[1].click(); await page.waitForTimeout(120);
  let val = await qtyInput.inputValue();
  console.log(`  After 3x + → ${val} (expect 4)`);
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-03-qty4.png', fullPage: false });

  // Click - once → expect qty=3
  await qtyBtns[0].click(); await page.waitForTimeout(120);
  val = await qtyInput.inputValue();
  console.log(`  After 1x - → ${val} (expect 3)`);

  // Manual input 15
  await qtyInput.fill('');
  await qtyInput.type('15');
  await qtyInput.dispatchEvent('blur');
  await page.waitForTimeout(150);
  val = await qtyInput.inputValue();
  console.log(`  After manual input 15 → ${val} (expect 15)`);
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-04-qty15.png', fullPage: false });

  // Verify price displays "S/ 450.00 (15 × S/ 30.00)"
  const priceText = await page.$eval('#dishLightboxPrice', el => el.textContent);
  console.log(`  Price display: "${priceText}"`);

  // Invalid input 0 → clamp to 1
  await qtyInput.fill('0');
  await qtyInput.dispatchEvent('blur');
  await page.waitForTimeout(150);
  val = await qtyInput.inputValue();
  console.log(`  After input 0 (invalid) → ${val} (expect 1)`);

  // Input 150 → clamp to 99
  await qtyInput.fill('150');
  await qtyInput.dispatchEvent('blur');
  await page.waitForTimeout(150);
  val = await qtyInput.inputValue();
  console.log(`  After input 150 (over max) → ${val} (expect 99)`);

  // Set qty = 5, click "Agregar al pedido"
  await qtyInput.fill('5');
  await qtyInput.dispatchEvent('blur');
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-05-qty5.png', fullPage: false });

  const addBtn = await page.$('.dish-lightbox-add');
  await addBtn.click();
  await page.waitForTimeout(1300);
  console.log('  Clicked "Agregar al pedido" with qty=5');

  await page.screenshot({ path: '/home/z/my-project/download/test-qty-06-after-add.png', fullPage: false });

  // Check cart count badge
  const cartCount = await page.evaluate(() => {
    const el = document.getElementById('cartCount') || document.getElementById('mbnCartCount');
    return el ? el.textContent : null;
  });
  console.log(`  Cart count badge = ${cartCount} (expect 5)`);

  // Open cart modal
  await page.evaluate(() => { try { openModal(); } catch (e) {} });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-07-cart-modal.png', fullPage: false });

  const cartItemQty = await page.evaluate(() => {
    const items = document.querySelectorAll('#cartItems .cart-item');
    if (items.length === 0) return null;
    const last = items[items.length - 1];
    const qtyEl = last.querySelector('.qty');
    return qtyEl ? qtyEl.textContent : null;
  });
  console.log(`  Last cart item qty displayed = ${cartItemQty} (expect 5)`);

  if (errors.length > 0) {
    console.log('\n⚠ Console errors:');
    errors.slice(0, 10).forEach(e => console.log('  -', e));
  } else {
    console.log('\n✓ No console errors');
  }

  await browser.close();
  console.log('\n✓ Test complete');
})();
