# MercadoPago — Guía de Configuración Real

Esta guía te lleva paso a paso para conectar MercadoPago y empezar a cobrar suscripciones reales.

## ✅ Lo que ya está implementado

- **API `/api/mercadopago/checkout`** — Crea una suscripción (PreApproval) y redirige a Checkout Pro
- **API `/api/mercadopago/webhook`** — Recibe notificaciones de MP y actualiza el plan del usuario automáticamente
- **API `/api/mercadopago/cancel`** — Cancela una suscripción activa
- **Librería `src/lib/mercadopago.ts`** — Cliente del SDK oficial de MercadoPago
- **Página `/dashboard/billing`** — UI completa para cambiar de plan y cancelar

**Planes y precios configurados:**
| Plan | Monto mensual (PEN) |
|------|---------------------|
| Pro | S/ 35 |
| Premium | S/ 99 |
| Full | S/ 199 |

---

## 🚀 Pasos para activar cobros reales

### Paso 1: Crear aplicación en MercadoPago

1. Ve a https://www.mercadopago.com.pe/developers/panel
2. Inicia sesión con tu cuenta de MercadoPago (la que recibirá los pagos)
3. Click en **"Crear aplicación"**
4. Nombre: `MenuPro Producción`
5. Selecciona: **"Suscripciones"** como caso de uso
6. Guarda

### Paso 2: Obtener credenciales

En tu aplicación creada, ve a **"Credenciales"**:

- **Access Token de producción** → `APP_USR-XXXXX...` (largo, empieza con `APP_USR-`)
- **Public Key de producción** → `APP_USR-XXXXX...` (corto)

⚠️ **IMPORTANTE**: Usa las credenciales de **PRODUCCIÓN** (empiezan con `APP_USR-`), NO las de prueba (`TEST-`).

### Paso 3: Configurar Webhook (CRÍTICO)

1. En tu aplicación de MP → **"Webhooks"** → **"Crear webhook"**
2. **URL**: `https://menudigital.pro/api/mercadopago/webhook`
   - (Si usas dominio custom, reemplaza por el tuyo)
3. **Eventos**: selecciona `subscription_preapproval` y `payment`
4. Click en **"Guardar"**
5. MP te mostrará un **Secreto de firma (Secret)** → cópialo

### Paso 4: Configurar variables de entorno en Vercel

Ve a https://vercel.com/tu-projects/settings/environment-variables y agrega:

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-TU_ACCESS_TOKEN_DE_PRODUCCION
MERCADOPAGO_WEBHOOK_SECRET=TU_SECRETO_DE_FIRMA_DEL_PASO_3
NEXT_PUBLIC_SITE_URL=https://menudigital.pro
```

⚠️ **CRÍTICO**: Sin `MERCADOPAGO_WEBHOOK_SECRET`, el webhook rechaza todas las notificaciones en producción (fail-closed por seguridad).

### Paso 5: Redeploy en Vercel

Después de agregar las variables, **redeploya** la app desde Vercel:
- Ve a tu proyecto → Deployments → ⋮ → Redeploy
- O simplemente haz `git push` para que Vercel redeploye automáticamente

### Paso 6: Probar el flujo completo

1. Entra a `/dashboard/billing` con tu cuenta
2. Click en **"Empezar Pro"** (o Premium/Full)
3. MercadoPago abrirá Checkout Pro
4. Paga con tarjeta de prueba o real
5. Vuelve a `/dashboard/billing` — tu plan debe estar actualizado automáticamente

**Para probar en sandbox (sin cobrar real):**
- Usa credenciales `TEST-` en lugar de `APP_USR-`
- Tarjetas de prueba: https://www.mercadopago.com.pe/developers/es/docs/checkout-api/integration-test/test-cards

---

## 🔍 Verificar que todo funciona

### Test 1: Crear suscripción

```bash
curl -X POST https://menudigital.pro/api/mercadopago/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: TU_COOKIE_DE_SESION" \
  -d '{"planId":"pro"}'
```

Debe devolver: `{"url":"https://www.mercadopago.com.pe/subscriptions/checkout?preapproval_id=..."}`

### Test 2: Webhook responde

```bash
curl -X POST https://menudigital.pro/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{"id":"test"}}'
```

Debe devolver: `{"received":true}` (en desarrollo sin firma; en producción requiere firma válida)

### Test 3: Logs del webhook

Cuando un usuario paga, busca en los logs de Vercel:
```
[MP webhook] type: subscription_preapproval id: 2C9323E0A... live_mode: true
[MP webhook] ✅ Usuario XXX → plan=pro status=authorized
```

---

## 🆘 Troubleshooting

### "MERCADOPAGO_ACCESS_TOKEN no está configurado"
- Falta la variable en Vercel. Ve a Settings → Environment Variables.

### El webhook devuelve 401 "Invalid signature"
- `MERCADOPAGO_WEBHOOK_SECRET` no coincide con el secreto del webhook en MP.
- Verifica que copiaste el secreto correctamente (sin espacios).
- En desarrollo (NODE_ENV !== production), el webhook permite sin firma para pruebas locales.

### El usuario paga pero su plan no se actualiza
- Revisa que el webhook esté configurado con la URL correcta en MP.
- Verifica que `NEXT_PUBLIC_SITE_URL` coincida con la URL del webhook.
- Revisa los logs de Vercel para ver si el webhook recibió la notificación.

### "Ya tienes una suscripción activa"
- El usuario ya tiene `mp_status = 'authorized'` en su perfil.
- Debe cancelar primero desde `/dashboard/billing` antes de cambiar de plan.

---

## 💰 Flujo de dinero

1. Usuario hace clic en "Empezar Pro" → se crea PreApproval en MP
2. MP redirige a Checkout Pro → usuario paga S/ 35
3. MP envía webhook a `/api/mercadopago/webhook` con `type: subscription_preapproval`
4. Backend verifica firma HMAC, consulta estado a MP, actualiza `profiles.plan = 'pro'`
5. MP cobra automáticamente cada mes (recurrencia configurada en `createPreapproval`)
6. Si el pago falla, MP envía webhook con `status: 'paused'` o `'cancelled'` → backend degrada el plan

¡Listo! Con esto tienes cobros reales funcionando.
