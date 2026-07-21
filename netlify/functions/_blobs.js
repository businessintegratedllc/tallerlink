/**
 * Helper compartido para Netlify Blobs.
 * - connectLambda es necesario con el formato clásico exports.handler
 * - npm install debe correr en el build (ver netlify.toml)
 */
const blobs = require('@netlify/blobs');

function openStore(name, event) {
  const errors = [];

  // 1) Formato Functions v1: conectar el event de Lambda
  try {
    if (typeof blobs.connectLambda === 'function' && event) {
      blobs.connectLambda(event);
    }
  } catch (e) {
    errors.push('connectLambda: ' + (e.message || e));
  }

  // 2) getStore por nombre (producción Netlify)
  try {
    return blobs.getStore(name);
  } catch (e) {
    errors.push('getStore(name): ' + (e.message || e));
  }

  // 3) Con siteID + token explícitos (a veces hace falta)
  try {
    const siteID =
      process.env.SITE_ID ||
      process.env.NETLIFY_SITE_ID ||
      process.env.BLOBS_SITE_ID;
    const token =
      process.env.NETLIFY_BLOBS_TOKEN ||
      process.env.NETLIFY_API_TOKEN ||
      process.env.BLOBS_TOKEN;
    if (siteID && token) {
      return blobs.getStore({ name, siteID, token });
    }
    errors.push('getStore(opts): faltan SITE_ID / NETLIFY_BLOBS_TOKEN (solo si el auto-fail)');
  } catch (e) {
    errors.push('getStore(opts): ' + (e.message || e));
  }

  const err = new Error(
    'Netlify Blobs no disponible. ¿Corriste npm install en el build? ¿Deploy en Netlify (no file://)? Detalle: ' +
      errors.join(' | ')
  );
  err.code = 'blobs_unavailable';
  throw err;
}

async function storeGetJSON(store, key) {
  try {
    // API nueva
    const v = await store.get(key, { type: 'json' });
    return v ?? null;
  } catch (_) {
    try {
      // API setJSON/getJSON
      if (typeof store.getJSON === 'function') {
        return (await store.getJSON(key)) ?? null;
      }
    } catch (_) {}
    return null;
  }
}

async function storeSetJSON(store, key, value) {
  if (typeof store.setJSON === 'function') {
    await store.setJSON(key, value);
    return;
  }
  await store.set(key, JSON.stringify(value), { contentType: 'application/json' });
}

module.exports = { openStore, storeGetJSON, storeSetJSON };
