#!/usr/bin/env node
/**
 * Capture screenshots from PRODUCTION Vercel deployment
 * to verify the fixes are live.
 */

const { chromium } = require('playwright');
const path = require('path');

const OUT_DIR = '/home/z/my-project/download';
const BASE = 'https://menudigital-pro.vercel.app';

async function main() {
  const browser = await chromium.launch();

  // ─── PC view ──────────────────────────────────────────────
  console.log('\n[1/2] PRODUCTION — PC view (1280x800)');
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

  await pcPage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 45000 });
  await pcPage.waitForTimeout(4500); // wait for iframes

  await pcPage.screenshot({
    path: path.join(OUT_DIR, 'prod-home-pc.png'),
  });
  console.log('  ✓ prod-home-pc.png');

  console.log(`\n  Console errors/warnings: ${consoleErrors.length}`);
  consoleErrors.slice(0, 8).forEach((e, i) => {
    console.log(`    ${i + 1}. [${e.type}] ${e.text.substring(0, 220)}`);
  });

  console.log(`\n  404 responses: ${page404s.length}`);
  page404s.slice(0, 8).forEach((e, i) => {
    console.log(`    ${i + 1}. ${e.url.substring(0, 220)}`);
  });

  await pc.close();

  // ─── Mozo landing page ────────────────────────────────────
  console.log('\n[2/2] PRODUCTION — /mozo landing (PC)');
  const pc2 = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const p2 = await pc2.newPage();
  await p2.goto(`${BASE}/mozo`, { waitUntil: 'networkidle', timeout: 30000 });
  await p2.waitForTimeout(1500);
  await p2.screenshot({ path: path.join(OUT_DIR, 'prod-mozo-landing.png') });
  console.log('  ✓ prod-mozo-landing.png');

  await pc2.close();
  await browser.close();
  console.log('\n✅ Production screenshots captured.');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
