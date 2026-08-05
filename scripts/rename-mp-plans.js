#!/usr/bin/env node
/**
 * scripts/rename-mp-plans.js
 *
 * Renombra los PreApproval Plans de MercadoPago para que tengan un nombre
 * profesional consistente con la marca:
 *
 *   S/ 35  → "Menu Pro - Plan Pro"
 *   S/ 99  → "Menu Pro - Plan Premium"
 *   S/ 199 → "Menu Pro - Plan Full"
 *
 * También actualiza la descripción con el detalle de beneficios.
 *
 * Uso:
 *   MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx node scripts/rename-mp-plans.js
 *
 * Opcional (modo seguro por defecto):
 *   DRY_RUN=1 node scripts/rename-mp-plans.js   → solo lista, no actualiza
 */

const fs = require('fs');
const path = require('path');

// Cargar .env.local si existe
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
  console.error('   Exporta la variable antes de ejecutar:');
  console.error('   MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx node scripts/rename-mp-plans.js\n');
  process.exit(1);
}

// Mapeo monto → { nombre, descripción }
const PLAN_BY_AMOUNT = {
  35: {
    name: 'Menu Pro - Plan Pro',
    description: 'Menús digitales ilimitados (hasta 3), QR, analytics, branding propio. Suscripción mensual.',
  },
  99: {
    name: 'Menu Pro - Plan Premium',
    description: 'Todo lo de Pro + gestión de mesas, mozos y comandas en tiempo real. Multi-sucursal (2). Suscripción mensual.',
  },
  199: {
    name: 'Menu Pro - Plan Full',
    description: 'Todo lo de Premium + multi-sucursal ilimitada (5+), POS avanzado, soporte prioritario. Suscripción mensual.',
  },
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

async function listAllPlans() {
  console.log('\n📡 Listando PreApproval Plans en MercadoPago...\n');

  const all = [];
  let offset = 0;
  const limit = 50;

  // MP devuelve hasta 50 por página
  while (true) {
    const r = await mpApi(`/preapproval_plans/search?limit=${limit}&offset=${offset}`);
    if (r.status !== 200) {
      console.error(`❌ Error listando planes: ${r.status}`, r.json);
      process.exit(1);
    }
    const results = r.json.results || r.json.elements || [];
    if (results.length === 0) break;
    all.push(...results);
    if (results.length < limit) break;
    offset += limit;
  }

  return all;
}

async function updatePlan(plan) {
  const amount = plan.auto_recurring?.transaction_amount;
  const match = PLAN_BY_AMOUNT[amount];

  if (!match) {
    console.log(`   ⏭  S/ ${amount} — no coincide con ningún plan de Menu Pro, se omite`);
    return { skipped: true };
  }

  const currentName = plan.reason || '(sin nombre)';
  const newName = match.name;

  if (currentName === newName) {
    console.log(`   ✓  S/ ${amount} — ya tiene el nombre correcto: "${newName}"`);
    return { already: true };
  }

  console.log(`   ✏  S/ ${amount} — renombrando:`);
  console.log(`       antes: "${currentName}"`);
  console.log(`       ahora: "${newName}"`);

  if (DRY_RUN) {
    console.log(`       (dry-run: no se actualiza)`);
    return { wouldUpdate: true };
  }

  const r = await mpApi(`/preapproval_plans/${plan.id}`, 'PUT', {
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
  console.log('  Menu Pro — Renombrar planes en MercadoPago');
  console.log(`  Modo: ${DRY_RUN ? 'DRY-RUN (solo lectura)' : 'ACTIVO (actualiza)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const plans = await listAllPlans();
  console.log(`   Total planes encontrados: ${plans.length}\n`);

  if (plans.length === 0) {
    console.log('   ℹ  No hay planes en tu cuenta de MP. Si nunca creaste planes');
    console.log('       manuales, esto es normal — tu código crea suscripciones');
    console.log('       individuales (PreApproval) por cada checkout.');
    console.log('\n   Si quieres crear planes reutilizables en MP dashboard,');
    console.log('   los nombres sugeridos son:');
    Object.entries(PLAN_BY_AMOUNT).forEach(([amt, p]) => {
      console.log(`     S/ ${amt} → "${p.name}"`);
    });
    return;
  }

  let updated = 0, already = 0, skipped = 0, errors = 0;
  for (const p of plans) {
    const r = await updatePlan(p);
    if (r.updated) updated++;
    else if (r.already) already++;
    else if (r.skipped) skipped++;
    else if (r.error) errors++;
  }

  console.log('\n📊 Resumen:');
  console.log(`   ${updated} actualizados`);
  console.log(`   ${already} ya estaban correctos`);
  console.log(`   ${skipped} omitidos (no son de Menu Pro)`);
  console.log(`   ${errors} errores`);

  if (DRY_RUN) {
    console.log('\nℹ  Estuviste en modo DRY-RUN. Para aplicar los cambios:');
    console.log('   node scripts/rename-mp-plans.js');
  } else {
    console.log('\n✅ Listo. Los planes nuevos se crearán automáticamente');
    console.log('   con el nombre correcto desde el código (checkout route).');
  }
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
