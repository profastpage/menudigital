/**
 * Measure layout: count columns of .dish in .dishes-grid for v1 (single) and v2 (double).
 */
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  
  for (const v of ['v1-single-1col', 'v2-double-2col']) {
    await page.goto(`file:///home/z/my-project/upload/test-theme-${v}.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.evaluate(`(async function() {
      var step = 400;
      for (var y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(function(r){setTimeout(r, 80);});
      }
      window.scrollTo({ top: 250, behavior: 'instant' });
    })()`);
    await page.waitForTimeout(1500);
    
    const result = await page.evaluate(`(function() {
      var grid = document.querySelector('.dishes-grid');
      if (!grid) return { found: false };
      var cs = window.getComputedStyle(grid);
      var cols = cs.gridTemplateColumns.split(' ').length;
      var dishes = grid.querySelectorAll('.dish').length;
      var firstDish = grid.querySelector('.dish');
      var r = firstDish ? firstDish.getBoundingClientRect() : null;
      var gridRect = grid.getBoundingClientRect();
      return {
        found: true,
        gridTemplateColumns: cs.gridTemplateColumns,
        colCount: cols,
        dishCount: dishes,
        gridWidth: Math.round(gridRect.width),
        firstDishWidth: r ? Math.round(r.width) : null,
        firstDishHeight: r ? Math.round(r.height) : null,
      };
    })()`);
    
    console.log(`=== ${v} ===`);
    console.log(JSON.stringify(result, null, 2));
  }
  await browser.close();
})();
