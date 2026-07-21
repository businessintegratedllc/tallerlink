/**
 * Crea una sesión de Stripe Checkout para suscripción del taller.
 * Env vars (Netlify):
 *   STRIPE_SECRET_KEY=sk_live_... o sk_test_...
 *   PRICE_PRO=price_...
 *   PRICE_BODYSHOP=price_...
 *   PAYMENT_LINK_PRO=https://buy.stripe.com/...  (opcional fallback)
 *   PAYMENT_LINK_BODYSHOP=https://buy.stripe.com/...
 *   APP_URL=https://tu-app.netlify.app
 */

const PRICE_MAP = {
  pro: process.env.PRICE_PRO,
  bodyshop: process.env.PRICE_BODYSHOP || process.env.PRICE_PRO,
};

const LINK_MAP = {
  pro: process.env.PAYMENT_LINK_PRO,
  bodyshop: process.env.PAYMENT_LINK_BODYSHOP || process.env.PAYMENT_LINK_PRO,
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const plan = body.plan === 'bodyshop' ? 'bodyshop' : 'pro';
  const email = (body.email || '').trim().toLowerCase();
  const successUrl =
    body.successUrl ||
    `${process.env.APP_URL || 'http://localhost:8888'}/?billing=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl =
    body.cancelUrl || `${process.env.APP_URL || 'http://localhost:8888'}/?billing=cancel`;

  if (!email) return json(400, { error: 'email_required' });

  const secret = process.env.STRIPE_SECRET_KEY;

  // Fallback: Payment Link without API
  if (!secret) {
    const paymentLink = LINK_MAP[plan];
    if (paymentLink) {
      const url =
        paymentLink +
        (paymentLink.includes('?') ? '&' : '?') +
        'prefilled_email=' +
        encodeURIComponent(email);
      return json(200, { paymentLink: url, method: 'payment_link' });
    }
    return json(503, {
      error: 'stripe_not_configured',
      message: 'Set STRIPE_SECRET_KEY + PRICE_PRO (or PAYMENT_LINK_PRO) in Netlify env.',
    });
  }

  const priceId = PRICE_MAP[plan];
  if (!priceId) {
    return json(503, {
      error: 'price_not_configured',
      message: `Missing env PRICE_${plan.toUpperCase()}`,
    });
  }

  try {
    const params = new URLSearchParams();
    params.set('mode', 'subscription');
    params.set('success_url', successUrl.includes('{CHECKOUT_SESSION_ID}')
      ? successUrl
      : successUrl + (successUrl.includes('?') ? '&' : '?') + 'session_id={CHECKOUT_SESSION_ID}');
    params.set('cancel_url', cancelUrl);
    params.set('client_reference_id', email);
    params.set('customer_email', email);
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('allow_promotion_codes', 'true');
    params.set('billing_address_collection', 'auto');
    params.set('metadata[plan]', plan);
    params.set('metadata[product]', 'tallerlink');
    params.set('subscription_data[metadata][plan]', plan);
    params.set('subscription_data[metadata][email]', email);
    if (body.shopName) params.set('metadata[shopName]', String(body.shopName).slice(0, 120));

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + secret,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return json(res.status, { error: 'stripe_error', details: data.error || data });
    }

    return json(200, {
      url: data.url,
      sessionId: data.id,
      method: 'checkout_session',
    });
  } catch (err) {
    return json(500, { error: 'server_error', message: err.message });
  }
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...cors() },
    body: JSON.stringify(body),
  };
}
