# MenuPro — Setup Guide

Guía completa para poner MenuPro en producción en ~30 minutos.

## Arquitectura

```
Frontend:  Next.js 16 + TypeScript + Tailwind + shadcn/ui
Auth:      Supabase Auth (email+password + Google OAuth)
DB:        Supabase Postgres (con Row Level Security)
Storage:   Supabase Storage (imágenes de logos y platos)
Pagos:     Stripe (suscripción mensual S/35 ≈ $9 USD)
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

## 2) Configurar Stripe (~10 min)

### 2.1 Crear cuenta
1. Ve a https://dashboard.stripe.com → regístrate
2. Completa la verificación de cuenta (puede tardar 1-2 días en aprobarse, pero puedes usar **test mode** inmediatamente)

### 2.2 Crear producto y precio
1. Ve a **Products** → **Add product**
2. Nombre: `MenuPro Pro`
3. Descripción: `Suscripción mensual MenuPro Pro`
4. **Pricing**:
   - Type: **Recurring**
   - Interval: **Monthly**
   - Amount: `$9.00` (USD) — se mostrará como ≈S/35
   - Currency: **USD**
5. Click **Save product**
6. En la página del producto, copia el **Price ID** (`price_xxxxx`) → `STRIPE_PRICE_ID`

### 2.3 Obtener API keys
1. Ve a **Developers** → **API keys**
2. Copia:
   - `Publishable key` (`pk_test_xxx`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` (`sk_test_xxx`) → `STRIPE_SECRET_KEY`

### 2.4 Configurar webhook
1. Ve a **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://TU-DOMINIO/api/stripe/webhook` (ej: `https://menupro.vercel.app/api/stripe/webhook`)
3. En desarrollo local: usa **Stripe CLI** (ver abajo)
4. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. En la página del endpoint → **Signing secret** → **Reveal** → copia (`whsec_xxx`) → `STRIPE_WEBHOOK_SECRET`

### 2.5 Stripe CLI para desarrollo local
```bash
# Instalar Stripe CLI (macOS: brew install stripe/stripe-cli/stripe)
stripe login

# Escuchar eventos y reenviarlos a tu localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copia el whsec_XXX que aparece en la consola → STRIPE_WEBHOOK_SECRET en .env.local

# En otra terminal, para simular un pago:
stripe trigger checkout.session.completed
```

---

## 3) Configurar variables de entorno

Crea `.env.local` en la raíz del proyecto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

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
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://tu-app.vercel.app` (la URL que Vercel te dé)
4. Click **Deploy** — tarda 1-2 min
5. Obtén tu URL (ej: `menupro-xxx.vercel.app`)

### 5.3 Actualizar URLs externas
Una vez desplegado, actualiza:

**Supabase**:
- Authentication → URL Configuration → Site URL: `https://menupro-xxx.vercel.app`
- Redirect URLs: añade `https://menupro-xxx.vercel.app/auth/callback`

**Stripe**:
- Developers → Webhooks → edita tu endpoint → URL: `https://menupro-xxx.vercel.app/api/stripe/webhook`

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
- Stripe Webhook URL = `https://menupro.app/api/stripe/webhook`

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
- ✅ `/dashboard/billing` → click "Upgrade a Pro" → Checkout de Stripe se abre
- ✅ Completa el pago con tarjeta de prueba `4242 4242 4242 4242`
- ✅ Webhook se recibe → tu plan cambia a `pro` automáticamente
- ✅ Vuelves al dashboard → plan badge dice "Pro"
- ✅ En el editor de tu menú, ya no aparece el badge "Creado con MenuPro" en la vista previa
- ✅ Visita `/dashboard/[menuId]/qr` → QR se genera y se puede descargar

---

## Troubleshooting

### "Invalid login credentials" al registrarse
- Supabase por defecto requiere confirmación por email. Ve a **Authentication → Settings** y desactiva "Confirm email" si quieres login inmediato en desarrollo.

### Webhook de Stripe no llega
- Verifica `STRIPE_WEBHOOK_SECRET` en Vercel
- Usa Stripe CLI en local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- En Stripe Dashboard → Webhooks → tu endpoint → debería mostrar eventos recibidos

### Google OAuth redirige pero no vuelve
- Verifica Redirect URLs en Supabase → Authentication → URL Configuration
- Debe incluir `https://tu-url/auth/callback`

### Las imágenes no suben
- Verifica que el bucket `menus` existe y es **public** en Supabase Storage
- Verifica las policies de storage (sección 8 del schema.sql)

### "STRIPE_PRICE_ID no configurado"
- Asegúrate de que el env var `STRIPE_PRICE_ID` está seteado en Vercel (no solo en `.env.local`)
- Después de cambiar env vars, necesitas **redeploy**

---

## Soporte

¿Problemas? Escribe a `hola@menupro.app` o abre un issue en GitHub.
