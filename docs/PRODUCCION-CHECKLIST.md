# 🚀 Checklist de Producción — MenuPro

Guía paso a paso para salir a producción con clientes reales.
Fecha de creación: 28 julio 2026.

---

## 📋 Resumen ejecutivo

Para vender a clientes reales en Perú necesitas completar 4 áreas:

1. **Legal** — Páginas legales (ya creadas, solo revisar contenido)
2. **Pagos** — MercadoPago en producción + webhook con firma HMAC
3. **Email** — Resend para correos transaccionales
4. **Infraestructura** — Dominio propio + monitoreo + backups

Cada sección marca:
- ✅ = ya está implementado en código
- 🔧 = requiere acción manual tuya (configuración externa)
- ⚠️ = recomendado pero opcional

---

## 1. PÁGINAS LEGALES ✅

### Ya está hecho
- `/legal/terminos` — Términos de Servicio (Ley 29733, INDECOPI)
- `/legal/privacidad` — Política de Privacidad
- `/legal/reembolsos` — Política de Reembolsos (Ley 29571)
- Footer del landing enlaza a las 3 páginas
- Formulario de registro requiere checkbox de aceptación

### 🔧 Acción manual
- **Revisar el contenido legal con un abogado peruano**. Las plantillas están basadas en estándares SaaS, pero deben adaptarse a tu razón social específica (FastPagePro o la que uses), RUC, dirección fiscal.
- **Comprar el dominio `menudigital.pro`** si no lo tienes aún (ver sección 4).

---

## 2. MERCADOPAGO EN PRODUCCIÓN

### Ya está hecho en código ✅
- Verificación de firma HMAC del webhook (`verifyWebhookSignature` en `src/lib/mercadopago.ts`)
- Webhook rechaza requests sin firma válida (fail-closed en producción)
- Rate limiting en `/api/mercadopago/webhook` (60/min por IP)
- Email de confirmación de pago enviado automáticamente vía Resend

### 🔧 Acción manual: pasar de sandbox a producción

1. **Entra a https://www.mercadopago.com.pe/developers/panel**
2. Ve a **Tu aplicación → Credenciales**
3. Copia:
   - `Access Token de producción` (NO el de prueba)
   - `Public Key de producción`
4. **En Vercel → Settings → Environment Variables**, actualiza:
   ```
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   ```
   (reemplaza el valor sandbox que empieza con `TEST-`)

5. **Verifica tu negocio en MercadoPago**:
   - En el panel, sección "Mis ventas → Verificar mi negocio"
   - Necesitas:
     - RUC de tu empresa o DNI si eres persona natural
     - Datos del titular
     - Cuenta bancaria para recibir los cobros
   - Proceso tarda 24-72 horas hábiles

6. **Configura el webhook en producción**:
   - En MercadoPago → Tu aplicación → Webhooks
   - URL: `https://menudigital.pro/api/mercadopago/webhook`
   - Eventos a escuchar: `subscription_preapproval`, `payment`
   - Anota el **secreto de firma** que MercadoPago te da

7. **Agrega el secreto en Vercel**:
   ```
   MERCADOPAGO_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx
   ```

8. **Redeploy** en Vercel (push a main lo dispara automáticamente).

### ⚠️ Verificación post-deploy
- Haz una compra real de prueba con tu propia tarjeta en el plan Pro mensual
- Verifica que el webhook llega (logs en Vercel → Functions → `api/mercadopago/webhook`)
- Verifica que recibes el email de confirmación
- Cancela la suscripción desde MercadoPago inmediatamente para no cobrarte

---

## 3. RESEND — Email transaccional

### Ya está hecho en código ✅
- SDK `resend` instalado
- Cliente en `src/lib/email.ts` (lazy init, fail-safe en dev)
- 4 templates: bienvenida, pago confirmado, pago fallido, fin de trial
- Email de bienvenida se envía automáticamente tras registro
- Email de pago confirmado se envía desde el webhook de MP

### 🔧 Acción manual

1. **Crea cuenta en https://resend.com** (tier free: 3000 emails/mes, suficiente para empezar)
2. **Verifica tu dominio**:
   - En Resend → Domains → Add Domain
   - Ingresa `menudigital.pro`
   - Resend te dará registros DNS (SPF, DKIM, DMARC) que debes agregar en Cloudflare/Namecheap/donde tengas el dominio
   - Espera 5-30 minutos a que se propaguen
   - Estado debe pasar a "Verified"
3. **Genera API key**:
   - Resend → API Keys → Create API Key
   - Permisos: "Sending access" (full)
   - Copia el key `re_xxxxxxxxxxxx`
4. **Configura en Vercel**:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   FROM_EMAIL=MenuPro <hola@menudigital.pro>
   ```
5. **Redeploy**

### ⚠️ Sin dominio verificado todavía
Mientras verificas tu dominio, puedes usar el sandbox de Resend:
```
FROM_EMAIL=MenuPro <onboarding@resend.dev>
```
Solo permite enviar a tu propio email (el de tu cuenta Resend). Útil para pruebas.

---

## 4. DOMINIO PROPIO

### 🔧 Acción manual

1. **Compra el dominio**:
   - Opciones: Namecheap, GoDaddy, Cloudflare Registrar, Nic.pe
   - `.pe` cuesta ~S/120/año, `.com` ~S/40/año
   - Recomendado: `menudigital.pro` ya que es lo que está en todo el código

2. **Apunta a Vercel**:
   - En el panel de tu registrador, configura los nameservers a los de Vercel:
     ```
     ns1.vercel-dns.com
     ns2.vercel-dns.com
     ```
   - O agrega un registro CNAME `@` → `cname.vercel-dns.com`

3. **Agrega el dominio en Vercel**:
   - Vercel → Tu proyecto → Settings → Domains
   - Add domain: `menudigital.pro`
   - Add domain: `www.menudigital.pro` (redirige al primero)
   - Vercel te da un TXT de verificación; agrégalo en tu DNS

4. **Actualiza las URLs en configuración**:
   - Vercel → Environment Variables:
     ```
     NEXT_PUBLIC_SITE_URL=https://menudigital.pro
     ```
   - En Supabase → Authentication → URL Configuration:
     - Site URL: `https://menudigital.pro`
     - Redirect URLs: `https://menudigital.pro/auth/callback`
   - En Google Cloud Console (OAuth):
     - Authorized redirect URIs: `https://menudigital.pro/auth/callback`
     - Authorized JavaScript origins: `https://menudigital.pro`

5. **Redeploy**

---

## 5. SUPABASE — Backups automáticos

### 🔧 Acción manual

1. **Entra a https://supabase.com/dashboard → Tu proyecto**
2. **Plan actual (Free tier)**:
   - Backups diarios automáticos, retención 7 días
   - ✅ Suficiente para validar el producto con primeros clientes

3. **Cuando superes 50 clientes** (recomendación):
   - Upgrade a **Pro plan USD 25/mes**
   - Incluye: backups diarios + PITR (Point-in-Time Recovery hasta 7 días)
   - 8GB de base de datos (vs 500MB del free)
   - Soporte por email

4. **Para restaurar desde un backup**:
   - Supabase → Database → Backups
   - Selecciona el día → "Restore"
   - Tarda 5-30 minutos según tamaño

### ⚠️ Adicional: exportación mensual manual
Una vez al mes, descarga un dump SQL completo:
```bash
pg_dump "postgresql://postgres.bkxtploibraiovgrjtwn:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
  --clean --if-exists --no-owner \
  > backup-$(date +%Y%m%d).sql
```
Sube el archivo a Google Drive o Dropbox. Retención: 12 meses.

---

## 6. SENTRY — Monitoreo de errores

### Ya está hecho en código ✅
- `@sentry/nextjs` instalado
- `sentry.client.config.ts` y `sentry.server.config.ts` listos
- Error Boundary en `src/components/error-boundary.tsx`
- Global error page en `src/app/global-error.tsx`
- `instrumentation.ts` configurado

### 🔧 Acción manual

1. **Crea cuenta en https://sentry.io** (tier free: 5000 errores/mes)
2. **Crea un proyecto "Next.js"**
3. **Copia el DSN** (algo como `https://xxxxx@o12345.ingest.sentry.io/67890`)
4. **Configura en Vercel**:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o12345.ingest.sentry.io/67890
   SENTRY_DSN=https://xxxxx@o12345.ingest.sentry.io/67890
   ```
   (Puedes usar el mismo DSN para ambas; Sentry separa eventos client/server automáticamente)
5. **(Opcional) Source maps** para stack traces más legibles:
   - Sentry → Settings → Auth Tokens → Create new token
   - Permiso: `org:read` + `project:write`
   - En Vercel: `SENTRY_AUTH_TOKEN=sntrys_xxxxx`
6. **Redeploy**
7. **Verifica**: provoca un error intencional (ej: botón que llama a endpoint inexistente) y revisa que aparezca en Sentry → Issues

---

## 7. FACTURACIÓN ELECTRÓNICA SUNAT

### 🔧 Acción manual (solo cuando superes ~S/2000/mes en ingresos)

Hasta ese punto, puedes emitir recibos por honorarios manuales. A partir de ahí, debes tener sistema de facturación electrónica.

**Opciones**:

#### Opción A: Integración con proveedor (recomendado)
- **Nubefact** (https://nubefact.com): S/59/mes, REST API simple
- **Mh-Group Facturador**: gratuito para 1 negocio
- **Osefact**: S/30/mes

Pasos:
1. Regístrate como emisor electrónico en SUNAT ( Gratuito, requiere RUC)
2. Contrata el proveedor
3. Solicita certificado digital (S/200/año)
4. Integra su API en `/api/billing/invoice` (post-pago, generar boleta/factura y enviar al cliente + SUNAT)
5. Configura credenciales en Vercel:
   ```
   NUBEFACT_API_URL=https://...
   NUBEFACT_API_TOKEN=xxxx
   ```

#### Opción B: Manual al inicio
- Emite recibos por honorarios desde la app "Mi Resumen SUNAT"
- Solo si eres persona natural con RUC de oficio independiente
- Límite: S/5250/mes de ingresos brutos

---

## 8. RLS Y SEGURIDAD

### Ya está hecho ✅
- Migración correctiva en `supabase/audit-rls-fix.sql`:
  - `FORCE ROW LEVEL SECURITY` en todas las tablas con datos de cliente
  - Storage policies estrictas (cliente solo escribe en su carpeta)
  - Política de SELECT público en `orders` para el panel del mozo
  - Función helper `get_waiter_id_by_token()`

### 🔧 Acción manual
- **Ejecuta la migración en Supabase SQL Editor**:
  1. Supabase → SQL Editor → New query
  2. Pega el contenido de `supabase/audit-rls-fix.sql`
  3. Run
  4. Verifica en Output que todas las tablas salgan con ✅

- **Ejecuta la migración de onboarding**:
  ```sql
  -- Pega supabase/add-onboarding-fields.sql
  ```

---

## 9. RATE LIMITING

### Ya está hecho ✅
- Middleware global en `src/middleware.ts` con rate limiting para:
  - `/api/auth/*` — 10 req/min por IP
  - `/api/upload` — 30 req/min por IP
  - `/api/bg-removal/*` — 5 req/min por IP
- Rate limit en `/api/mercadopago/webhook` — 60 req/min por IP
- Respuestas 429 estándar con header `Retry-After`

### Limitación conocida
En Vercel serverless, cada instancia tiene su propio contador (en memoria). El límite efectivo puede ser hasta `limit × número de instancias`. Para rate limiting distribuido real:
- ⚠️ Considerar Upstash Ratelimit + Upstash Redis (tier free: 10K comandos/día)
- Solo si detectas abuso real a nivel de red

---

## 10. ONBOARDING

### Ya está hecho ✅
- Wizard de 3 pasos en `/dashboard/onboarding`:
  1. Datos del negocio (nombre, teléfono, rubro)
  2. Datos del menú (nombre, slogan, WhatsApp, color)
  3. Primer plato (categoría, nombre, precio, descripción)
- Detección automática: usuario sin menús y sin onboarding completado → redirige al wizard
- API en `/api/onboarding/complete` crea menú + categoría + plato en una transacción
- Migración `add-onboarding-fields.sql` añade columnas a profiles

---

## 11. CANAL DE SOPORTE

### 🔧 Acción manual
1. **WhatsApp Business** en número dedicado (recomendado: +51 987 654 321)
   - Instala WhatsApp Business app en un celular dedicado
   - Configura mensaje de bienvenida: "Hola, soy el equipo de soporte de MenuPro. ¿En qué te puedo ayudar?"
   - Horario de respuesta: Lun-Vie 9am-7pm

2. **Email de soporte**:
   - Crea `soporte@menudigital.pro` (via Gmail for Work, Resend, o Zoho Mail free)
   - Forward a tu email personal hasta que necesites un agente dedicado

3. **Página de ayuda** (ver sección 9)

---

## 12. ANALYTICS DE PRODUCTO

### 🔧 Acción manual (recomendado a partir de los primeros 10 clientes)

**Vercel Analytics** (más simple, ya integrable):
- Vercel → Tu proyecto → Analytics → Enable
- Tier free: 1M eventos/mes
- Sin configuración de código

**PostHog** (alternativa más potente, para funnels):
- Crea cuenta en https://posthog.com (tier free: 1M eventos/mes)
- Copia `POSTHOG_KEY` y `NEXT_PUBLIC_POSTHOG_KEY` en Vercel
- Documentación: https://posthog.com/docs/libraries/nextjs

---

## ✅ CHECKLIST FINAL — ANTES DE ATENDER AL PRIMER CLIENTE

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Páginas legales revisadas por abogado | ⚠️ Pendiente |
| 2 | MercadoPago en producción (access token de prod) | ⚠️ Pendiente |
| 3 | MercadoPago webhook con secreto HMAC configurado | ⚠️ Pendiente |
| 4 | Resend configurado con dominio verificado | ⚠️ Pendiente |
| 5 | Dominio menudigital.pro comprado y apuntando a Vercel | ⚠️ Pendiente |
| 6 | Supabase con backups activos | ✅ Free tier cubre |
| 7 | Sentry configurado (DSN en Vercel) | ⚠️ Pendiente |
| 8 | Migración RLS ejecutada en Supabase | ⚠️ Pendiente |
| 9 | Migración onboarding ejecutada | ⚠️ Pendiente |
| 10 | WhatsApp Business + email soporte configurados | ⚠️ Pendiente |
| 11 | Cuenta demo funcional para mostrar a prospectos | ✅ Lista |
| 12 | Build limpio en Vercel | ✅ Verificado |

---

## 🎯 ORDEN RECOMENDADO DE EJECUCIÓN

**Día 1** (4-6 horas):
- Comprar dominio
- Configurar Vercel con dominio
- Solicitar verificación de MercadoPago
- Crear cuenta Resend + configurar DNS

**Día 2** (2-3 horas, mientras MP verifica):
- Crear cuenta Sentry
- Ejecutar migraciones SQL en Supabase
- Probar onboarding flow con cuenta demo nueva
- Verificar que el email de bienvenida llega

**Día 3** (1-2 horas):
- Una vez verificado MP, cambiar a production token
- Hacer compra de prueba real
- Verificar webhook con firma HMAC
- Configurar WhatsApp Business

**Día 4**:
- ¡Lanzar! Publicar en redes, contactar a primeros 10 restaurantes
- Monitorear Sentry + Resend analytics por 1 semana

---

## 🆘 EN CASO DE PROBLEMAS

- **Error en pago**: revisar logs del webhook en Vercel → Functions → `api/mercadopago/webhook`
- **Email no llega**: revisar Resend → Logs. Si FROM_EMAIL es onboarding@resend.dev, solo llega a tu propia cuenta
- **App caída**: revisar Vercel → Deployments. Si hay build error, Sentry capturará errores runtime
- **DB caída**: revisar Supabase → Status page. Si hay problema, restaurar desde backup
- **Cliente con bug**: pedirle screenshot del error o video. Si tiene Sentry event ID, buscarlo en Issues

Contacto técnico: FastPagePro — fastpagepro.com
