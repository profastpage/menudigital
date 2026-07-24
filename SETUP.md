# MenuPro — Setup Guide

Guía completa para poner MenuPro en producción en ~30 minutos.

## Arquitectura

```
Frontend:  Next.js 16 + TypeScript + Tailwind + shadcn/ui
Auth:      Supabase Auth (email+password + Google OAuth)
DB:        Supabase Postgres (con Row Level Security)
Storage:   Supabase Storage (imágenes de logos y platos)
Pagos:     MercadoPago (suscripción mensual S/35 ≈ $9 USD)
Hosting:   Vercel
```

---

## 1) Configurar Supabase (~10 min)

### 1.1 Crear proyecto
1. Ve a https://supabase.com → **New project**
2. Nombre: `menupro` (o el que prefieras)
3. Password: genera uno seguro y guárdalo
4. Region: **South America (São Paulo)** para LatAm
5. Espera 2-3 min a que termine el provisioning

### 1.2 Ejecutar schema SQL
1. En el dashboard del proyecto → **SQL Editor** → **New query**
2. Copia y pega TODO el contenido de `supabase/schema.sql` (en este repo)
3. Click **Run** — deberías ver "Success. No rows returned"
4. Verifica: **Table Editor** debe mostrar tablas `profiles`, `menus`, `categories`, `dishes`, `menu_views`

> Si ya tenías el schema anterior con columnas `stripe_*`, ejecuta esta migración antes de volver a correr el schema completo:
> ```sql
> ALTER TABLE profiles
>   DROP COLUMN IF EXISTS stripe_customer_id,
>   DROP COLUMN IF EXISTS stripe_subscription_id,
>   DROP COLUMN IF EXISTS stripe_price_id,
>   ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
>   ADD COLUMN IF NOT EXISTS mp_status TEXT;
> ```

### 1.3 Configurar Auth
1. Ve a **Authentication** → **Providers**
2. **Email**: debe estar habilitado por defecto. Verifica.
3. **Google**:
   - Click **Enable** → te lleva a Google Cloud Console
   - Sigue las instrucciones de Supabase para crear OAuth 2.0 Client ID
   - Authorized redirect URI: `https://TU-PROYECTO.supabase.co/auth/v1/callback`
   - Copia el **Client ID** y **Client Secret** de vuelta en Supabase
4. Ve a **Authentication** → **URL Configuration**
   - Site URL: `http://localhost:3000` (dev) o tu dominio en prod
   - Redirect URLs: añade `http://localhost:3000/auth/callback` y tu URL de prod

### 1.4 Configurar Storage
1. Ve a **Storage** — deberías ver el bucket `menus` creado por el schema SQL
2. Si no existe, créalo manualmente: **New bucket** → name: `menus` → **Public bucket**: ON
3. Las policies ya están en el schema SQL, pero si necesitas recrearlas ejecuta de nuevo la sección 8

### 1.5 Obtener credenciales
1. Ve a **Settings** → **API**
2. Copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2) Configurar MercadoPago (~10 min)

### 2.1 Crear cuenta y aplicación
1. Ve a https://www.mercadopago.com → regístrate (o inicia sesión)
2. Entra a https://www.mercadopago.com/developers/panel → **Tu aplicación** → **Crear aplicación**
3. Nombre: `MenuPro`
4. Producto: **Pagos** → **Suscripciones**
5. Una vez creada, entra a la app para obtener las credenciales

### 2.2 Obtener credenciales
1. En la app → **Credenciales**
2. Copia:
   - **Access Token** (`APP_USR-xxxxx` en prod, `TEST-xxxxx` en sandbox) → `MERCADOPAGO_ACCESS_TOKEN`
3. Opcionalmente copia también la **Public Key** si la necesitas para el SDK frontend.

> Para probar primero en sandbox: usa el Access Token `TEST-xxxxx` y setea `MERCADOPAGO_SANDBOX=true`. Las suscripciones se simulan sin cobro real.

### 2.3 Configurar webhook
1. En tu app → **Webhooks** → **Crear webhook**
2. URL del webhook: `https://TU-DOMINIO/api/mercadopago/webhook` (ej: `https://menupro.vercel.app/api/mercadopago/webhook`)
3. Eventos a notificar:
   - `subscription_preapproval` (cambios de estado de la suscripción)
   - `payment` (opcional — para detectar fallos de cobro)
4. Guarda. Marketplace te mostrará un **secret de validación** (header `x-signature`) — opcional para validar la procedencia.
5. Para desarrollo local, MercadoPago no puede llamar a `localhost`. Usa **ngrok**:
   ```bash
   ngrok http 3000
   # Copia la URL https://xxx.ngrok.io/api/mercadopago/webhook
   # y regístrala como webhook temporal
   ```

### 2.4 Probar el flujo de suscripción
1. En sandbox, MercadoPago te da tarjetas de prueba (visa: `4509 9535 6623 3704`, master: `5031 7557 3453 0604`, cualquier CVV y fecha futura).
2. Inicia sesión en MenuPro → `/dashboard/billing` → click **Upgrade a Pro**.
3. Se abre Checkout Pro (hosted en mercadopago.com) → paga con tarjeta de prueba.
4. MP redirige de vuelta a `/dashboard/billing?success=1`.
5. El webhook debe llegar en ~5-30 segundos y actualizar el plan a `pro`.

---

## 3) Configurar variables de entorno

Crea `.env.local` en la raíz del proyecto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
MERCADOPAGO_SANDBOX=false
MERCADOPAGO_CURRENCY_ID=PEN   # PEN=Soles, MXN, COP, CLP, ARS, BRL, USD...

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 4) Desarrollo local

```bash
# Instalar dependencias
bun install

# Correr en desarrollo
bun run dev

# Abrir http://localhost:3000
```

---

## 5) Deploy a Vercel (~5 min)

### 5.1 Subir a GitHub
```bash
git init
git add .
git commit -m "MenuPro MVP"
git branch -M main
git remote add origin https://github.com/tu-usuario/menupro.git
git push -u origin main
```

### 5.2 Conectar con Vercel
1. Ve a https://vercel.com → **New Project** → importa tu repo
2. Framework Preset: **Next.js** (auto-detectado)
3. **Environment Variables** → agrega TODAS las variables de `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `MERCADOPAGO_ACCESS_TOKEN`
   - `MERCADOPAGO_SANDBOX=false`
   - `MERCADOPAGO_CURRENCY_ID=PEN`
   - `NEXT_PUBLIC_SITE_URL` = `https://tu-app.vercel.app` (la URL que Vercel te dé)
4. Click **Deploy** — tarda 1-2 min
5. Obtén tu URL (ej: `menupro-xxx.vercel.app`)

### 5.3 Actualizar URLs externas
Una vez desplegado, actualiza:

**Supabase**:
- Authentication → URL Configuration → Site URL: `https://menupro-xxx.vercel.app`
- Redirect URLs: añade `https://menupro-xxx.vercel.app/auth/callback`

**MercadoPago**:
- Tu aplicación → Webhooks → edita tu webhook → URL: `https://menupro-xxx.vercel.app/api/mercadopago/webhook`

**.env en Vercel**:
- `NEXT_PUBLIC_SITE_URL` = `https://menupro-xxx.vercel.app`

---

## 6) Dominio personalizado (opcional)

### 6.1 En Vercel
1. Tu proyecto → **Settings** → **Domains**
2. Añade `menupro.app` (necesitas comprarlo antes en Namecheap, GoDaddy, etc.)
3. Sigue las instrucciones DNS de Vercel

### 6.2 Actualizar todo
- `NEXT_PUBLIC_SITE_URL` = `https://menupro.app`
- Supabase Site URL = `https://menupro.app`
- Supabase Redirect URLs = `https://menupro.app/auth/callback`
- MercadoPago Webhook URL = `https://menupro.app/api/mercadopago/webhook`

---

## 7) Verificación post-deploy

Visita estos endpoints en producción:

- ✅ `https://tu-url/` — Landing page carga
- ✅ `https://tu-url/register` — Form de registro
- ✅ Regístrate con email → recibes email de confirmación
- ✅ Confirma email → eres redirigido a `/dashboard`
- ✅ Crea un menú → eres redirigido al editor
- ✅ Edita el menú → se guarda automáticamente
- ✅ Click "Publicar" → se abre `/r/tu-slug` en otra pestaña
- ✅ En el menú público, agrega items al carrito → envía pedido por WhatsApp
- ✅ `/dashboard/billing` → click "Upgrade a Pro" → Checkout Pro de MercadoPago se abre
- ✅ Completa el pago con tarjeta de prueba (sandbox)
- ✅ Webhook se recibe → tu plan cambia a `pro` automáticamente
- ✅ Vuelves al dashboard → plan badge dice "Pro"
- ✅ En el editor de tu menú, ya no aparece el badge "Creado con MenuPro" en la vista previa
- ✅ Visita `/dashboard/[menuId]/qr` → QR se genera y se puede descargar

---

## Troubleshooting

### "Invalid login credentials" al registrarse
- Supabase por defecto requiere confirmación por email. Ve a **Authentication → Settings** y desactiva "Confirm email" si quieres login inmediato en desarrollo.

### Webhook de MercadoPago no llega
- Verifica `MERCADOPAGO_ACCESS_TOKEN` en Vercel
- Verifica que la URL del webhook en MercadoPago Developers coincida con tu dominio de Vercel
- En MercadoPago → tu app → Webhooks → debería mostrar intentos de envío (con `200 OK` si llegó)
- Para local: usa ngrok o smee.io

### Google OAuth redirige pero no vuelve
- Verifica Redirect URLs en Supabase → Authentication → URL Configuration
- Debe incluir `https://tu-url/auth/callback`

### Las imágenes no suben
- Verifica que el bucket `menus` existe y es **public** en Supabase Storage
- Verifica las policies de storage (sección 8 del schema.sql)

### "MERCADOPAGO_ACCESS_TOKEN no está configurado"
- Asegúrate de que el env var está seteado en Vercel (no solo en `.env.local`)
- Después de cambiar env vars, necesitas **redeploy**

### El plan no se actualiza tras el pago
- Revisa los logs del webhook en Vercel → Functions → `/api/mercadopago/webhook`
- Verifica que el `external_reference` (userId) coincide con el `id` en `profiles`
- En sandbox, la activación puede tardar hasta 1 minuto en llegar al webhook

---

## Soporte

¿Problemas? Escribe a `hola@menupro.app` o abre un issue en GitHub.
