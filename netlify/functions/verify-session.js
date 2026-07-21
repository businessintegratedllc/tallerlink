/**
 * Verifica una Checkout Session de Stripe tras el return URL.
 * GET /.netlify/functions/verify-session?session_id=cs_...
 */

exports.handler = async (event) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  const sessionId = (event.queryStringParameters || {}).session_id;

  if (!sessionId) {
    return json(400, { ok: false, error: 'session_id_required' });
  }

  if (!secret) {
    // Without Stripe, accept success URL as soft confirmation (demo only)
    return json(200, {
      ok: true,
      plan: (event.queryStringParameters || {}).plan || 'pro',
      demo: true,
    });
  }

  try {
    const res = await fetch(
      'https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(sessionId),
      {
        headers: { Authorization: 'Bearer ' + secret },
      }
    );
    const session = await res.json();
    if (!res.ok) {
      return json(res.status, { ok: false, error: session.error || session });
    }

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return json(402, { ok: false, error: 'not_paid', status: session.status });
    }

    const plan =
      (session.metadata && session.metadata.plan) ||
      (session.subscription_details && session.subscription_details.metadata &&
        session.subscription_details.metadata.plan) ||
      'pro';

    return json(200, {
      ok: true,
      plan: plan === 'bodyshop' ? 'bodyshop' : 'pro',
      customerId: session.customer,
      subscriptionId: session.subscription,
      email: session.customer_details?.email || session.customer_email,
      currentPeriodEnd: null,
    });
  } catch (err) {
    return json(500, { ok: false, error: err.message });
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
