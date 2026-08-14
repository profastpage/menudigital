/**
 * Screenshot test for theme variants — captures 4 HTML files at desktop viewport.
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const variants = [
  { name: 'v5-carta-heart-price', desc: 'Carta carousel: heart (top-left) vs price-overlay (top-right)' },
  { name: 'v6-rappi-heart-addbtn', desc: 'Rappi list: heart (top-left) vs add-btn (bottom-right)' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  
  const outDir = '/home/z/my-project/upload';
  for (const v of variants) {
    const htmlPath = path.join(outDir, `test-theme-${v.name}.html`);
    if (!fs.existsSync(htmlPath)) {
      console.error(`Missing: ${htmlPath}`);
      continue;
    }
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
    // Wait for images to load
    await page.waitForTimeout(3000);
    // Scroll progressively to trigger IntersectionObserver reveal on all dishes
    await page.evaluate(async () => {
      const totalHeight = document.body.scrollHeight;
      const step = 400;
      for (let y = 0; y < totalHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 80));
      }
      // Scroll back to TOP of dishes area (just below mini-header)
      window.scrollTo({ top: 250, behavior: 'instant' });
    });
    await page.waitForTimeout(2000);
    const shotPath = path.join(outDir, `test-theme-${v.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`✓ ${v.name}: ${v.desc} → ${shotPath}`);
  }
  await browser.close();
  console.log('\nAll 4 screenshots saved.');
})().catch(e => { console.error(e); process.exit(1); });
