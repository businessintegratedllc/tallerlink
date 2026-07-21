# Cómo se asocian y pagan los talleres

## Flujo del dueño del taller

```
1. Entra a TallerLink (web)
2. Pantalla de registro (gratis): nombre, email, WhatsApp, nombre del taller
3. Usa el plan Free (límites)
4. Cuando se queda corto → Plan y pago → Pro ($29) o Body Shop ($49)
5. Stripe Checkout (tarjeta)
6. Vuelve a la app con ?billing=success → plan activado
7. Puede gestionar/cancelar en el Customer Portal de Stripe
```

## Planes

| Plan | Precio | Límites |
|------|--------|---------|
| **Free** | $0 | 8 vehículos activos · 15 cotizaciones/mes |
| **Pro** | $29/mes | Ilimitado + proyectos |
| **Body Shop** | $49/mes | Todo Pro + foco chapa/pintura |

## Qué hay en el código

| Pieza | Archivo |
|-------|---------|
| UI registro + planes + límites | `js/billing.js` |
| Crear sesión de pago Stripe | `netlify/functions/create-checkout.js` |
| Verificar pago al volver | `netlify/functions/verify-session.js` |
| Portal cancelar/tarjeta | `netlify/functions/create-portal.js` |
| Webhook (listo para DB) | `netlify/functions/stripe-webhook.js` |

## Setup Stripe (30–40 min)

### A. Cuenta y productos
1. Creá cuenta en [stripe.com](https://stripe.com) (modo **Test** primero).
2. Products → Add product:
   - **TallerLink Pro** — recurring monthly $29 → copiá el `price_...`
   - **TallerLink Body Shop** — recurring monthly $49 → `price_...`

### B. Netlify env vars
Site settings → Environment variables:

```
STRIPE_SECRET_KEY=sk_test_...
PRICE_PRO=price_...
PRICE_BODYSHOP=price_...
APP_URL=https://TU-SITIO.netlify.app
```

Redeploy del sitio.

### C. Probar
1. Abrí la app → registrá un taller de prueba  
2. Plan y pago → Suscribirme a Pro  
3. Tarjeta test Stripe: `4242 4242 4242 4242`  
4. Volvés a la app → plan Pro activo  

### D. Webhook (recomendado en producción)
1. Stripe → Developers → Webhooks → Add endpoint  
2. URL: `https://TU-SITIO.netlify.app/.netlify/functions/stripe-webhook`  
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`  
4. Copiá signing secret → `STRIPE_WEBHOOK_SECRET`

> Hoy el plan se activa en el navegador al volver del checkout.  
> El webhook queda preparado para cuando guardes planes en una base de datos (multi-dispositivo).

## Alternativa sin Functions: Payment Links

1. Stripe → Payment Links → create link for Pro price  
2. En `index.html` descomentá:

```html
<meta name="tl-payment-link-pro" content="https://buy.stripe.com/xxxx" />
<meta name="tl-payment-link-bodyshop" content="https://buy.stripe.com/yyyy" />
```

O setéá `PAYMENT_LINK_PRO` en Netlify (la function lo usa si no hay secret).

## Modo demo local (sin Stripe)

En la consola del navegador:

```js
localStorage.setItem('tallerlink_demo_billing', '1')
```

Luego “Suscribirme” activa el plan **sin cobro** (solo localhost o con ese flag).

## Límites Free (cómo se aplican)

- **Nuevo vehículo:** si ya hay 8 no entregados → bloquea y manda a Plan y pago  
- **Enviar cotización/presupuesto WA:** si ya mandó 15 este mes → bloquea  

Pro / Body Shop / trial: sin esos techos.

## Prueba Pro 14 días

En Plan y pago → **Probar Pro 14 días** (sin tarjeta).  
Sirve para conversión. En producción podés apagarlo o exigir tarjeta con trial de Stripe.

## Multi-dispositivo (siguiente paso técnico)

Hoy billing + OTs viven en `localStorage` del browser.  
Para que el pago en el PC del dueño valga en la tablet del taller:

1. Auth (magic link email)  
2. DB (Supabase/Firebase): `shops`, `subscriptions`, `ots`  
3. Webhook Stripe escribe `plan` en `shops`  
4. La app lee el plan del servidor al login  

El checkout y las functions **ya están alineados** con ese modelo (email como `client_reference_id`).

## Checklist go-live cobros

- [ ] Stripe Live keys (no test)  
- [ ] Prices live  
- [ ] `APP_URL` correcto  
- [ ] Webhook live + secret  
- [ ] Probar suscripción + cancelación portal  
- [ ] Texto legal: términos + política de reembolso  
- [ ] Factura/impuestos: Stripe Tax opcional si cobrás en varios países  
