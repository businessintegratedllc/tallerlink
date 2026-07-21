/**
 * Webhook de Stripe (producción).
 * Configurá en Stripe Dashboard → Webhooks → endpoint:
 *   https://TU_DOMINIO/.netlify/functions/stripe-webhook
 * Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *
 * Nota: este MVP no tiene base de datos. El plan se activa en el browser
 * vía verify-session / success URL. El webhook queda listo para cuando
 * agregues DB (Supabase/Firebase) y guardes email → plan.
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Without webhook secret we still ack (dev)
  if (!secret || !whSecret) {
    console.log('Webhook received (no verify — configure STRIPE_WEBHOOK_SECRET)');
    return { statusCode: 200, body: JSON.stringify({ received: true, verified: false }) };
  }

  // Full signature verification requires raw body + stripe SDK.
  // En producción instalá stripe y verificá:
  //   stripe.webhooks.constructEvent(event.body, sig, whSecret)
  // Aquí dejamos el esqueleto y log.
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  console.log('stripe-webhook', { hasSig: !!sig, len: (event.body || '').length });

  try {
    const payload = JSON.parse(event.body || '{}');
    const type = payload.type;
    const obj = payload.data && payload.data.object;

    if (type === 'checkout.session.completed') {
      console.log('checkout.session.completed', {
        email: obj.customer_email || obj.customer_details?.email,
        customer: obj.customer,
        subscription: obj.subscription,
        plan: obj.metadata?.plan,
      });
      // TODO: upsert en DB: email → plan pro/bodyshop
    }

    if (type === 'customer.subscription.deleted') {
      console.log('subscription.deleted', { customer: obj.customer });
      // TODO: downgrade a free en DB
    }

    if (type === 'customer.subscription.updated') {
      console.log('subscription.updated', {
        customer: obj.customer,
        status: obj.status,
      });
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }
};
