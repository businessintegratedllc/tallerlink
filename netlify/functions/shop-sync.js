/**
 * Sincroniza los datos del taller entre dispositivos (PC ↔ celular).
 * Clave = email de registro del taller.
 *
 * GET  ?email=
 * POST { email, data, updatedAt?, deviceId? }
 *      - Si el servidor tiene data más nueva, devuelve { conflict:true, data, updatedAt }
 *      - Si acepta el push: { ok:true, updatedAt }
 */

const { openStore, storeGetJSON, storeSetJSON } = require('./_blobs');

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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

function normEmail(e) {
  return String(e || '')
    .trim()
    .toLowerCase()
    .slice(0, 120);
}

function emailKey(email) {
  return 'shop_' + email.replace(/[^a-z0-9@._+-]/g, '');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }

  let store;
  try {
    store = openStore('tallerlink-shops', event);
  } catch (err) {
    return json(503, {
      error: 'blobs_unavailable',
      message: 'Sync no disponible. Redeploy con npm install.',
      detail: String(err.message || err),
    });
  }

  try {
    if (event.httpMethod === 'GET') {
      const email = normEmail((event.queryStringParameters || {}).email);
      if (!email || !email.includes('@')) {
        return json(400, { error: 'email_required' });
      }
      const rec = await storeGetJSON(store, emailKey(email));
      if (!rec) return json(200, { ok: true, empty: true, data: null, updatedAt: 0 });
      return json(200, {
        ok: true,
        empty: false,
        data: rec.data || null,
        updatedAt: rec.updatedAt || 0,
        deviceId: rec.deviceId || null,
      });
    }

    if (event.httpMethod === 'POST') {
      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { error: 'invalid_json' });
      }

      const email = normEmail(body.email);
      if (!email || !email.includes('@')) {
        return json(400, { error: 'email_required' });
      }
      if (!body.data || typeof body.data !== 'object') {
        return json(400, { error: 'data_required' });
      }

      // tamaño máximo ~1.5MB JSON
      const raw = JSON.stringify(body.data);
      if (raw.length > 1500000) {
        return json(413, { error: 'payload_too_large' });
      }

      const clientUpdated = Number(body.updatedAt) || 0;
      const existing = await storeGetJSON(store, emailKey(email));
      const serverUpdated = (existing && existing.updatedAt) || 0;

      // Si el servidor es más nuevo y el cliente no fuerza, devolver conflicto
      if (existing && serverUpdated > clientUpdated && !body.force) {
        return json(200, {
          ok: false,
          conflict: true,
          data: existing.data,
          updatedAt: serverUpdated,
          deviceId: existing.deviceId || null,
        });
      }

      const now = Date.now();
      const record = {
        email,
        data: body.data,
        updatedAt: Math.max(now, clientUpdated),
        deviceId: body.deviceId ? String(body.deviceId).slice(0, 64) : null,
      };
      await storeSetJSON(store, emailKey(email), record);

      return json(200, {
        ok: true,
        updatedAt: record.updatedAt,
        saved: true,
      });
    }

    return json(405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(500, { error: 'server_error', message: err.message });
  }
};
