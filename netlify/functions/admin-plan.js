/**
 * Admin de planes (PayPal manual).
 *
 * Headers: x-admin-key: <ADMIN_SECRET>
 * Env Netlify: ADMIN_SECRET=una-clave-larga-tuya
 *
 * GET  ?email=taller@x.com          → { plan, status, ... }
 * POST { email, plan, status, note, days }  → guarda plan del email
 * POST { action:'list' }            → lista reciente (máx 200)
 *
 * plan: free | pro | bodyshop
 * status: active | past_due | canceled | blocked
 */

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }

  const adminKey = process.env.ADMIN_SECRET || '';
  const given =
    event.headers['x-admin-key'] ||
    event.headers['X-Admin-Key'] ||
    (event.queryStringParameters && event.queryStringParameters.key) ||
    '';

  if (!adminKey) {
    return json(503, {
      error: 'admin_not_configured',
      message: 'Definí ADMIN_SECRET en Netlify Environment variables y redeploy.',
    });
  }

  if (String(given) !== String(adminKey)) {
    return json(401, { error: 'unauthorized' });
  }

  let store;
  try {
    store = getStore('tallerlink-plans');
  } catch (err) {
    return json(503, { error: 'blobs_unavailable', detail: String(err.message || err) });
  }

  try {
    if (event.httpMethod === 'GET') {
      const email = normEmail((event.queryStringParameters || {}).email);
      if (!email) return json(400, { error: 'email_required' });
      const rec = (await store.get(emailKey(email), { type: 'json' })) || null;
      return json(200, { ok: true, email, record: rec });
    }

    if (event.httpMethod === 'POST') {
      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { error: 'invalid_json' });
      }

      if (body.action === 'list') {
        const idx = (await store.get('__index', { type: 'json' })) || [];
        const list = [];
        for (const em of (idx || []).slice(0, 200)) {
          try {
            const r = await store.get(emailKey(em), { type: 'json' });
            if (r) list.push(r);
          } catch (_) {}
        }
        list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        return json(200, { ok: true, list });
      }

      const email = normEmail(body.email);
      if (!email) return json(400, { error: 'email_required' });

      let plan = String(body.plan || 'free').toLowerCase();
      if (!['free', 'pro', 'bodyshop'].includes(plan)) plan = 'free';

      let status = String(body.status || (plan === 'free' ? 'active' : 'active')).toLowerCase();
      if (!['active', 'past_due', 'canceled', 'blocked', 'trialing'].includes(status)) {
        status = 'active';
      }

      // blocked = forzar free
      if (status === 'blocked' || plan === 'free') {
        plan = 'free';
        if (status === 'blocked') status = 'blocked';
        else status = 'active';
      }

      const days = Math.min(365, Math.max(1, parseInt(body.days, 10) || 30));
      const now = Date.now();
      const currentPeriodEnd =
        plan === 'free' ? null : body.currentPeriodEnd || now + days * 86400000;

      const record = {
        email,
        plan,
        status: status === 'blocked' ? 'blocked' : status,
        note: String(body.note || '').slice(0, 300),
        updatedAt: now,
        currentPeriodEnd,
        source: 'admin',
      };

      await store.setJSON(emailKey(email), record);

      // index
      let idx = [];
      try {
        idx = (await store.get('__index', { type: 'json' })) || [];
      } catch (_) {
        idx = [];
      }
      if (!Array.isArray(idx)) idx = [];
      if (!idx.includes(email)) idx.unshift(email);
      idx = idx.slice(0, 500);
      await store.setJSON('__index', idx);

      return json(200, { ok: true, record });
    }

    return json(405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(500, { error: 'server_error', message: err.message });
  }
};

function normEmail(e) {
  return String(e || '')
    .trim()
    .toLowerCase()
    .slice(0, 120);
}

function emailKey(email) {
  return 'u_' + email.replace(/[^a-z0-9@._+-]/g, '');
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...cors() },
    body: JSON.stringify(body),
  };
}
