/**
 * Measure actual rendered image dimensions to verify aspect ratios.
 */
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  const variants = ['v3-hero-size', 'v4-small-size'];
  for (const v of variants) {
    await page.goto(`file:///home/z/my-project/upload/test-theme-${v}.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    // Scroll to trigger reveal
    await page.evaluate(async () => {
      const step = 400;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 50));
      }
      window.scrollTo({ top: 250, behavior: 'instant' });
    });
    await page.waitForTimeout(1000);
    
    const dims = await page.evaluate(`(function() {
      var carta = document.querySelector('.carta-card-img-wrap');
      var dish = document.querySelector('.dish-img-wrap');
      var rappi = document.querySelector('.rappi-item-img-wrap');
      function measure(el) {
        if (!el) return null;
        var r = el.getBoundingClientRect();
        return { width: Math.round(r.width), height: Math.round(r.height), ratio: (r.width/r.height).toFixed(2) };
      }
      return {
        cartaCard: measure(carta),
        dishWrap: measure(dish),
        rappiItem: measure(rappi),
      };
    })()`);
    
    console.log(`=== ${v} ===`);
    console.log(JSON.stringify(dims, null, 2));
  }
  await browser.close();
})();
