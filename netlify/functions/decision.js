/**
 * Aprobaciones del cliente → visibles en el panel del taller.
 *
 * POST JSON: { key, status: 'approved'|'rejected', otId, kind, quoteId?, plate?, customer? }
 * GET  ?key=...  |  ?otId=...  |  ?keys=a,b,c
 *
 * Requiere deploy en Netlify (usa Netlify Blobs).
 */

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors(), body: '' };
  }

  let store;
  try {
    store = getStore('tallerlink-decisions');
  } catch (err) {
    return json(503, {
      error: 'blobs_unavailable',
      message:
        'Netlify Blobs no disponible. Tiene que estar deployado en Netlify (no file://). En local usá: netlify dev',
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

      const key = sanitizeKey(
        body.key ||
          (body.otId && body.quoteId
            ? `${body.otId}_${body.quoteId}`
            : body.otId && body.kind
              ? `${body.otId}_${body.kind}`
              : body.otId)
      );
      if (!key) return json(400, { error: 'key_required' });

      const status =
        body.status === 'rejected' ? 'rejected' : body.status === 'approved' ? 'approved' : null;
      if (!status) return json(400, { error: 'status_must_be_approved_or_rejected' });

      const record = {
        key,
        status,
        otId: sanitizeKey(body.otId) || key.split('_')[0],
        kind: body.kind === 'project' ? 'project' : 'quote',
        quoteId: body.quoteId ? sanitizeKey(body.quoteId) : null,
        at: Number(body.at) || Date.now(),
        plate: body.plate ? String(body.plate).slice(0, 40) : null,
        customer: body.customer ? String(body.customer).slice(0, 80) : null,
      };

      await store.setJSON(key, record);

      const otId = record.otId;
      if (otId) {
        const idxKey = `idx_${otId}`;
        let idx = [];
        try {
          idx = (await store.get(idxKey, { type: 'json' })) || [];
        } catch (_) {
          idx = [];
        }
        if (!Array.isArray(idx)) idx = [];
        if (!idx.includes(key)) idx.push(key);
        await store.setJSON(idxKey, idx);
      }

      return json(200, { ok: true, record });
    }

    if (event.httpMethod === 'GET') {
      const qs = event.queryStringParameters || {};

      if (qs.key) {
        const key = sanitizeKey(qs.key);
        let record = null;
        try {
          record = await store.get(key, { type: 'json' });
        } catch (_) {}
        return json(200, { ok: true, record: record || null });
      }

      if (qs.otId) {
        const otId = sanitizeKey(qs.otId);
        let idx = [];
        try {
          idx = (await store.get(`idx_${otId}`, { type: 'json' })) || [];
        } catch (_) {
          idx = [];
        }
        if (!Array.isArray(idx)) idx = [];
        const records = [];
        for (const k of idx) {
          try {
            const r = await store.get(k, { type: 'json' });
            if (r) records.push(r);
          } catch (_) {}
        }
        return json(200, { ok: true, records });
      }

      if (qs.keys) {
        const keys = String(qs.keys)
          .split(',')
          .map(sanitizeKey)
          .filter(Boolean)
          .slice(0, 80);
        const records = [];
        for (const k of keys) {
          try {
            const r = await store.get(k, { type: 'json' });
            if (r) records.push(r);
          } catch (_) {}
        }
        return json(200, { ok: true, records });
      }

      return json(400, { error: 'key_or_otId_required' });
    }

    return json(405, { error: 'method_not_allowed' });
  } catch (err) {
    return json(500, { error: 'server_error', message: err.message });
  }
};

function sanitizeKey(k) {
  return String(k || '')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 120);
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
