/**
 * Admin de planes (PayPal manual).
 *
 * Headers: x-admin-key: <ADMIN_SECRET>
 * Env Netlify: ADMIN_SECRET=una-clave-larga-tuya
 *
 * GET  ?email=taller@x.com
 * POST { email, plan, status, note, days }
 * POST { action:'list' }
 */

const { openStore, storeGetJSON, storeSetJSON } = require('./_blobs');

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
      message: 'Definí ADMIN_SECRET en Netlify → Environment variables y hacé Clear cache and deploy.',
    });
  }

  if (String(given) !== String(adminKey)) {
    return json(401, {
      error: 'unauthorized',
      message: 'Clave admin incorrecta. Debe ser exactamente igual a ADMIN_SECRET.',
    });
  }

  let store;
  try {
    store = openStore('tallerlink-plans', event);
  } catch (err) {
    return json(503, {
      error: 'blobs_unavailable',
      message:
        'Blobs no disponible. Solución: 1) netlify.toml build = npm install  2) redeploy con clear cache  3) abrí la URL de Netlify (no localhost sin netlify dev).',
      detail: String(err.message || err),
    });
  }

  try {
    if (event.httpMethod === 'GET') {
      const email = normEmail((event.queryStringParameters || {}).email);
      if (!email) return json(400, { error: 'email_required' });
      const rec = await storeGetJSON(store, emailKey(email));
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
        const idx = (await storeGetJSON(store, '__index')) || [];
        const list = [];
        for (const em of (Array.isArray(idx) ? idx : []).slice(0, 200)) {
          const r = await storeGetJSON(store, emailKey(em));
          if (r) list.push(r);
        }
        list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        return json(200, { ok: true, list });
      }

      const email = normEmail(body.email);
      if (!email) return json(400, { error: 'email_required', message: 'Falta el email del taller' });

      let plan = String(body.plan || 'free').toLowerCase();
      if (!['free', 'pro', 'bodyshop'].includes(plan)) plan = 'free';

      let status = String(body.status || 'active').toLowerCase();
      if (!['active', 'past_due', 'canceled', 'blocked', 'trialing'].includes(status)) {
        status = 'active';
      }

      if (status === 'blocked' || plan === 'free') {
        plan = 'free';
        status = status === 'blocked' ? 'blocked' : 'active';
      }

      const days = Math.min(365, Math.max(1, parseInt(body.days, 10) || 30));
      const now = Date.now();
      const currentPeriodEnd =
        plan === 'free' ? null : body.currentPeriodEnd || now + days * 86400000;

      const record = {
        email,
        plan,
        status,
        note: String(body.note || '').slice(0, 300),
        updatedAt: now,
        currentPeriodEnd,
        source: 'admin',
      };

      await storeSetJSON(store, emailKey(email), record);

      let idx = (await storeGetJSON(store, '__index')) || [];
      if (!Array.isArray(idx)) idx = [];
      if (!idx.includes(email)) idx.unshift(email);
      idx = idx.slice(0, 500);
      await storeSetJSON(store, '__index', idx);

      return json(200, { ok: true, record });
    }

    return json(405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(500, {
      error: 'server_error',
      message: err.message,
      detail: String(err.stack || '').slice(0, 500),
    });
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
