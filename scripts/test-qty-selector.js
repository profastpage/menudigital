// Test: Quantity selector (1-99) in dish lightbox
// Run: node /home/z/my-project/scripts/test-qty-selector.js
const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ...devices['iPhone 14 Pro'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  const slug = process.env.SLUG || 'cafe-aurora';
  const url = `http://localhost:3000/r/${slug}`;
  console.log('→ Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Take a screenshot of the menu
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-01-menu.png', fullPage: false });
  console.log('  Saved menu screenshot');

  // Find a dish card with data-cat/data-dish and click it
  const dishCard = await page.$('.dish[data-cat], .carta-card[data-cat], .rappi-item[data-cat]');
  if (!dishCard) {
    console.error('✗ No dish card found on page');
    await browser.close();
    process.exit(1);
  }
  await dishCard.click();
  await page.waitForTimeout(800);

  // Screenshot of lightbox
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-02-lightbox.png', fullPage: false });
  console.log('  Saved lightbox screenshot');

  // Verify qty selector exists
  const qtyWrap = await page.$('.dish-qty-wrap');
  if (!qtyWrap) {
    console.error('✗ .dish-qty-wrap NOT found in lightbox');
  } else {
    console.log('✓ .dish-qty-wrap found');
  }
  const qtyInput = await page.$('.dish-qty-input');
  if (!qtyInput) {
    console.error('✗ .dish-qty-input NOT found');
  } else {
    const val = await qtyInput.inputValue();
    console.log('✓ .dish-qty-input found, value =', val);
  }
  const qtyBtns = await page.$$('.dish-qty-btn');
  console.log(`✓ .dish-qty-btn count = ${qtyBtns.length} (expect 2: - and +)`);

  // Test: click + three times → value should be 4
  await qtyBtns[1].click(); // +
  await page.waitForTimeout(150);
  await qtyBtns[1].click(); // +
  await page.waitForTimeout(150);
  await qtyBtns[1].click(); // +
  await page.waitForTimeout(150);
  let val = await qtyInput.inputValue();
  console.log(`  After 3x + → value = ${val} (expect 4)`);

  // Screenshot with qty=4
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-03-qty4.png', fullPage: false });

  // Test: click - once → value should be 3
  await qtyBtns[0].click(); // -
  await page.waitForTimeout(150);
  val = await qtyInput.inputValue();
  console.log(`  After 1x - → value = ${val} (expect 3)`);

  // Test: manual input → 15
  await qtyInput.fill('');
  await qtyInput.type('15');
  await page.waitForTimeout(200);
  await qtyInput.blur();
  await page.waitForTimeout(150);
  val = await qtyInput.inputValue();
  console.log(`  After manual input 15 → value = ${val} (expect 15)`);

  // Screenshot with qty=15
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-04-qty15.png', fullPage: false });

  // Test: try invalid input 0 → should clamp to 1
  await qtyInput.fill('0');
  await qtyInput.blur();
  await page.waitForTimeout(150);
  val = await qtyInput.inputValue();
  console.log(`  After input 0 (invalid) → value = ${val} (expect 1)`);

  // Test: try 150 → should clamp to 99
  await qtyInput.fill('150');
  await qtyInput.blur();
  await page.waitForTimeout(150);
  val = await qtyInput.inputValue();
  console.log(`  After input 150 (over max) → value = ${val} (expect 99)`);

  // Set qty = 5 then click "Agregar al pedido"
  await qtyInput.fill('5');
  await qtyInput.blur();
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-05-qty5.png', fullPage: false });

  const addBtn = await page.$('.dish-lightbox-add');
  if (!addBtn) {
    console.error('✗ .dish-lightbox-add NOT found');
  } else {
    await addBtn.click();
    await page.waitForTimeout(1200);
    console.log('  Clicked "Agregar al pedido" with qty=5');
  }

  // Screenshot after add (lightbox should auto-close after 900ms)
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-06-after-add.png', fullPage: false });

  // Open cart and verify the item qty is 5
  const cartBtn = await page.$('[data-action="cart"], #mbnCart, .cart-bar');
  // Try clicking the cart button via JS
  const cartCount = await page.evaluate(() => {
    const el = document.getElementById('cartCount') || document.getElementById('mbnCartCount');
    return el ? el.textContent : null;
  });
  console.log(`  Cart count badge = ${cartCount} (expect 5)`);

  // Open cart modal to inspect items
  await page.evaluate(() => { try { openModal(); } catch (e) {} });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/home/z/my-project/download/test-qty-07-cart-modal.png', fullPage: false });

  const cartItemQty = await page.evaluate(() => {
    const items = document.querySelectorAll('#cartItems .cart-item');
    if (items.length === 0) return null;
    const last = items[items.length - 1];
    const qtyEl = last.querySelector('.qty');
    return qtyEl ? qtyEl.textContent : null;
  });
  console.log(`  Last cart item qty displayed = ${cartItemQty} (expect 5)`);

  // Report console errors
  if (errors.length > 0) {
    console.log('\n⚠ Console errors detected:');
    errors.slice(0, 10).forEach(e => console.log('  -', e));
  } else {
    console.log('\n✓ No console errors');
  }

  await browser.close();
  console.log('\n✓ Test complete. Screenshots saved to /home/z/my-project/download/test-qty-*.png');
})();
