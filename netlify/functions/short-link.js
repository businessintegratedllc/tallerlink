/**
 * Links cortos para WhatsApp.
 *
 * POST { payload }  → { ok, id, path, url }
 * GET  ?id=x7k2m9   → { ok, payload }
 *
 * URL pública: https://tu-sitio.netlify.app/c/x7k2m9
 */

const { openStore, storeGetJSON, storeSetJSON } = require('./_blobs');

function makeId(len = 7) {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789'; // sin confusos 0/o/1/l
  let s = '';
  const cryptoObj = require('crypto');
  const bytes = cryptoObj.randomBytes(len);
  for (let i = 0; i < len; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}

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

function appOrigin(event) {
  if (process.env.APP_URL) return String(process.env.APP_URL).replace(/\/$/, '');
  const proto = event.headers['x-forwarded-proto'] || 'https';
  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  if (host) return proto + '://' + host;
  return '';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }

  let store;
  try {
    store = openStore('tallerlink-links', event);
  } catch (err) {
    return json(503, {
      error: 'blobs_unavailable',
      message: 'No se pueden guardar links cortos. Redeploy con npm install.',
      detail: String(err.message || err),
    });
  }

  try {
    if (event.httpMethod === 'POST') {
      let body = {};
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return json(400, { error: 'invalid_json' });
      }

      const payload = body.payload;
      if (!payload || typeof payload !== 'object') {
        return json(400, { error: 'payload_required' });
      }

      // límite razonable
      const raw = JSON.stringify(payload);
      if (raw.length > 120000) {
        return json(413, { error: 'payload_too_large' });
      }

      let id = makeId(7);
      // evitar colisión (muy raro)
      for (let i = 0; i < 3; i++) {
        const existing = await storeGetJSON(store, id);
        if (!existing) break;
        id = makeId(8);
      }

      const record = {
        id,
        payload,
        createdAt: Date.now(),
        // opcional: caduca en 180 días (soft)
        expiresAt: Date.now() + 180 * 86400000,
      };

      await storeSetJSON(store, id, record);

      const origin = appOrigin(event);
      const path = '/c/' + id;
      return json(200, {
        ok: true,
        id,
        path,
        url: origin ? origin + path : path,
      });
    }

    if (event.httpMethod === 'GET') {
      const id = String((event.queryStringParameters || {}).id || '')
        .replace(/[^a-z0-9]/gi, '')
        .slice(0, 16);
      if (!id) return json(400, { error: 'id_required' });

      const record = await storeGetJSON(store, id);
      if (!record || !record.payload) {
        return json(404, { error: 'not_found' });
      }
      if (record.expiresAt && Date.now() > record.expiresAt) {
        return json(410, { error: 'expired' });
      }
      return json(200, { ok: true, id, payload: record.payload, createdAt: record.createdAt });
    }

    return json(405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(500, { error: 'server_error', message: err.message });
  }
};
