/**
 * Lectura pública del plan por email (el taller lo consulta al abrir la app).
 * GET ?email=taller@x.com
 *
 * Escritura solo vía admin-plan + ADMIN_SECRET.
 */

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'method_not_allowed' });
  }

  const email = String((event.queryStringParameters || {}).email || '')
    .trim()
    .toLowerCase()
    .slice(0, 120);
  if (!email || !email.includes('@')) {
    return json(400, { error: 'email_required' });
  }

  let store;
  try {
    store = getStore('tallerlink-plans');
  } catch (err) {
    return json(503, { error: 'blobs_unavailable', detail: String(err.message || err) });
  }

  try {
    const key = 'u_' + email.replace(/[^a-z0-9@._+-]/g, '');
    const record = (await store.get(key, { type: 'json' })) || null;
    return json(200, { ok: true, email, record });
  } catch (err) {
    return json(500, { error: 'server_error', message: err.message });
  }
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...cors() },
    body: JSON.stringify(body),
  };
}
