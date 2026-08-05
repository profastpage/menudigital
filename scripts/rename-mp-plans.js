#!/usr/bin/env node
/**
 * scripts/rename-mp-plans.js
 *
 * Renombra las suscripciones PreApproval de MercadoPago para que tengan
 * un nombre profesional consistente con la marca:
 *
 *   S/ 35  → "Menu Pro - Plan Pro"
 *   S/ 99  → "Menu Pro - Plan Premium"
 *   S/ 199 → "Menu Pro - Plan Full"
 *
 * NOTA: MercadoPago deprecó el endpoint /preapproval_plans/search.
 * Este script renombra las SUSCRIPCIONES PreApproval (que es lo que
 * tu código crea por cada checkout). Los planes TEMPLATE del dashboard
 * de MP deben renombrarse manualmente en la web de MP.
 *
 * Uso:
 *   MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx node scripts/rename-mp-plans.js
 *
 * Opciones:
 *   DRY_RUN=1 → solo lista, no actualiza
 */

const fs = require('fs');
const path = require('path');

function loadEnv(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(path.join(process.cwd(), '.env.local'));
loadEnv(path.join(process.cwd(), '.env'));

const TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const DRY_RUN = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('\n❌ Falta MERCADOPAGO_ACCESS_TOKEN.');
  console.error('   MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx node scripts/rename-mp-plans.js\n');
  process.exit(1);
}

// Mapeo monto → { nombre }
const PLAN_BY_AMOUNT = {
  35:  { name: 'Menu Pro - Plan Pro',     desc: 'Menús digitales ilimitados (hasta 3), QR, analytics, branding propio.' },
  35.0:{ name: 'Menu Pro - Plan Pro',     desc: 'Menús digitales ilimitados (hasta 3), QR, analytics, branding propio.' },
  99:  { name: 'Menu Pro - Plan Premium', desc: 'Todo lo de Pro + gestión de mesas, mozos y comandas en tiempo real.' },
  99.0:{ name: 'Menu Pro - Plan Premium', desc: 'Todo lo de Pro + gestión de mesas, mozos y comandas en tiempo real.' },
  199: { name: 'Menu Pro - Plan Full',    desc: 'Todo lo de Premium + multi-sucursal ilimitada, POS avanzado.' },
  199.0:{ name: 'Menu Pro - Plan Full',   desc: 'Todo lo de Premium + multi-sucursal ilimitada, POS avanzado.' },
};

async function mpApi(endpoint, method = 'GET', body) {
  const res = await fetch(`https://api.mercadopago.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function listAllSubscriptions() {
  console.log('\n📡 Listando PreApproval subscriptions en MercadoPago...\n');

  const all = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const r = await mpApi(`/preapproval/search?limit=${limit}&offset=${offset}`);
    if (r.status !== 200) {
      console.error(`❌ Error listando: ${r.status}`, r.json);
      process.exit(1);
    }
    const results = r.json.results || [];
    if (results.length === 0) break;
    all.push(...results);
    if (results.length < limit) break;
    offset += limit;
  }

  return all;
}

async function updateSubscription(sub) {
  const amount = sub.auto_recurring?.transaction_amount;
  const match = PLAN_BY_AMOUNT[amount];

  if (!match) {
    console.log(`   ⏭  S/ ${amount} — no coincide con plan de Menu Pro, se omite (id: ${sub.id})`);
    return { skipped: true };
  }

  const currentName = sub.reason || '(sin nombre)';
  const newName = match.name;

  if (currentName === newName) {
    console.log(`   ✓  S/ ${amount} — ya tiene nombre correcto: "${newName}" (id: ${sub.id})`);
    return { already: true };
  }

  console.log(`   ✏  S/ ${amount} — renombrando (id: ${sub.id}):`);
  console.log(`       antes: "${currentName}"`);
  console.log(`       ahora: "${newName}"`);

  if (DRY_RUN) {
    console.log(`       (dry-run: no se actualiza)`);
    return { wouldUpdate: true };
  }

  const r = await mpApi(`/preapproval/${sub.id}`, 'PUT', {
    reason: newName,
  });

  if (r.status === 200) {
    console.log(`       ✅ actualizado`);
    return { updated: true };
  } else {
    console.error(`       ❌ error: ${r.status}`, r.json);
    return { error: true };
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Menu Pro — Renombrar suscripciones en MercadoPago');
  console.log(`  Modo: ${DRY_RUN ? 'DRY-RUN (solo lectura)' : 'ACTIVO (actualiza)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const subs = await listAllSubscriptions();
  console.log(`   Total suscripciones encontradas: ${subs.length}\n`);

  if (subs.length === 0) {
    console.log('   ℹ  No hay suscripciones aún. Las nuevas usarán el formato correcto.');
    return;
  }

  let updated = 0, already = 0, skipped = 0, errors = 0;
  for (const s of subs) {
    const r = await updateSubscription(s);
    if (r.updated) updated++;
    else if (r.already) already++;
    else if (r.skipped) skipped++;
    else if (r.error) errors++;
  }

  console.log('\n📊 Resumen:');
  console.log(`   ${updated} actualizadas`);
  console.log(`   ${already} ya estaban correctas`);
  console.log(`   ${skipped} omitidas (no son de Menu Pro)`);
  console.log(`   ${errors} errores`);

  if (DRY_RUN) {
    console.log('\nℹ  Estuviste en modo DRY-RUN. Para aplicar:');
    console.log('   node scripts/rename-mp-plans.js');
  } else {
    console.log('\n✅ Listo. Los checkouts nuevos usarán el formato correcto automáticamente.');
  }

  console.log('\n📌 NOTA: Los planes TEMPLATE que creaste manualmente en el dashboard');
  console.log('   de MercadoPago (ej: "QSS Plan Growth - xxx") no se pueden renombrar');
  console.log   ('   vía API — MP deprecó ese endpoint. Renombralos manualmente en:');
  console.log('   https://www.mercadopago.com.pe/suscripciones/planes');
  console.log('   Nombres sugeridos:');
  console.log('     S/ 35  → "Menu Pro - Plan Pro"');
  console.log('     S/ 99  → "Menu Pro - Plan Premium"');
  console.log('     S/ 199 → "Menu Pro - Plan Full"');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
