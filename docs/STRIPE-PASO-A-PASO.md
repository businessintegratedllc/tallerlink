# Stripe paso a paso (1 a 1) — TallerLink

Hacé esto **en orden**. No saltees el redeploy.

Tiempo estimado: 25–40 minutos la primera vez.

---

## Antes de empezar

Necesitás:

- [ ] Cuenta de email
- [ ] Sitio TallerLink ya en **Netlify** (URL tipo `https://algo.netlify.app`)
- [ ] Acceso al panel de Netlify de ese sitio
- [ ] 25 minutos sin prisa

Si todavía no deployaste en Netlify, primero:

1. Subí el código a GitHub  
2. Netlify → Import repo → publish `.` → Deploy  
3. Anotá tu URL: `https://________________.netlify.app`

---

# PARTE A — Crear / entrar a Stripe

### Paso 1
Abrí el navegador e andá a:

**https://dashboard.stripe.com/register**

### Paso 2
Registrate con tu email (o “Sign in” si ya tenés cuenta).

### Paso 3
Completá país / tipo de negocio cuando te lo pida.  
Podés usar datos reales de tu proyecto.

### Paso 4
Entrá al Dashboard.

### Paso 5 — Modo TEST (importante)
Arriba a la derecha (o izquierda, según la UI), buscá el interruptor:

**Test mode** → debe estar **ON** (activado).

Todo lo que sigue en esta guía es en Test hasta el final.

---

# PARTE B — Crear los planes de suscripción

### Paso 6
Menú izquierdo: **Product catalog** → **Products**

### Paso 7
Clic en **+ Add product**

### Paso 8 — Producto Pro
Completá:

| Campo | Valor |
|--------|--------|
| Name | `TallerLink Pro` |
| Description | `Vehículos y cotizaciones ilimitados` |

En **Price**:

| Campo | Valor |
|--------|--------|
| Pricing model | `Recurring` |
| Amount | `29` |
| Currency | `USD` (o la tuya) |
| Billing period | `Monthly` |

### Paso 9
Clic en **Save product** (o Add product).

### Paso 10 — Copiar el Price ID de Pro
1. Entrá al producto **TallerLink Pro**
2. En la sección de precio, vas a ver algo como:  
   `price_1Abc2Def3Ghi4Jkl`
3. Clic para copiar
4. Pegalo en un bloc de notas:

```
PRICE_PRO=price_________________
```

### Paso 11 — Producto Body Shop
Otra vez **+ Add product**:

| Campo | Valor |
|--------|--------|
| Name | `TallerLink Body Shop` |
| Description | `Pro + foco enderezado y pintura` |
| Recurring monthly | `49` USD |

### Paso 12 — Copiar Price ID Body Shop

```
PRICE_BODYSHOP=price_________________
```

---

# PARTE C — Sacar la clave secreta

### Paso 13
Menú: **Developers** → **API keys**

### Paso 14
Confirmá que sigue **Test mode ON**.

### Paso 15
En **Standard keys** → **Secret key** → **Reveal test key**

### Paso 16
Copiá la clave que empieza con `sk_test_...`

```
STRIPE_SECRET_KEY=sk_test_________________
```

⚠️ **Nunca** la pongas en el código frontend ni en un commit público.  
Solo en Netlify Environment variables.

---

# PARTE D — Pegar todo en Netlify

### Paso 17
Abrí **https://app.netlify.com**

### Paso 18
Entrá al sitio de TallerLink.

### Paso 19
Menú: **Site configuration** (o Site settings)

### Paso 20
**Environment variables** → **Add a variable** / **Add environment variables**

### Paso 21 — Agregá estas 4 variables una por una

#### Variable 1
- Key: `STRIPE_SECRET_KEY`  
- Value: tu `sk_test_...`  
- Scopes: All scopes (o Production + Deploy previews)

#### Variable 2
- Key: `PRICE_PRO`  
- Value: tu `price_...` de Pro  

#### Variable 3
- Key: `PRICE_BODYSHOP`  
- Value: tu `price_...` de Body Shop  

#### Variable 4
- Key: `APP_URL`  
- Value: tu URL de Netlify **sin barra al final**  

Ejemplo:

```
https://tallerlink-abc123.netlify.app
```

### Paso 22
Guardá (**Save** / **Create variable**).

### Paso 23 — REDEPLOY (obligatorio)
Si no redeployás, las functions **no ven** las variables nuevas.

1. Menú **Deploys**
2. **Trigger deploy**
3. **Clear cache and deploy site**
4. Esperá a que quede **Published** (verde)

---

# PARTE E — Probar el pago

### Paso 24
Abrí tu sitio Netlify en una ventana limpia (mejor incógnito).

### Paso 25
Registrate como taller (nombre, email, WhatsApp, nombre del taller).

### Paso 26
En el menú lateral tocá **Plan y pago**.

### Paso 27
En la tarjeta **Pro**, clic en **Suscribirme**.

### Paso 28 — Qué debería pasar
Se abre una página de **Stripe Checkout** (hosted por Stripe).

Si sale un alert de “Stripe no configurado”:
- Volvé al Paso 21 (nombres exactos de variables)
- Paso 23 (redeploy con clear cache)
- Netlify → **Functions** → `create-checkout` → mirá el log del error

### Paso 29 — Tarjeta de prueba
Usá exactamente:

```
Card number:  4242 4242 4242 4242
Expiry:       12/34  (cualquier fecha futura)
CVC:          123
Name:         Test User
Country:      el que sea
```

### Paso 30
Clic en **Subscribe** / Pagar.

### Paso 31
Stripe te devuelve a tu web, algo como:

```
https://tu-sitio.netlify.app/?billing=success&plan=pro&session_id=cs_test_...
```

### Paso 32
En **Plan y pago** deberías ver el badge **Pro**.

### Paso 33 — Verificar en Stripe
Dashboard Stripe (Test) → **Payments** o **Subscriptions**  
Debería aparecer el pago / la suscripción de prueba.

---

# PARTE F — Portal del cliente (cancelar / cambiar tarjeta)

### Paso 34
Stripe → **Settings** → **Billing** → **Customer portal**

### Paso 35
Activá el portal. Permití al menos:
- Update payment method
- Cancel subscription

### Paso 36
Save.

### Paso 37
En la app (usuario Pro) → **Gestionar suscripción**  
Debería abrir el portal de Stripe.

---

# PARTE G — Webhook (recomendado, no bloquea el cobro)

### Paso 38
Stripe → **Developers** → **Webhooks** → **Add endpoint**

### Paso 39 — URL del endpoint

```
https://TU-SITIO.netlify.app/.netlify/functions/stripe-webhook
```

Reemplazá `TU-SITIO` por tu subdominio real.

### Paso 40 — Eventos a escuchar
Seleccioná:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Paso 41
Add endpoint.

### Paso 42
Abrí el endpoint → **Reveal** signing secret (`whsec_...`)

### Paso 43
Netlify → Environment variables:

```
STRIPE_WEBHOOK_SECRET=whsec_________________
```

### Paso 44
Otra vez: **Clear cache and deploy site**.

> El cobro ya funciona sin webhook.  
> El webhook sirve para el futuro (base de datos multi-dispositivo).

---

# PARTE H — Cobrar de verdad (Live)

Hacelo solo cuando el flujo test funcione perfecto.

### Paso 45
En Stripe, apagá **Test mode** (Live mode).

### Paso 46
Creá de nuevo los productos Pro $29 y Body Shop $49 en **Live**  
(o usá el flujo que Stripe ofrezca para activar).

### Paso 47
Copiá:
- `sk_live_...`
- `price_...` live de Pro
- `price_...` live de Body Shop

### Paso 48
En Netlify, **reemplazá** las 3 variables de test por las live.

### Paso 49
Completá la verificación de negocio / banco en Stripe  
(Settings → Business / Payouts) para poder recibir plata.

### Paso 50
Redeploy + probá con una tarjeta real de $29 (y cancelá después si querés).

---

# Atajos y emergencias

## ¿Solo quiero un link de pago sin Functions?

1. Stripe → **Payment links** → New  
2. Elegí precio Pro mensual  
3. Copiá `https://buy.stripe.com/...`
4. Netlify env:

```
PAYMENT_LINK_PRO=https://buy.stripe.com/xxxx
PAYMENT_LINK_BODYSHOP=https://buy.stripe.com/yyyy
```

5. Redeploy  
(La function usa el link si no hay secret, o como fallback)

## ¿Quiero probar la UI sin Stripe?

En la consola del navegador (F12 → Console):

```js
localStorage.setItem('tallerlink_demo_billing', '1')
```

Recargá → Suscribirme → activa Pro **sin cobro**.

## Errores frecuentes

| Qué ves | Qué hacer |
|---------|-----------|
| “Stripe no configurado” | Faltan env vars o no hubo Clear cache deploy |
| Checkout en blanco / 500 | `PRICE_PRO` mal copiado (tiene que ser de Test si usás sk_test) |
| Vuelve a la app pero sigue Free | Mirar Functions → verify-session logs; probar de nuevo el flujo |
| “price not configured” | Nombre de variable distinto a `PRICE_PRO` |
| Portal no abre | Hacé un pago test primero; activá Customer portal |

---

# Checklist final (imprimible)

- [ ] Stripe cuenta creada  
- [ ] Test mode ON  
- [ ] Producto Pro $29 + `price_`  
- [ ] Producto Body Shop $49 + `price_`  
- [ ] `sk_test_` copiada  
- [ ] Netlify: `STRIPE_SECRET_KEY`  
- [ ] Netlify: `PRICE_PRO`  
- [ ] Netlify: `PRICE_BODYSHOP`  
- [ ] Netlify: `APP_URL`  
- [ ] Clear cache and deploy  
- [ ] Suscribirme funciona  
- [ ] Pago 4242… OK  
- [ ] Badge Pro en la app  
- [ ] (Opcional) Customer portal  
- [ ] (Opcional) Webhook  
- [ ] (Después) Live keys  

---

**Listo.** Con la Parte E funcionando, los talleres ya pueden asociarse (registro Free) y pagar la suscripción Pro/Body Shop con tu cuenta Stripe.
