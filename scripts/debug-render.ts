/**
 * Debug: capture rendered HTML after JS execution to verify dishes are rendered.
 */
import { chromium } from 'playwright';
import * as fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`CONSOLE ERROR: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
  
  await page.goto('file:///home/z/my-project/upload/test-theme-v1-single-1col.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Check what's in #app
  const appHtml = await page.evaluate(() => {
    const app = document.getElementById('app');
    return {
      htmlLength: app ? app.innerHTML.length : 0,
      dishCount: document.querySelectorAll('.dish').length,
      dishImgWrapCount: document.querySelectorAll('.dish-img-wrap').length,
      cartaCardCount: document.querySelectorAll('.carta-card').length,
      rappiItemCount: document.querySelectorAll('.rappi-item').length,
      appTop: app ? app.getBoundingClientRect().top : null,
      appScrollHeight: app ? app.scrollHeight : null,
      bodyScrollHeight: document.body.scrollHeight,
      // Check first dish position
      firstDish: (() => {
        const d = document.querySelector('.dish, .carta-card, .rappi-item') as HTMLElement | null;
        if (!d) return null;
        const r = d.getBoundingClientRect();
        return { top: r.top, left: r.left, width: r.width, height: r.height, classes: d.className };
      })(),
    };
  });
  
  console.log('=== Rendered DOM Analysis ===');
  console.log(JSON.stringify(appHtml, null, 2));
  console.log('\n=== Errors ===');
  if (errors.length === 0) console.log('(no errors)');
  else errors.forEach(e => console.log(e));
  
  // Take a screenshot at the FIRST dish position
  if (appHtml.firstDish) {
    await page.evaluate((top) => {
      window.scrollTo({ top: Math.max(0, top - 100), behavior: 'instant' });
    }, appHtml.firstDish.top);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/z/my-project/upload/test-theme-v1-debug.png' });
    console.log('✓ Debug screenshot saved.');
  }
  
  await browser.close();
})();
