#!/usr/bin/env node
/**
 * Screenshot tests for the changes:
 *   1. Home page (PC view) — verify badge moved + iframe scrollbar thin + no broken images
 *   2. Home page (mobile view) — verify mobile layout
 *   3. Demo menu HTML directly — verify thin scrollbar
 */

const { chromium } = require('playwright');
const path = require('path');

const OUT_DIR = '/home/z/my-project/download';
const BASE = 'http://localhost:3001';

async function shoot(page, name, opts = {}) {
  const file = path.join(OUT_DIR, `verify-${name}.png`);
  if (opts.full) {
    await page.screenshot({ path: file, fullPage: true });
  } else {
    await page.screenshot({ path: file });
  }
  console.log(`  ✓ ${file}`);
}

(async () => {
  const browser = await chromium.launch();

  // ─── PC view (1280x800) ───────────────────────────────────────
  console.log('\n[1/3] PC view — Home page (1280x800)');
  const pc = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const pcPage = await pc.newPage();

  const consoleErrors = [];
  pcPage.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push({ type: msg.type(), text: msg.text() });
    }
  });
  const page404s = [];
  pcPage.on('response', (resp) => {
    if (resp.status() === 404) {
      page404s.push({ url: resp.url(), status: resp.status() });
    }
  });

  await pcPage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
  await pcPage.waitForTimeout(3500); // wait for iframes to load

  await shoot(pcPage, 'home-pc-top');
  await pcPage.screenshot({
    path: path.join(OUT_DIR, 'verify-home-pc-hero.png'),
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });
  console.log('  ✓ verify-home-pc-hero.png (hero only)');

  // Console errors summary
  console.log(`\n  Console errors/warnings: ${consoleErrors.length}`);
  consoleErrors.slice(0, 10).forEach((e, i) => {
    console.log(`    ${i + 1}. [${e.type}] ${e.text.substring(0, 200)}`);
  });

  console.log(`\n  404 responses: ${page404s.length}`);
  page404s.slice(0, 10).forEach((e, i) => {
    console.log(`    ${i + 1}. ${e.url.substring(0, 200)}`);
  });

  await pc.close();

  // ─── Mobile view (iPhone 14 — 390x844) ────────────────────────
  console.log('\n[2/3] Mobile view — Home page (iPhone 14)');
  const iphone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const iphonePage = await iphone.newPage();
  await iphonePage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
  await iphonePage.waitForTimeout(3500);
  await shoot(iphonePage, 'home-mobile-top');
  await iphone.close();

  // ─── Demo menu direct (thin scrollbar verification) ───────────
  console.log('\n[3/3] Demo menu — verify thin scrollbar in iframe');
  const ctx3 = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const p3 = await ctx3.newPage();
  await p3.goto(`${BASE}/demo-menus/la-parrilla.html`, {
    waitUntil: 'networkidle',
    timeout: 15000,
  });
  await p3.waitForTimeout(1500);
  await shoot(p3, 'demo-la-parrilla-direct');
  await ctx3.close();

  await browser.close();
  console.log('\n✅ All screenshots captured.');
  console.log(`   Output: ${OUT_DIR}/verify-*.png`);
})();
