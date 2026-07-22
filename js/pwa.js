/**
 * TallerLink PWA — registro SW + botón "Instalar app"
 */
(function () {
  'use strict';

  // No correr en vista cliente (links de cotización)
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('c') || q.get('s') || /\/c\/[a-z0-9]+/i.test(location.pathname || '')) return;
  } catch (_) {}

  let deferredPrompt = null;

  function toast(msg) {
    if (window.toast) window.toast(msg);
  }

  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  function ensureInstallBtn() {
    if (document.getElementById('btnInstallPwa')) return document.getElementById('btnInstallPwa');
    const top = document.querySelector('.topbar-actions');
    if (!top) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'btnInstallPwa';
    b.className = 'btn btn-soft btn-sm';
    b.textContent = '⬇ Instalar app';
    b.title = 'Instalar TallerLink en este dispositivo';
    b.style.display = 'none';
    top.appendChild(b);
    b.addEventListener('click', async () => {
      // iOS: no hay beforeinstallprompt
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (ios && !deferredPrompt) {
        alert(
          'En iPhone/iPad:\n\n1) Tocá el botón Compartir ⎋\n2) “Añadir a pantalla de inicio”\n3) Agregar\n\nQueda como app con el icono de TallerLink.'
        );
        return;
      }
      if (!deferredPrompt) {
        alert(
          'Para instalar:\n\n• Chrome/Edge: menú ⋮ → “Instalar TallerLink” o “Instalar aplicación”\n• Android Chrome: “Agregar a la pantalla de inicio”\n\nSi no aparece, abrí https://tallerlink.netlify.app en Chrome.'
        );
        return;
      }
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      b.style.display = 'none';
      if (choice && choice.outcome === 'accepted') toast('App instalada');
    });
    return b;
  }

  function showInstall() {
    if (isStandalone()) return;
    const b = ensureInstallBtn();
    if (b) b.style.display = '';
  }

  // beforeinstallprompt (Chrome/Edge/Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstall();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const b = document.getElementById('btnInstallPwa');
    if (b) b.style.display = 'none';
    toast('TallerLink instalado como app');
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // update when new SW
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        })
        .catch((err) => console.warn('SW register failed', err));
    });
  }

  // iOS always show soft install hint button
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !isStandalone()) {
    setTimeout(showInstall, 800);
  }

  // Deep links from shortcuts / query
  function handleLaunchQuery() {
    const q = new URLSearchParams(location.search);
    const view = q.get('view');
    const action = q.get('action');
    if (view && typeof window.__tlSetView === 'function') {
      setTimeout(() => window.__tlSetView(view), 300);
    }
    if (action === 'new') {
      setTimeout(() => {
        const btn = document.getElementById('btnNewOT');
        if (btn) btn.click();
      }, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleLaunchQuery);
  } else {
    setTimeout(handleLaunchQuery, 0);
  }
})();
