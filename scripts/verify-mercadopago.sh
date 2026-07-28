#!/bin/bash
# ============================================================
# Script de verificación de configuración de MercadoPago
# Ejecuta: bash scripts/verify-mercadopago.sh
# ============================================================

echo "═══════════════════════════════════════════════════"
echo "  MenuPro — Verificación de MercadoPago"
echo "═══════════════════════════════════════════════════"
echo ""

# Cargar .env.local si existe
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

echo "📋 Variables de entorno:"
echo ""

# Verificar MERCADOPAGO_ACCESS_TOKEN
MP_TOKEN="${MERCADOPAGO_ACCESS_TOKEN:-}"
if [ -z "$MP_TOKEN" ]; then
  echo "❌ MERCADOPAGO_ACCESS_TOKEN: NO CONFIGURADO"
elif [[ "$MP_TOKEN" == TEST-* ]]; then
  echo "⚠️  MERCADOPAGO_ACCESS_TOKEN: SANDBOX (TEST-)"
  echo "   → Cambia a APP_USR- para cobros reales"
elif [[ "$MP_TOKEN" == APP_USR-* ]]; then
  echo "✅ MERCADOPAGO_ACCESS_TOKEN: PRODUCCIÓN (APP_USR-)"
else
  echo "❓ MERCADOPAGO_ACCESS_TOKEN: FORMATO DESCONOCIDO"
fi

# Verificar MERCADOPAGO_WEBHOOK_SECRET
MP_SECRET="${MERCADOPAGO_WEBHOOK_SECRET:-}"
if [ -z "$MP_SECRET" ]; then
  echo "⚠️  MERCADOPAGO_WEBHOOK_SECRET: NO CONFIGURADO"
  echo "   → En producción, el webhook rechazará todas las notificaciones (fail-closed)"
else
  echo "✅ MERCADOPAGO_WEBHOOK_SECRET: configurado (${#MP_SECRET} caracteres)"
fi

# Verificar NEXT_PUBLIC_SITE_URL
SITE_URL="${NEXT_PUBLIC_SITE_URL:-}"
if [ -z "$SITE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SITE_URL: NO CONFIGURADO"
else
  echo "✅ NEXT_PUBLIC_SITE_URL: $SITE_URL"
fi

echo ""
echo "📋 Endpoints disponibles:"
echo "   POST /api/mercadopago/checkout  — Crear suscripción"
echo "   POST /api/mercadopago/webhook   — Recibir notificaciones de MP"
echo "   POST /api/mercadopago/cancel    — Cancelar suscripción"
echo ""
echo "📋 Planes configurados:"
echo "   Pro     → S/ 35/mes"
echo "   Premium → S/ 99/mes"
echo "   Full    → S/ 199/mes"
echo ""

# Verificar que el SDK esté instalado
if [ -d node_modules/mercadopago ]; then
  echo "✅ SDK mercadopago: instalado"
else
  echo "❌ SDK mercadopago: NO instalado → ejecuta: npm install mercadopago"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Próximos pasos para cobros reales:"
echo "═══════════════════════════════════════════════════"
echo ""
echo "1. Ve a https://www.mercadopago.com.pe/developers/panel"
echo "2. Crea una aplicación y obtén credenciales APP_USR-"
echo "3. Configura webhook → URL: ${SITE_URL:-https://TU_DOMINIO}/api/mercadopago/webhook"
echo "4. Copia el secreto del webhook"
echo "5. Agrega estas vars en Vercel:"
echo "   MERCADOPAGO_ACCESS_TOKEN=APP_USR-..."
echo "   MERCADOPAGO_WEBHOOK_SECRET=..."
echo "   NEXT_PUBLIC_SITE_URL=https://TU_DOMINIO"
echo "6. Redeploya en Vercel"
echo ""
echo "📚 Guía completa: docs/MERCADOPAGO-SETUP.md"
echo ""
