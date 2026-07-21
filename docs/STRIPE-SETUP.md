# Conectar tu cuenta de Stripe a TallerLink

Guía paso a paso (modo Test primero, luego Live).

---

## Qué vas a lograr

El dueño del taller toca **Plan y pago → Suscribirme**  
→ se abre **Stripe Checkout**  
→ paga con tarjeta  
→ vuelve a tu web con el plan **Pro / Body Shop** activo.

---

## Paso 1 — Cuenta Stripe

1. Entrá a [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Completá el registro (país, email).
3. Arriba a la izquierda, dejá **Test mode** activado (interruptor).

---

## Paso 2 — Crear los productos de suscripción

1. Menú **Product catalog → Products → + Add product**

### Producto A — TallerLink Pro
- Name: `TallerLink Pro`
- Description: `Vehículos y cotizaciones ilimitados`
- Pricing model: **Recurring**
- Price: `29` USD (o tu moneda)
- Billing period: **Monthly**
- Guardá
- Abrí el precio creado y copiá el **Price ID** (`price_xxxxxxxxxxxxx`)

### Producto B — TallerLink Body Shop
- Igual con precio `49` / month  
- Copiá su `price_...`

Dejá esos dos IDs a mano.

---

## Paso 3 — API Key secreta

1. **Developers → API keys**
2. En Test mode, **Secret key** → Reveal → copiá `sk_test_...`
3. **Nunca** subas esta clave a GitHub ni al frontend.

---

## Paso 4 — Variables en Netlify

1. [app.netlify.com](https://app.netlify.com) → tu sitio **TallerLink**
2. **Site configuration → Environment variables → Add a variable**
3. Agregá:

| Variable | Valor |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `PRICE_PRO` | `price_...` (Pro) |
| `PRICE_BODYSHOP` | `price_...` (Body Shop) |
| `APP_URL` | `https://TU-SITIO.netlify.app` (sin barra final) |

4. **Save**
5. **Deploys → Trigger deploy → Clear cache and deploy site**  
   (si no redeployás, las functions no ven las variables nuevas)

---

## Paso 5 — Probar el pago

1. Abrí tu sitio en el navegador
2. Registrate como taller (email real o de prueba)
3. Menú **Plan y pago → Suscribirme** (Pro)
4. Debería abrir Stripe Checkout
5. Tarjeta de prueba:

```
Número: 4242 4242 4242 4242
Fecha:  cualquier futura (ej 12/34)
CVC:    123
ZIP:    12345
```

6. Confirmá el pago
7. Volvés a `/?billing=success&session_id=...`
8. El plan debe quedar **Pro**

Si sale error “Stripe no configurado”:
- Revisá nombres exactos de las env vars
- Confirmá que hiciste **redeploy**
- En Netlify → Functions → `create-checkout` → mirá logs

---

## Paso 6 — (Opcional) Customer Portal (cancelar / cambiar tarjeta)

1. Stripe → **Settings → Billing → Customer portal**
2. Activá el portal (permite cancelar suscripción, cambiar tarjeta)
3. En la app, usuarios Pro ven **Gestionar suscripción**  
   (llama a `create-portal`)

---

## Paso 7 — (Recomendado) Webhook

1. Stripe → **Developers → Webhooks → Add endpoint**
2. URL:

```
https://TU-SITIO.netlify.app/.netlify/functions/stripe-webhook
```

3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiá **Signing secret** `whsec_...`
5. Netlify env: `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Redeploy

> Hoy el plan se activa al volver del Checkout (`verify-session`).  
> El webhook queda listo para cuando tengas base de datos multi-dispositivo.

---

## Paso 8 — Pasar a producción (Live)

1. En Stripe, apagá **Test mode**
2. Creá de nuevo los Products/Prices en **Live** (u “activate” si aplica)
3. Copiá `sk_live_...` y los `price_` live
4. En Netlify reemplazá las env vars por las live
5. Actualizá `APP_URL` si hace falta
6. Redeploy
7. Completá verificación de negocio en Stripe (para cobrar de verdad)

---

## Alternativa rápida: Payment Links (sin Price IDs en código)

Si preferís no usar Checkout Session:

1. Stripe → **Payment links → New**
2. Elegí el producto Pro mensual
3. Copiá `https://buy.stripe.com/...`
4. Netlify env:

```
PAYMENT_LINK_PRO=https://buy.stripe.com/xxxx
PAYMENT_LINK_BODYSHOP=https://buy.stripe.com/yyyy
```

O en `index.html`:

```html
<meta name="tl-payment-link-pro" content="https://buy.stripe.com/xxxx" />
```

La function `create-checkout` usa el Payment Link si no hay `STRIPE_SECRET_KEY`.

---

## Demo local sin Stripe

En la consola del navegador (F12):

```js
localStorage.setItem('tallerlink_demo_billing', '1')
```

Luego “Suscribirme” activa el plan **sin cobro** (solo para probar la UI).

---

## Checklist

- [ ] Cuenta Stripe
- [ ] 2 precios mensuales (29 y 49)
- [ ] `STRIPE_SECRET_KEY` en Netlify
- [ ] `PRICE_PRO` y `PRICE_BODYSHOP`
- [ ] `APP_URL` = tu dominio Netlify
- [ ] Redeploy
- [ ] Pago test con 4242…
- [ ] Plan Pro visible en la app
- [ ] (Luego) Live keys + verificación Stripe

---

## Errores frecuentes

| Síntoma | Causa | Qué hacer |
|---------|--------|-----------|
| “Stripe no configurado” | Faltan env vars o no hubo redeploy | Agregar vars + Clear cache deploy |
| Checkout 500 | Price ID mal copiado | Verificar `price_` de Test mode |
| Vuelve pero sigue Free | `verify-session` falló / bloqueo | Mirar Functions logs; el success URL igual puede activar plan |
| Portal no abre | Sin customerId / portal off | Completar un pago primero; activar Customer portal en Stripe |
