/**
 * Stripe Customer Portal — el taller gestiona tarjeta / cancela.
 * Env: STRIPE_SECRET_KEY, APP_URL
 * Body JSON: { customerId } o { email }
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return json(503, { error: 'stripe_not_configured' });

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  let customerId = body.customerId;

  try {
    if (!customerId && body.email) {
      const q = new URLSearchParams({ email: body.email, limit: '1' });
      const cr = await fetch('https://api.stripe.com/v1/customers?' + q.toString(), {
        headers: { Authorization: 'Bearer ' + secret },
      });
      const cd = await cr.json();
      customerId = cd.data && cd.data[0] && cd.data[0].id;
    }

    if (!customerId) return json(404, { error: 'customer_not_found' });

    const params = new URLSearchParams();
    params.set('customer', customerId);
    params.set('return_url', (process.env.APP_URL || 'http://localhost:8888') + '/?view=billing');

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + secret,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) return json(res.status, { error: data.error || data });
    return json(200, { url: data.url });
  } catch (err) {
    return json(500, { error: err.message });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}
